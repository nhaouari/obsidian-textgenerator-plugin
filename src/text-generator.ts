import { TemplateModalUI } from "./ui/template-modal-ui";
import { App, Notice, Editor, EditorPosition, TFile } from "obsidian";
import { TextGeneratorSettings } from "./types";
import TextGeneratorPlugin from "./main";
import ReqFormatter from "./api-request-formatter";
import { SetPath } from "./ui/settings/components/set-path";
import ContextManager from "./context-manager";
import { makeid, createFileWithInput, openFile } from "./utils";
import safeAwait from "safe-await";
import debug from "debug";
import RequestHandler from "./services/api-service";
const logger = debug("textgenerator:TextGenerator");
const heavyLogger = debug("textgenerator:TextGenerator:heavy");

import EmbeddingScope from "./scope/embeddings";

export default class TextGenerator extends RequestHandler {
  plugin: TextGeneratorPlugin;
  reqFormatter: ReqFormatter;
  contextManager: ContextManager;
  signal: AbortSignal;

  embeddingsScope: EmbeddingScope;

  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(plugin);
    this.plugin = plugin;

    this.embeddingsScope = new EmbeddingScope();
    this.contextManager = new ContextManager(app, plugin);
    this.reqFormatter = new ReqFormatter(app, plugin, this.contextManager);
  }

  getCursor(editor: Editor) {
    logger("getCursor");
    const cursor = editor.getCursor();
    let selectedText = editor.getSelection();
    if (selectedText.length === 0) {
      const lineNumber = editor.getCursor().line;
      selectedText = editor.getLine(lineNumber);
      if (selectedText.length !== 0) {
        cursor.ch = selectedText.length;
        if (selectedText[selectedText.length - 1] === " ") {
          cursor.ch = selectedText.length - 1;
        }
      }
    }
    logger("getCursor end");
    return cursor;
  }

  async generateFromTemplate(
    params: TextGeneratorSettings,
    templatePath: string,
    insertMetadata = true,
    editor: Editor,
    activeFile = true
  ) {
    logger("generateFromTemplate");
    const cursor = this.getCursor(editor);

    const [errorContext, context] = await safeAwait(
      this.contextManager.getContext(editor, insertMetadata, templatePath)
    );

    if (!context) {
      return Promise.reject("context doesn't exist");
    }

    const text = await this.generate(
      context,
      insertMetadata,
      params,
      templatePath
    );

    if (errorContext) {
      return Promise.reject(errorContext);
    }

    if (activeFile === false) {
      const title = app.workspace.activeLeaf?.getDisplayText();
      const suggestedPath =
        "textgenerator/generations/" + title + "-" + makeid(3) + ".md";

      new SetPath(app, suggestedPath, async (path: string) => {
        const [errorFile, file] = await safeAwait(
          createFileWithInput(path, context.context + text, app)
        );
        if (errorFile) {
          return Promise.reject(errorFile);
        }

        openFile(app, file);
      }).open();
    } else {
      const mode = this.getMode(context);
      this.insertGeneratedText(text, editor, cursor, mode);
    }
    logger("generateFromTemplate end");
  }

  getMode(context: any) {
    return context?.options?.frontmatter?.config?.mode || "insert";
  }

  async generateStreamInEditor(
    params: Partial<TextGeneratorSettings>,
    insertMetadata = false,
    editor: Editor
  ) {
    logger("generateStreamInEditor");

    const startingCursor = this.getCursor(editor);

    const cursor: typeof startingCursor = {
      ch: startingCursor.ch,
      line: startingCursor.line,
    };

    const context = await this.contextManager.getContext(
      editor,
      insertMetadata
    );

    const strm = await this.streamGenerate(context, insertMetadata, params);

    // last letter before starting, (used to detirmin if we should add space at the begining)
    const txt = editor.getRange(
      {
        ch: startingCursor.ch - 1,
        line: startingCursor.line,
      },
      startingCursor
    );

    const allText = await strm(async (cntnt, first) => {
      let content = cntnt.length ? cntnt : " ";
      //   console.log({ content, first });

      if (first) {
        const alreadyDidnewLine = this.plugin.settings.prefix?.contains(`
`);

        // here you can do some addition magic

        // check if its starting by space, and space doens't exist in note (used to detirmin if we should add space at the begining).
        if (txt != " " && content != " ") {
          content = " " + content;
        }

        if (!alreadyDidnewLine && txt == ":" && cntnt != "\n") {
          content = "\n" + content;
        }

        // adding prefix here
        if (this.plugin.settings.prefix?.length) {
          console.log(content);
          content = this.plugin.settings.prefix + content;
        }
      }

      // const cursor = editor.getCursor();
      this.insertGeneratedText(content, editor, cursor, "stream");

      console.log("inserting", content);

      cursor.ch += content.length;
      //   cursor.line += content.split("\n").length;

      if (!this.plugin.settings.freeCursorOnStreaming) editor.setCursor(cursor);

      this.plugin.updateSpinnerPos();

      logger("generateStreamInEditor message", { content });
      return content;
    });

    editor.replaceRange(
      "",
      {
        ch: startingCursor.ch + 1,
        line: startingCursor.line,
      },
      cursor
    );

    const mode = this.getMode(context);

    this.insertGeneratedText(allText, editor, startingCursor, mode);

    const nc = {
      ch: cursor.ch,
      line: this.plugin.settings.outputToBlockQuote
        ? cursor.line + 1
        : cursor.line,
    };

    editor.replaceRange("", startingCursor, nc);

    const mode2 = this.getMode(context);

    this.insertGeneratedText(allText, editor, startingCursor, mode2);

    // here we can do some selecting magic
    // editor.setSelection(startingCursor, cursor)

    editor.setCursor(nc);
  }

  async generateInEditor(
    params: Partial<TextGeneratorSettings>,
    insertMetadata = false,
    editor: Editor
  ) {
    if (
      this.plugin.settings.stream &&
      this.plugin.textGenerator.LLMProvider.streamable
    ) {
      return this.generateStreamInEditor(params, insertMetadata, editor);
    }

    logger("generateInEditor");
    const cursor = this.getCursor(editor);
    const context = await this.contextManager.getContext(
      editor,
      insertMetadata
    );

    const [errorGeneration, text] = await safeAwait(
      this.generate(context, insertMetadata, params)
    );

    if (errorGeneration) {
      return Promise.reject(errorGeneration);
    }
    const mode = this.getMode(context);

    const prefix = this.plugin.settings.prefix;

    this.insertGeneratedText(
      prefix.length ? prefix + text : text,
      editor,
      cursor,
      mode
    );

    logger("generateInEditor end");
  }

  async generateToClipboard(
    params: TextGeneratorSettings,
    templatePath: string,
    insertMetadata = false,
    editor: Editor
  ) {
    logger("generateToClipboard");
    const [errorContext, context] = await safeAwait(
      this.contextManager.getContext(editor, insertMetadata, templatePath)
    );

    if (!context) {
      return Promise.reject("context doesn't exist");
    }

    const [errorGeneration, text] = await safeAwait(
      this.generate(context, insertMetadata, params, templatePath)
    );

    if (errorContext) {
      return Promise.reject(errorContext);
    }

    if (errorGeneration) {
      return Promise.reject(errorGeneration);
    }
    const data = new ClipboardItem({
      "text/plain": new Blob([text], {
        type: "text/plain",
      }),
    });
    await navigator.clipboard.write([data]);
    new Notice("Generated Text copied to clipboard");
    editor.setCursor(editor.getCursor());
    logger("generateToClipboard end");
  }

  async generatePrompt(
    promptText: string,
    insertMetadata = false,
    editor: Editor,
    outputTemplate: any
  ) {
    logger("generatePrompt");
    const cursor = this.getCursor(editor);

    let text = await this.generate({ context: promptText }, insertMetadata);

    if (outputTemplate) {
      text = outputTemplate({ output: text });
    }

    if (text) this.insertGeneratedText(text, editor, cursor);

    logger("generatePrompt end");
  }

  async createToFile(
    params: TextGeneratorSettings,
    templatePath: string,
    insertMetadata = false,
    editor: Editor,
    activeFile = true
  ) {
    logger("createToFile");
    const [errorContext, context] = await safeAwait(
      this.contextManager.getContext(editor, insertMetadata, templatePath)
    );

    if (errorContext) {
      return Promise.reject(errorContext);
    }

    const contextAsString = context.context;

    if (!contextAsString) {
      return Promise.reject("contextAsString is undefined");
    }

    if (activeFile === false) {
      const title = app.workspace.activeLeaf?.getDisplayText();
      const suggestedPath =
        "textgenerator/generations/" + title + "-" + makeid(3) + ".md";

      new SetPath(app, suggestedPath, async (path: string) => {
        const [errorFile, file] = await safeAwait(
          createFileWithInput(path, contextAsString, app)
        );

        if (errorFile) {
          logger("createToFile error", errorFile);
          return Promise.reject(errorFile);
        }

        openFile(app, file);
      }).open();
    } else {
      const mode = this.getMode(context);
      this.insertGeneratedText(contextAsString, editor, undefined, mode);
    }
    logger("createToFile end");
  }

  async createTemplateFromEditor(editor: Editor) {
    logger("createTemplateFromEditor");
    const title = app.workspace.activeLeaf?.getDisplayText();
    const content = editor.getValue();
    await this.createTemplate(content, title);
    logger("createTemplateFromEditor end");
  }

  async createTemplate(content: string, title = "") {
    logger("createTemplate");
    const promptInfo = `PromptInfo:
 promptId: ${title}
 name: 🗞️${title} 
 description: ${title}
 required_values: 
 author: 
 tags: 
 version: 0.0.1`;

    let templateContent = content;
    const metadata = this.contextManager.getMetaData();
    // We have three cases: no Front-matter / Frontmatter without PromptInfo/ Frontmatter with PromptInfo
    if (!metadata?.hasOwnProperty("frontmatter")) {
      templateContent = `---\n${promptInfo}\n---\n${templateContent}`;
    } else if (!metadata["frontmatter"]?.hasOwnProperty("PromptInfo")) {
      if (templateContent.indexOf("---") !== -1) {
        templateContent = templateContent.replace("---", `---\n${promptInfo}`);
      } else {
        templateContent = `---\n${promptInfo}\n---\n${templateContent}`;
      }
    }
    const suggestedPath = `${this.plugin.settings.promptsPath}/local/${title}.md`;
    new SetPath(app, suggestedPath, async (path: string) => {
      const [errorFile, file] = await safeAwait(
        createFileWithInput(path, templateContent, app)
      );
      if (errorFile) {
        logger("createTemplate error", errorFile);
        return Promise.reject(errorFile);
      }
      openFile(app, file);
    }).open();
    logger("createTemplate end");
  }

  outputToBlockQuote(text: string) {
    let lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && line !== ">");
    lines = lines
      .map((line, index) => {
        if (line.includes("[!ai]+ AI")) {
          return ">";
        }

        return line.startsWith(">") ? line : "> " + line;
      })
      .filter((line) => line !== "");

    return "\n> [!ai]+ AI\n>\n" + lines.join("\n").trim() + "\n\n";
  }

  async insertGeneratedText(
    completion: string,
    editor: Editor,
    cur: EditorPosition | null = null,
    mode = "insert"
  ) {
    heavyLogger("insertGeneratedText");

    let text = completion;
    let cursor = cur ? cur : this.getCursor(editor);

    // if (mode !== "stream") {
    // 	 text = this.plugin.settings.prefix.replace(/\\n/g, "\n") + text;
    // }

    if (editor.listSelections().length > 0) {
      const anchor = editor.listSelections()[0].anchor;
      const head = editor.listSelections()[0].head;
      if (
        anchor.line > head.line ||
        (anchor.line === head.line && anchor.ch > head.ch)
      ) {
        cursor = editor.listSelections()[0].anchor;
      }
    }

    if (this.plugin.settings.outputToBlockQuote && mode !== "stream") {
      text = this.outputToBlockQuote(text);
    }

    if (mode === "insert" || mode === "stream") {
      editor.replaceRange(text, cursor);
    } else if (mode === "replace") {
      editor.replaceSelection(text);
    } else if (mode === "rename") {
      const sanitizedTitle = text
        .replace(/[*\\"/<>:|?\.]/g, "")
        .replace(/^\n*/g, "");
      const activeFile = app.workspace.getActiveFile();

      if (activeFile) {
        const renamedFilePath = activeFile.path.replace(
          activeFile.name,
          `${sanitizedTitle}.md`
        );
        await app.fileManager.renameFile(activeFile, renamedFilePath);
      } else {
        logger("Couldn't find active file");
      }
    }

    // editor.setCursor(editor.getCursor());

    heavyLogger("insertGeneratedText end");
  }

  async tempalteToModal(
    params: any = this.plugin.settings,
    templatePath = "",
    editor: Editor,
    activeFile = true
  ) {
    logger("tempalteToModal");
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    const [errortemplateContent, templateContent] = await safeAwait(
      //@ts-ignore
      app.vault.adapter.read(templateFile?.path)
    );

    if (!templateContent) {
      return Promise.reject("templateContent is undefined");
    }

    if (errortemplateContent) {
      return Promise.reject(errortemplateContent);
    }

    const { inputContent } = this.contextManager.splitTemplate(templateContent);

    const variables = this.contextManager
      .extractVariablesFromTemplate(inputContent)
      .filter((variable) => !variable.includes("."));

    const metadata = this.getMetadata(templatePath);
    const tempateContext = await this.contextManager.getTemplateContext(
      editor,
      templatePath
    );
    new TemplateModalUI(
      app,
      this.plugin,
      variables,
      metadata,
      tempateContext,
      async (results: any) => {
        const cursor = this.getCursor(editor);

        const [errorContext, context] = await safeAwait(
          this.contextManager.getContext(editor, true, templatePath, results)
        );

        if (errorContext) {
          logger("tempalteToModal error", errorContext);
          return Promise.reject(errorContext);
        }

        const [errortext, text] = await safeAwait(
          this.generate(context, true, params, templatePath)
        );
        if (errortext) {
          logger("tempalteToModal error", errortext);
          return Promise.reject(errortext);
        }

        if (activeFile === false) {
          const title = app.workspace.activeLeaf?.getDisplayText();
          const suggestedPath =
            "textgenerator/generations/" + title + "-" + makeid(3) + ".md";
          new SetPath(app, suggestedPath, async (path: string) => {
            const [errorFile, file] = await safeAwait(
              createFileWithInput(path, context.context + text, app)
            );
            if (errorFile) {
              logger("tempalteToModal error", errorFile);
              return Promise.reject(errorFile);
            }

            openFile(app, file);
          }).open();
        } else {
          const mode = context?.options?.config?.mode || "insert";
          this.insertGeneratedText(text, editor, cursor, mode);
        }
      }
    ).open();
    logger("tempalteToModal end");
  }

  getTemplates(
    _files?: TFile[] | undefined,
    promptsPath: string = this.plugin.settings.promptsPath
  ) {
    const files = _files || app.vault.getFiles();
    const paths: string[] = files
      .filter(
        (f) => f.path.includes(promptsPath) && !f.path.includes("/trash/")
      )
      .map((f) => f.path);
    return paths.map((s) => {
      return {
        title: s.substring(promptsPath.length + 1),
        path: s,
        ...this.getMetadata(s),
      };
    });
  }

  getMetadata(path: string) {
    logger("getMetadata");
    const metadata = this.getFrontmatter(path);

    const validedMetaData: Partial<{
      id: string;
      name: string;
      description: string;
      required_values: string[];
      author: string;
      tags: string[];
      version: string;
      commands: string[];
    }> = {};

    if (metadata?.PromptInfo?.promptId) {
      validedMetaData["id"] = metadata.PromptInfo.promptId;
    }

    if (metadata?.PromptInfo?.name) {
      validedMetaData["name"] = metadata.PromptInfo.name;
    }

    if (metadata?.PromptInfo?.description) {
      validedMetaData["description"] = metadata.PromptInfo.description;
    }

    if (metadata?.PromptInfo?.required_values) {
      validedMetaData["required_values"] =
        typeof metadata.PromptInfo.required_values == "string"
          ? metadata.PromptInfo.required_values.split(",")
          : metadata.PromptInfo.required_values;
    }

    if (metadata?.PromptInfo?.author) {
      validedMetaData["author"] = metadata.PromptInfo.author;
    }

    if (metadata?.PromptInfo?.tags) {
      validedMetaData["tags"] =
        typeof metadata.PromptInfo.tags == "string"
          ? metadata.PromptInfo.tags.split(",")
          : metadata.PromptInfo.tags;
    }

    if (metadata?.PromptInfo?.version) {
      validedMetaData["version"] = metadata.PromptInfo.version;
    }

    if (metadata?.PromptInfo?.commands) {
      validedMetaData["commands"] =
        typeof metadata.PromptInfo.commands == "string"
          ? metadata.PromptInfo.commands.split(",")
          : metadata.PromptInfo.commands;
    }

    logger("getMetadata end");
    return validedMetaData;
  }

  getFrontmatter(path = "") {
    logger("getFrontmatter");

    const frontMatter =
      this.contextManager.getFrontmatter(
        this.contextManager.getMetaData(path)
      ) || null;

    logger("getFrontmatter end", frontMatter);
    return frontMatter;
  }
}

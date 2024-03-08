import TemplateInputModalUI from "../ui/template-input-modal";
import { App, Notice, TFile, Vault, stringifyYaml } from "obsidian";
import { TextGeneratorSettings } from "../types";
import TextGeneratorPlugin from "../main";
import ReqFormatter from "../utils/api-request-formatter";
import { SetPath } from "../ui/settings/components/set-path";
import type { InputContext } from "../scope/context-manager";
import {
  makeId,
  createFileWithInput,
  openFile,
  removeYAML,
  removeExtensionFromName,
} from "../utils";
import safeAwait from "safe-await";
import debug from "debug";
import RequestHandler from "./api-service";
const logger = debug("textgenerator:TextGenerator");
const heavyLogger = debug("textgenerator:TextGenerator:heavy");

import EmbeddingScope from "../scope/embeddings";
import { IGNORE_IN_YAML } from "../constants";
import merge from "lodash.merge";
import { ContentManager } from "../scope/content-manager/types";

export default class TextGenerator extends RequestHandler {
  plugin: TextGeneratorPlugin;
  reqFormatter: ReqFormatter;
  signal: AbortSignal = undefined as any;

  embeddingsScope: EmbeddingScope;

  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(plugin);
    this.plugin = plugin;

    this.embeddingsScope = new EmbeddingScope();
    this.reqFormatter = new ReqFormatter(
      app,
      plugin,
      this.plugin.contextManager
    );
  }

  async getCursor(
    editor: ContentManager,
    mode: "insert" | "replace" | string = "insert"
  ) {
    logger("getCursor");
    const cursor = await editor.getCursor(mode == "replace" ? "from" : "to");

    // let selectedText = editor.getSelection();
    // if (selectedText.length === 0) {
    //   const lineNumber = editor.getCursor().line;
    //   selectedText = editor.getLine(lineNumber);
    //   if (selectedText.length !== 0) {
    //     // cursor.ch = selectedText.length;
    //     if (selectedText[selectedText.length - 1] === " ") {
    //       cursor.ch = selectedText.length - 1;
    //     }
    //   }
    // }
    logger("getCursor end");
    return cursor;
  }

  async generateFromTemplate(props: {
    params: Partial<TextGeneratorSettings>;
    templatePath: string;
    /** defaults to true */
    insertMetadata?: boolean;
    editor?: ContentManager;
    filePath?: string;
    /** defaults to true */
    activeFile?: boolean;
    additionalProps?: any;
    insertMode?: any;
  }) {
    const insertMetadata = props.insertMetadata ?? true;
    const activeFile = props.activeFile ?? true;

    const [errorContext, context] = await safeAwait(
      this.plugin.contextManager.getContext({
        filePath: props.filePath,
        editor: props.editor,
        insertMetadata,
        templatePath: props.templatePath,
        addtionalOpts: props.additionalProps,
      })
    );

    if (errorContext) {
      logger("tempalteToModal error", errorContext);
      return Promise.reject(errorContext);
    }

    switch (true) {
      case activeFile === false:
        await this.createToFile(
          props.params,
          props.templatePath,
          context,
          props.insertMode
        );
        break;

      default:
        if (!props.editor) throw new Error("TG: Editor was not selected");
        await this.generateInEditor({}, false, props.editor, context, {
          showSpinner: true,
          insertMode: props.insertMode,
        });
        break;
    }

    logger("generateFromTemplate end");
  }

  async generateBatchFromTemplate(
    files: TFile[],
    params: Partial<TextGeneratorSettings>,
    templatePath: string,
    insertMetadata = true,
    additionalProps: any = {},
    insertMode = false
  ) {
    // get files context
    const contexts = (await this.plugin.contextManager.getContextFromFiles(
      files,
      //   insertMetadata,
      templatePath,
      additionalProps
    )) as InputContext[];

    // make sure that failed context extractions are not included
    contexts.forEach((c, i) => {
      if (!c) {
        files.splice(i, 1);
        contexts.splice(i, 1);
      }
    });

    if (!files.length) throw new Error("You need to select files");

    // start generation
    await this.createToFiles(
      {
        ...params,
        ...contexts[0]?.options,
      },
      contexts,
      files,
      templatePath,
      insertMode
    );

    logger("generateFromTemplate end");
  }

  getMode(context: any) {
    return (
      context?.options?.frontmatter?.mode ||
      context?.options?.frontmatter?.config?.mode ||
      context?.options?.config?.mode ||
      "insert"
    );
  }

  async generateStreamInEditor(
    params: Partial<TextGeneratorSettings>,
    insertMetadata = false,
    editor: ContentManager,
    customContext?: InputContext
  ) {
    logger("generateStreamInEditor");

    const context =
      customContext ||
      (await this.plugin.contextManager.getContext({ editor, insertMetadata }));

    console.log({
      customContext,
      context,
    });

    // if its a template don't bother with adding prefix
    const prefix = context.template?.outputTemplate
      ? ""
      : this.plugin.settings.prefix;
    const mode = this.getMode(context);

    const startingCursor = await this.getCursor(editor, mode);

    try {
      const streamHandler = await editor.insertStream(startingCursor, mode);
      const strm = await this.streamGenerate(
        context,
        insertMetadata,
        params,
        context.templatePath
      );

      // last letter before starting, (used to detirmin if we should add space at the begining)
      const txt = editor.getLastLetterBeforeCursor();

      let addedPrefix = false;

      const allText =
        (await strm?.(
          async (cntnt, first) => {
            if (mode !== "insert") return;

            let content = cntnt;
            //   console.log({ content, first });

            if (first) {
              const alreadyDidnewLine = prefix?.contains(`
			`);

              // here you can do some addition magic
              // check if its starting by space, and space doens't exist in note (used to detirmin if we should add space at the begining).
              if (txt.length && txt != " " && content != " ") {
                content = " " + content;
              }

              if (!alreadyDidnewLine && txt == ":" && cntnt != "\n") {
                content = "\n" + content;
              }

              // adding prefix here
              if (prefix?.length) {
                addedPrefix = true;
                content = prefix + content;
              }
            }

            logger("generateStreamInEditor message", { content });

            streamHandler.insert(content);

            return content;
          },
          (err) => {
            this.endLoading(false);
            throw err;
          }
        )) || "";

      this.endLoading(true);

      streamHandler.end();

      await streamHandler.replaceAllWith(
        !addedPrefix && prefix.length ? prefix + allText : allText
      );
    } catch (err: any) {
      this.plugin.handelError(err);
      // if catched error during or before streaming, it should return to its previews location
      editor.setCursor(startingCursor);
      this.endLoading(true);
      return Promise.reject(err);
    }
  }

  async generateInEditor(
    params: Partial<TextGeneratorSettings>,
    insertMetadata = false,
    editor: ContentManager,
    customContext?: InputContext,
    additionnalParams = {
      showSpinner: true,
      insertMode: false,
    }
  ) {
    const frontmatter = this.reqFormatter.getFrontmatter("", insertMetadata);
    if (
      this.plugin.settings.stream &&
      this.plugin.textGenerator.LLMProvider?.streamable &&
      frontmatter.stream !== false
    ) {
      return this.generateStreamInEditor(
        params,
        insertMetadata,
        editor,
        customContext
      );
    }

    logger("generateInEditor");
    const cursor = await this.getCursor(editor);

    const context =
      customContext ||
      (await this.plugin.contextManager.getContext({ editor, insertMetadata }));

    const [errorGeneration, text] = await safeAwait(
      this.generate(
        context,
        insertMetadata,
        params,
        context.templatePath,
        additionnalParams
      )
    );

    if (errorGeneration) {
      return Promise.reject(errorGeneration);
    }

    const mode = this.getMode(context);

    // if its a template don't bother with adding prefix
    const prefix = context.template?.outputTemplate
      ? ""
      : this.plugin.settings.prefix;

    console.log({ prefix, config: this.plugin.settings });

    await editor.insertText(prefix.length ? prefix + text : text, cursor, mode);

    logger("generateInEditor end");
  }

  async generateToClipboard(
    params: Partial<TextGeneratorSettings>,
    templatePath: string,
    insertMetadata = false,
    editor: ContentManager
  ) {
    logger("generateToClipboard");
    const [errorContext, context] = await safeAwait(
      this.plugin.contextManager.getContext({
        editor,
        insertMetadata,
        templatePath,
      })
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
    editor: ContentManager,
    outputTemplate: HandlebarsTemplateDelegate<any>
  ) {
    logger("generatePrompt");
    const cursor = this.getCursor(editor);

    let text = await this.LLMProvider.generate(
      [
        {
          role: "user",
          content: promptText,
        },
      ],
      { ...this.LLMProvider.getSettings(), stream: false }
    );

    if (outputTemplate) {
      text = outputTemplate({ output: text });
    }

    // @TODO: hotfix, improve code later.
    // @ts-ignore
    if (text) editor?.editor?.insertText(text, cursor);

    logger("generatePrompt end");
  }

  async createToFile(
    params: Partial<TextGeneratorSettings>,
    templatePath: string,
    context: InputContext,
    insertMode = false
  ) {
    logger("createToFile");
    const [errortext, text] = await safeAwait(
      this.generate(context, true, params, templatePath, {
        showSpinner: false,
        insertMode,
      })
    );

    if (errortext) {
      logger("tempalteToModal error", errortext);
      return Promise.reject(errortext);
    }

    const title = this.plugin.app.workspace.activeLeaf?.getDisplayText();
    const suggestedPath = this.plugin.getTextGenPath(
      "/generations/" + title + "-" + makeId(3) + ".md"
    );
    new SetPath(
      this.plugin.app,
      suggestedPath,
      async (path: string) => {
        const [errorFile, file] = await safeAwait(
          createFileWithInput(path, context.context + text, this.plugin.app)
        );
        if (errorFile) {
          logger("tempalteToModal error", errorFile);
          return Promise.reject(errorFile);
        }

        openFile(this.plugin.app, file);
      },
      {
        content: context.context + text,
        title,
      }
    ).open();
    logger("createToFile end");
  }

  async createToFiles(
    params: Partial<TextGeneratorSettings>,
    contexts: InputContext[],
    files: TFile[],
    templatePath: string,
    insertMode = false
  ) {
    logger("createToFile");
    const suggestedPath = this.plugin.getTextGenPath(
      `/generations/${makeId(4)}`
    );

    new SetPath(
      this.plugin.app,
      suggestedPath,
      async (path: string) => {
        const [errortext, results] = await safeAwait(
          this.batchGenerate(
            contexts,
            true,
            params,
            templatePath,
            {
              showSpinner: false,
              insertMode,
            },
            async (text, i) => {
              const msg = text?.startsWith("FAILED:")
                ? `FAILED with File ${files[i]?.path}: ${text}`
                : `Finished file ${files[i]?.path}`;

              this.plugin.updateStatusBar(msg, true);

              const context = contexts[i];

              if (!context)
                return console.error("generation failed on", { i, text });

              const [errorFile, file] = await safeAwait(
                createFileWithInput(
                  path +
                    `/${text?.startsWith("FAILED:") ? "FAILED-" : ""}` +
                    files[i].path,
                  text,
                  this.plugin.app
                )
              );

              if (errorFile) {
                logger("tempalteToModal error", errorFile);
                return Promise.reject(errorFile);
              }
            }
          )
        );

        // @ts-ignore
        const failed = results?.filter((r) => r?.startsWith("FAILED:"));

        if (failed?.length) {
          logger(`${failed.length} generations failed`, failed);
          console.warn(`${failed.length} generations failed`, failed);
          this.plugin.handelError(
            `${failed.length} generations failed, check console(CTRL+SHIFT+i) for more info`
          );
        }

        if (errortext || results == undefined) {
          logger("tempalteToModal error", errortext);
          return Promise.reject(errortext);
        }

        await new Promise((s) => setTimeout(s, 500));
        app.workspace.openLinkText(
          "",
          `${path}/${contexts[0].options.templatePath}`,
          true
        );
      },
      {
        title: `${files.length} files`,
      }
    ).open();
    logger("createToFile end");
  }

  async createTemplateFromEditor(editor: ContentManager) {
    logger("createTemplateFromEditor");
    const title = this.plugin.app.workspace.activeLeaf?.getDisplayText();
    const content = await editor.getValue();
    await this.createTemplate(content, title);
    logger("createTemplateFromEditor end");
  }

  async createTemplate(
    content: string,
    title = "",
    options?: { disableProvider?: boolean }
  ) {
    logger("createTemplate");

    const suggestedPath = `${this.plugin.settings.promptsPath}/local/${title}.md`;
    new SetPath(this.plugin.app, suggestedPath, async (path: string) => {
      const newTitle = removeExtensionFromName(path.split("/").reverse()[0]);
      const defaultMatter = {
        promptId: `${newTitle}`,
        name: `🗞️${newTitle} `,
        description: `${newTitle}`,
        author: "",
        tags: "",
        version: "0.0.1",
        disableProvider: !!options?.disableProvider,
      };

      const metadata = this.plugin.contextManager.getMetaData(undefined, true);

      const matter: Record<string, any> = {};
      Object.entries(metadata?.frontmatter || {}).forEach(([key, content]) => {
        if (IGNORE_IN_YAML[key]) {
          matter[key] = content;
        }
      });

      const templateContent = options?.disableProvider
        ? `---
${stringifyYaml(merge({}, defaultMatter, matter))}
---
\`\`\`handlebars
You can structure your code here and then use the input or output template to retrieve("get" helper) the processed data, enhancing readability.
\`\`\`
***
This input template is currently disabled due to the 'disabledProvider' setting being set to true.

If you wish to utilize this template with a provider, such as Chatbot or another service, please follow these steps:
- Enable the provider by setting 'disabledProvider' to false.
- Cut and paste everything from the output template into this section.
- Replace the content in the output template with '{{output}}'.
- Remember to delete this instruction text.
***
${removeYAML(content)}
`
        : `---
${stringifyYaml(merge({}, defaultMatter, matter))}
---
\`\`\`handlebars

\`\`\`
***
${removeYAML(content)}
***
{{output}}`;

      const [errorFile, file] = await safeAwait(
        createFileWithInput(path, templateContent, this.plugin.app)
      );
      if (errorFile) {
        logger("createTemplate error", errorFile);
        return Promise.reject(errorFile);
      }
      openFile(this.plugin.app, file);
    }).open();

    await this.updateTemplatesCache();

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

  async tempalteToModal(props: {
    params: Partial<TextGeneratorSettings>;
    /** Template path */
    templatePath?: string;
    /** ContentManager */
    editor: ContentManager;
    /** filePath */
    filePath?: string;
    /** defaults to true */
    activeFile?: boolean;
  }) {
    logger("tempalteToModal");
    const templateFile = this.plugin.app.vault.getAbstractFileByPath(
      props.templatePath || ""
    );

    const [errortemplateContent, templateContent] = await safeAwait(
      //@ts-ignore
      this.plugin.app.vault.adapter.read(templateFile?.path)
    );

    if (!templateContent) {
      return Promise.reject("templateContent is undefined");
    }

    if (errortemplateContent) {
      return Promise.reject(errortemplateContent);
    }

    const { inputContent, outputContent, preRunnerContent } =
      this.plugin.contextManager.splitTemplate(templateContent);

    const variables = this.plugin.contextManager.getHBVariablesOfTemplate(
      preRunnerContent,
      inputContent,
      outputContent
    );

    const metadata = this.getMetadata(props.templatePath || "");
    const templateContext =
      await this.plugin.contextManager.getTemplateContext(props);

    const onSubmit = async (results: any) => {
      try {
        await this.generateFromTemplate({
          params: props.params,
          templatePath: props.templatePath || "",
          insertMetadata: true,
          filePath: props.filePath,
          editor: props.editor,
          activeFile: props.activeFile,
          additionalProps: results,
        });
      } catch (err: any) {
        this.plugin.handelError(err);
        this.endLoading(true);
      }
    };

    if (variables.length)
      new TemplateInputModalUI(
        this.plugin.app,
        this.plugin,
        variables,
        metadata,
        templateContext,
        onSubmit
      ).open();
    else await onSubmit({});
    logger("tempalteToModal end");
  }

  getTemplates(promptsPath: string = this.plugin.settings.promptsPath) {
    const templateFolder = this.plugin.app.vault.getFolderByPath(promptsPath);

    let templates: (ReturnType<typeof this.getMetadata> & {
      title: string;
      ctime: number;
      path: string;
    })[] = [];

    if (templateFolder) {
      Vault.recurseChildren(templateFolder, (file) => {
        if (file instanceof TFile) {
          templates.push({
            ...this.getMetadata(file.path),
            title: file.path.substring(promptsPath.length + 1),
            ctime: file.stat.ctime,
            path: file.path,
          });
        }
      });
    }
    return templates;
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
      viewTypes?: string[];
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

    if (metadata?.PromptInfo?.viewTypes) {
      validedMetaData["viewTypes"] =
        typeof metadata.PromptInfo.viewTypes == "string"
          ? metadata.PromptInfo.viewTypes.split(",")
          : metadata.PromptInfo.viewTypes;
    }

    logger("getMetadata end");
    return validedMetaData;
  }

  getFrontmatter(path = "") {
    logger("getFrontmatter");

    const frontMatter =
      this.plugin.contextManager.getFrontmatter(
        this.plugin.contextManager.getMetaData(path)
      ) || null;

    logger("getFrontmatter end", frontMatter);
    return frontMatter;
  }

  async templateGen(
    id: string,
    options: {
      editor?: ContentManager;
      filePath?: string;
      insertMetadata?: boolean;
      additionalProps?: any;
    }
  ): Promise<string> {
    const templatePath = await await this.getTemplatePath(id);
    // this.plugin.endProcessing(true);
    this.plugin.startProcessing();
    console.log({ templatePath, id });
    const [errorContext, context] = await safeAwait(
      this.plugin.contextManager.getContext({
        editor: options.editor,
        filePath: options.filePath,
        insertMetadata: options.insertMetadata,
        templatePath,
        addtionalOpts: options.additionalProps,
      })
    );

    if (errorContext || !context) {
      throw errorContext;
    }

    const [errorGeneration, text] = await safeAwait(
      this.generate(
        context,
        options.insertMetadata,
        options.additionalProps,
        templatePath,
        {
          insertMode: false,
          showSpinner: true,
          dontCheckProcess: true,
        }
      )
    );

    if (errorGeneration) {
      throw errorGeneration;
    }

    return text || "";
  }

  /** record of template paths, from packageId, templateId */
  templatePaths: Record<string, Record<string, string>> = {};
  lastTemplatePathStats: Record<string, number> = {};

  checkTemplatePathsHasChanged() {
    const nowStats: Record<string, number> = {};
    // @ts-ignore
    for (const path in app.vault.adapter.files) {
      if (
        !path.startsWith(this.plugin.settings.promptsPath) ||
        path.includes("/trash/")
      )
        continue;
      // @ts-ignore
      nowStats[path] = app.vault.adapter.files[path].ctime;
      if (nowStats[path] != this.lastTemplatePathStats[path]) return true;
    }

    return false;
  }

  async packageExists(packageId: string) {
    if (await this.checkTemplatePathsHasChanged()) {
      await this.updateTemplatesCache();
    }

    return !!Object.keys(this.templatePaths[packageId] || {}).length;
  }

  async getTemplatePath(id: string) {
    if (await this.checkTemplatePathsHasChanged()) {
      await this.updateTemplatesCache();
    }

    const [packageId, templateId] = id.split("/");

    if (this.templatePaths[packageId]?.[templateId])
      return this.templatePaths[packageId][templateId];

    const promptsPath = this.plugin.settings.promptsPath;

    const guessPath = `${promptsPath}${
      promptsPath.endsWith("/") ? "" : "/"
    }${id}.md`;

    // test if the guess is actually a file
    if (await this.plugin.app.vault.adapter.exists(guessPath)) return guessPath;

    return undefined;
  }

  async getTemplate(id: string) {
    const templatePath = await this.getTemplatePath(id);
    if (!templatePath) throw new Error(`template with id:${id} wasn't found.`);

    return this.plugin.contextManager.templateFromPath(templatePath, {
      ...this.plugin.contextManager.getFrontmatter(
        this.plugin.contextManager.getMetaData(templatePath)
      ),
    });
  }

  async updateTemplatesCache() {
    // get files, it will be empty onLoad, that's why we are using the getFilesOnLoad function
    // nico update : stay this await hack here for moment, before find a better solution, but keept only one implementation to load templates list, in getTemplates()
    await this.plugin.getFilesOnLoad();

    const templates = this.plugin.textGenerator.getTemplates();

    this.templatePaths = {};
    templates.forEach((template: any) => {
      if (template.id) {
        const ss = template.path.split("/");
        this.templatePaths[ss[ss.length - 2]] ??= {};
        this.templatePaths[ss[ss.length - 2]][template.id] = template.path;
      }
      this.lastTemplatePathStats[template.path] = template.ctime;
    });

    return templates;
  }
}

import { App, Notice, Editor, Component, TFile } from "obsidian";
import { Context } from "./types";
import TextGeneratorPlugin from "./main";
import { IGNORE_IN_YAML } from "./constants";

import { escapeRegExp, getContextAsString, removeYAML } from "./utils";
import debug from "debug";
const logger = debug("textgenerator:ContextManager");
import Helpersfn, { Handlebars } from "./helpers/handlebars-helpers";
import {
  ContentExtractor,
  getExtractorMethods,
} from "./extractors/content-extractor";
import { getAPI as getDataviewApi } from "obsidian-dataview";
import set from "lodash.set";
import merge from "lodash.merge";

interface CodeBlock {
  type: string;
  content: string;
  full: string;
}

type CodeBlockProcessor = (block: CodeBlock) => Promise<string>;

export interface ContextTemplate {
  inputTemplate: HandlebarsTemplateDelegate<any>;
  outputTemplate: HandlebarsTemplateDelegate<any>;
}

export interface InputContext {
  template?: ContextTemplate;
  templatePath?: string;
  options?: any;
  context?: string;
}

export default class ContextManager {
  plugin: TextGeneratorPlugin;
  app: App;

  /** record of template paths, from id */
  templatePaths: Record<string, string>;

  constructor(app: App, plugin: TextGeneratorPlugin) {
    logger("ContextManager constructor");
    this.app = app;
    this.plugin = plugin;

    const Helpers = Helpersfn(this);

    Object.keys(Helpers).forEach((key) => {
      Handlebars.registerHelper(key, Helpers[key as keyof typeof Helpers]);
    });
  }

  async getContext(props: {
    editor?: Editor;
    filePath?: string;
    insertMetadata?: boolean;
    templatePath?: string;
    addtionalOpts?: any;
  }) {
    const templatePath = props.templatePath || "";

    logger(
      "getContext",
      props.insertMetadata,
      props.templatePath,
      props.addtionalOpts
    );
    console.log("step 1");
    /* Template */
    if (templatePath.length) {
      const options = merge(
        {},
        await this.getTemplateContext({
          editor: props.editor,
          templatePath,
          filePath: props.filePath,
        }),
        props.addtionalOpts
      );
      const { context, inputTemplate, outputTemplate, preRunnerTemplate } =
        await this.templateFromPath(templatePath, options);

      // run prerunning script
      await preRunnerTemplate?.(options);

      const ctx = await this.executeTemplateDataviewQueries(context);
      logger("Context Template", { context: ctx, options });

      console.log({
        context,
        options,
        template: { inputTemplate, outputTemplate },
        templatePath,
        adds: props.addtionalOpts,
      });

      return {
        context,
        options,
        template: { inputTemplate, outputTemplate },
        templatePath: props.templatePath,
      } as InputContext;
    } else {
      /* Without template */
      const options = await this.getDefaultContext(props.editor);

      let context = getContextAsString(options);

      if (props.insertMetadata) {
        const frontmatter = this.getMetaData()?.frontmatter; // frontmatter of the active document

        if (
          typeof frontmatter !== "undefined" &&
          Object.keys(frontmatter).length !== 0
        ) {
          /* Text Generate with metadata */
          options["frontmatter"] = frontmatter;
          context = this.getMetaDataAsStr(frontmatter) + context;
        } else {
          new Notice("No valid Metadata (YAML front matter) found!");
        }
      }
      logger("Context without template", { context, options });
      return { context, options } as InputContext;
    }
  }

  async getContextFromFiles(
    files: TFile[],
    insertMetadata = false,
    templatePath = "",
    addtionalOpts: any = {}
  ) {
    const contexts: (InputContext | undefined)[] = [];

    for (const file of files) {
      const fileMeta = this.getMetaData(file.path); // active document

      const options = merge(
        {},
        this.getFrontmatter(this.getMetaData(templatePath)),
        this.getFrontmatter(fileMeta),
        addtionalOpts,
        {
          selection: removeYAML(await this.plugin.app.vault.cachedRead(file)),
        }
      );

      const { context, inputTemplate, outputTemplate, preRunnerTemplate } =
        await this.templateFromPath(templatePath, options);

      const ctx = await this.executeTemplateDataviewQueries(context);
      logger("Context Template", { context: ctx, options });

      contexts.push({
        context,
        options,
        template: { inputTemplate, outputTemplate },
        templatePath,
      } as InputContext);

      //   app.workspace.openLinkText("", filePath, true);
      //   contexts.push(
      //     app.workspace.activeEditor?.editor
      //       ? await this.getContext(
      //           app.workspace.activeEditor?.editor,
      //           insertMetadata,
      //           templatePath,
      //           {
      //             ...addtionalOpts,
      //             selection: app.workspace.activeEditor.editor.getValue(),
      //           }
      //         )
      //       : undefined
      //   );

      //   console.log({ contexts });
      //   app.workspace.getLeaf().detach();
    }

    console.log({ contexts });
    return contexts;
  }

  async getTemplate(id: string) {
    if (!this.templatePaths[id])
      throw new Error(`template with id:${id} wasn't found.`);

    const { context, inputTemplate, outputTemplate } =
      await this.templateFromPath(this.templatePaths[id], {
        ...this.getFrontmatter(this.getMetaData(this.templatePaths[id])),
      });

    return {
      context,
      inputTemplate,
      outputTemplate,
    };
  }

  extractVariablesFromTemplate(templateContent: string): string[] {
    const ast: hbs.AST.Program =
      Handlebars.parseWithoutProcessing(templateContent);

    const extractVariablesFromBody = (
      body: hbs.AST.Statement[],
      eachContext: string | null = null
    ): string[] => {
      return body
        .flatMap((statement: hbs.AST.Statement) => {
          if (statement.type === "MustacheStatement") {
            const moustacheStatement: hbs.AST.MustacheStatement =
              statement as hbs.AST.MustacheStatement;
            const paramsExpressionList =
              moustacheStatement.params as hbs.AST.PathExpression[];
            const pathExpression =
              moustacheStatement.path as hbs.AST.PathExpression;
            const fullPath = eachContext
              ? `${eachContext}.${pathExpression.original}`
              : pathExpression.original;

            return paramsExpressionList[0]?.original || fullPath;
          } else if (
            statement.type === "BlockStatement" &&
            // @ts-ignore
            statement.path.original === "each"
          ) {
            const blockStatement: hbs.AST.BlockStatement =
              statement as hbs.AST.BlockStatement;
            const eachVariable = blockStatement.path.original;
            // @ts-ignore
            const eachContext = blockStatement.params[0]?.original;

            return extractVariablesFromBody(
              blockStatement.program.body,
              eachContext
            );
          } else {
            return [];
          }
        })
        .filter((value, index, self) => self.indexOf(value) === index);
    };

    const handlebarsVariables = extractVariablesFromBody(ast.body);
    return handlebarsVariables;
  }

  async getTemplateContext(props: {
    editor?: Editor;
    filePath?: string;
    templatePath?: string;
    content?: string;
  }) {
    const templatePath = props.templatePath || "";
    logger("getTemplateContext", props.editor, props.templatePath);
    const contextOptions: Context = this.plugin.settings.context;

    const title = props.filePath
      ? this.app.vault.getAbstractFileByPath(props.filePath)?.name ||
        this.getActiveFileTitle()
      : this.getActiveFileTitle();

    const contextObj = await this.getDefaultContext(props.editor);

    const selection = contextObj.selection;
    const selections = contextObj.selections;
    const ctnt = contextObj.content;
    const context = getContextAsString(contextObj);

    const activeDocCache = this.getMetaData(""); // active document
    const blocks: any = {};
    blocks["frontmatter"] = {};
    blocks["headings"] = {};

    let templateContent = props.content || "";

    if (templatePath.length > 0) {
      const templateFile = await this.app.vault.getAbstractFileByPath(
        templatePath
      );
      if (templateFile) {
        templateContent = await this.app.vault.read(templateFile as TFile);
      }
    }

    const variables = this.extractVariablesFromTemplate(templateContent);

    logger("getTemplateContext Variables ", { variables });

    if (contextOptions.includeFrontmatter)
      blocks["frontmatter"] = merge(
        {},
        this.getFrontmatter(this.getMetaData(templatePath)),
        this.getFrontmatter(activeDocCache)
      );

    if (contextOptions.includeClipboard)
      try {
        blocks["clipboard"] = await this.getClipboard();
      } catch {
        // empty
      }

    if (contextOptions.includeHeadings && activeDocCache)
      blocks["headings"] = await this.getHeadingContent(activeDocCache);

    if (
      contextOptions.includeChildren &&
      this.templateContains(variables, "children") &&
      activeDocCache
    )
      blocks["children"] = await this.getChildrenContent(activeDocCache);

    if (contextOptions.includeHighlights)
      blocks["highlights"] = props.editor
        ? await this.getHighlights(props.editor)
        : [];

    if (
      contextOptions.includeMentions &&
      this.templateContains(variables, "mentions") &&
      title
    )
      blocks["mentions"] = await this.getMentions(title);

    if (
      contextOptions.includeExtractions &&
      this.templateContains(variables, "extractions")
    )
      blocks["extractions"] = await this.getExtractions();

    const options = {
      title,
      selection,
      selections,
      ...blocks["frontmatter"],
      ...blocks["headings"],
      content: ctnt,
      context,
      ...blocks,
    };

    logger("getTemplateContext Context Variables ", { ...options });
    return options;
  }

  templateContains(variables: string[], searchVariable: string) {
    return variables.some((variable) => variable.includes(searchVariable));
  }

  async getDefaultContext(editor?: Editor, filePath?: string) {
    logger("getDefaultContext", editor);
    const contextOptions: Context = this.plugin.settings.context;
    const context: {
      title?: string;
      starredBlocks?: any;
      selections?: string[];
      selection?: string;
      frontmatter?: any;
      content?: string;
    } = {};

    const title =
      (filePath
        ? this.app.vault.getAbstractFileByPath(filePath)?.name
        : this.getActiveFileTitle()) || "";

    context["content"] = editor?.getValue() || "";

    const selection = editor ? this.getSelection(editor) : "";
    const selections = editor ? this.getSelections(editor) : [];
    if (contextOptions.includeTitle) {
      context["title"] = title;
    }

    if (contextOptions.includeStaredBlocks) {
      context["starredBlocks"] =
        (await this.getStarredBlocks(filePath || "")) || "";
    }

    if (selections.length > 1) {
      context["selections"] = selections || [];
    } else {
      context["selection"] = selection || "";
    }

    logger("getDefaultContext", { context });
    return context;
  }

  /** Editor variable is for passing it to the next templates that are being called from the handlebars */
  splitTemplate(templateContent: string) {
    logger("splitTemplate", templateContent);
    templateContent = removeYAML(templateContent);

    let inputContent, outputContent, preRunnerContent;
    if (templateContent.includes("***")) {
      const splitContent = templateContent.replaceAll("\\***", "").split("***");
      inputContent = splitContent[splitContent.length == 3 ? 1 : 0];
      outputContent = splitContent[splitContent.length == 3 ? 2 : 1];

      preRunnerContent = splitContent[splitContent.length - 3];

      console.log("registered helper", Handlebars);
    } else {
      inputContent = templateContent;
      outputContent = "";
    }

    const inputTemplate = Handlebars.compile(inputContent, {
      noEscape: true,
    });

    const preRunnerTemplate = preRunnerContent
      ? Handlebars.compile(preRunnerContent, {
          noEscape: true,
        })
      : null;

    const outputTemplate = outputContent
      ? Handlebars.compile(outputContent, {
          noEscape: true,
        })
      : null;

    return {
      preRunnerTemplate,
      inputContent,
      outputContent,
      preRunnerContent,
      inputTemplate,
      outputTemplate,
    };
  }

  async templateFromPath(templatePath: string, options: any) {
    logger("templateFromPath", templatePath, options);
    const templateFile = await this.app.vault.getAbstractFileByPath(
      templatePath
    );

    if (!templateFile) throw `Template ${templatePath} couldn't be found`;

    console.log({ templateFile });
    const templateContent = await this.app.vault.read(templateFile as TFile);

    const templates = this.splitTemplate(templateContent);

    const input = await templates.inputTemplate(options);

    logger("templateFromPath", { input });
    return { context: input, ...templates };
  }

  getSelections(editor: Editor) {
    logger("getSelections", editor);
    const selections = editor
      .listSelections()
      .map((r) => editor.getRange(r.anchor, r.head))
      .filter((text) => text.length > 0);
    logger("getSelections", { selections });
    return selections;
  }

  getSelectionRange(editor: Editor) {
    logger("getSelection", editor);

    const fromTo = {
      from: editor.getCursor("from"),
      to: editor.getCursor("to"),
    };

    console.log(editor.getCursor("to"));

    const selectedText = editor.getSelection().trimStart();

    if (selectedText.length === 0) {
      const lineNumber = editor.getCursor().line;
      const line = editor.getLine(lineNumber).trimStart();

      if (line.length === 0) {
        fromTo.from = {
          ch: 0,
          line: 0,
        };
        fromTo.to = editor.getCursor("from");
      } else {
        fromTo.from = {
          ch: 0,
          line: lineNumber,
        };
        fromTo.to = editor.getCursor("to");
      }
    }
    logger("getSelection", { selectedText });
    return fromTo;
  }

  getSelection(editor: Editor) {
    logger("getSelection", editor);
    const range = this.getSelectionRange(editor);
    let selectedText = editor.getRange(range.from, range.to);

    const frontmatter = this.getMetaData()?.frontmatter; // frontmatter of the active document
    if (
      typeof frontmatter !== "undefined" &&
      Object.keys(frontmatter).length !== 0
    ) {
      /* Text Generate with metadata */
      selectedText = removeYAML(selectedText).trim();
    }
    logger("getSelection", { selectedText });
    return selectedText;
  }

  getFrontmatter(fileCache: any) {
    return fileCache?.frontmatter;
  }

  async getHeadingContent(fileCache: any) {
    const headings = fileCache?.headings;
    const headingsContent: any = {};
    if (headings) {
      for (let i = 0; i < headings.length; i++) {
        let textBlock = await this.getTextBloc(headings[i].heading);
        textBlock = textBlock?.substring(
          textBlock.indexOf(headings[i].heading),
          textBlock.length - 1
        );
        const reSafeHeading = escapeRegExp(headings[i].heading);
        const headingRegex = new RegExp(`${reSafeHeading}\\s*?\n`, "ig");
        textBlock = textBlock?.replace(headingRegex, "");
        headingsContent[headings[i].heading] = textBlock;
      }
    }
    return headingsContent;
  }

  async getChildrenContent(fileCache: {
    links?: {
      original: string;
      link: string;
    }[];
  }) {
    const contextOptions: Context = this.plugin.settings.context;
    const children: any = [];
    const links = fileCache?.links?.filter(
      (e) => e.original.substring(0, 2) === "[["
    );
    //remove duplicates from links
    const uniqueLinks = links?.filter(
      (v, i, a) => a.findIndex((t) => t.link === v.link) === i
    );
    if (uniqueLinks) {
      for (let i = 0; i < uniqueLinks.length; i++) {
        const link = uniqueLinks[i];
        const path = link.link + ".md";
        let file;
        if (path.includes("/")) {
          file = await this.app.vault
            .getFiles()
            .filter((t) => t.path === path)[0];
        } else {
          file = await this.app.vault
            .getFiles()
            .filter((t) => t.name === path)[0];
        }

        if (file) {
          //load the file
          const content = await this.app.vault.read(file);

          const metadata = this.getMetaData(file.path);

          //only include frontmatter and headings if the option is set
          const blocks: any = {};
          if (contextOptions.includeFrontmatter)
            blocks["frontmatter"] = metadata?.frontmatter;

          if (contextOptions.includeHeadings)
            blocks["headings"] = metadata?.headings;

          const childInfo = { ...file, content, ...blocks };

          children.push(childInfo);
        }
      }
    }
    return children;
  }

  async getHighlights(editor: Editor) {
    const content = editor.getValue();
    const highlights =
      content.match(/==(.*?)==/gi)?.map((s) => s.replaceAll("==", "")) || [];
    return highlights;
  }

  async getClipboard() {
    return await navigator.clipboard.readText();
  }

  async getMentions(title: string) {
    const linked: any = [];
    const unlinked: any = [];
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await this.app.vault.cachedRead(file);

      const regLinked = new RegExp(`.*\\[\\[${title}\\]\\].*`, "ig");
      const resultsLinked = content.match(regLinked);
      if (resultsLinked) {
        linked.push({ ...file, results: resultsLinked });
      }

      const regUnlinked = new RegExp(`.*${title}.*`, "ig");
      const resultsUnlinked = content.match(regUnlinked);
      if (resultsUnlinked) {
        unlinked.push({ ...file, results: resultsUnlinked });
      }
    }
    return { linked, unlinked };
  }

  async getStarredBlocks(path = "") {
    const fileCache = this.getMetaData(path);
    let content = "";
    const staredHeadings = fileCache?.headings?.filter(
      (e: { heading: string }) =>
        e.heading.substring(e.heading.length - 1) === "*"
    );
    if (staredHeadings) {
      for (let i = 0; i < staredHeadings.length; i++) {
        content += await this.getTextBloc(staredHeadings[i].heading);
      }
    }
    return content;
  }

  async getTextBloc(heading: string, path = "") {
    const fileCache = this.getMetaData(path);
    let level = -1;
    let start = -1;
    let end = -1;

    if (!fileCache?.headings?.length) {
      console.error("Headings not found");
      return;
    }

    for (let i = 0; i < (fileCache?.headings?.length || 0); i++) {
      const ele = fileCache.headings[i];
      if (start === -1 && ele?.heading === heading) {
        level = ele.level;
        start = ele.position.start.offset;
      } else if (start >= 0 && ele.level <= level && end === -1) {
        end = ele.position.start.offset;
        break;
      }
    }

    if (start >= 0 && fileCache.path) {
      const doc = await this.app.vault.getAbstractFileByPath(fileCache.path);
      const docContent = await this.app.vault.read(doc as TFile);
      if (end === -1) end = docContent.length - 1;
      return docContent.substring(start, end);
    } else {
      console.error("Heading not found ");
    }
  }

  async getExtractions() {
    const extractedContent: Record<string, string[]> = {};
    const contentExtractor = new ContentExtractor(this.app, this.plugin);
    const extractorMethods = getExtractorMethods().filter(
      (e) =>
        this.plugin.settings.extractorsOptions[
          e as keyof typeof this.plugin.settings.extractorsOptions
        ]
    );

    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) throw new Error("ActiveFile was undefined");

    const all: string[] = [];

    for (let index = 0; index < extractorMethods.length; index++) {
      const key = extractorMethods[index];
      contentExtractor.setExtractor(key);

      const links = await contentExtractor.extract(activeFile.path);

      if (links.length > 0) {
        const parts = await Promise.all(
          links.map((link) => contentExtractor.convert(link))
        );
        all.push(...parts);
        extractedContent[key] = parts;
      }
    }

    extractedContent.all = all;
    return extractedContent;
  }

  getActiveFileTitle() {
    return `${this.app.workspace.getActiveFile()?.basename}`;
  }

  getMetaData(path?: string) {
    const activeFile = !path
      ? this.plugin.textGenerator.embeddingsScope.getActiveNote()
      : { path };

    if (!activeFile?.path || !activeFile.path.endsWith(".md")) return null;

    const cache = this.plugin.app.metadataCache.getCache(activeFile.path);

    return {
      ...cache,

      frontmatter: {
        ...cache?.frontmatter,
        PromptInfo: {
          ...cache?.frontmatter,
          ...(cache?.frontmatter?.PromptInfo || {}),
        },

        config: {
          ...cache?.frontmatter,
          ...(cache?.frontmatter?.config || {}),
          path_to_choices:
            cache?.frontmatter?.choices || cache?.frontmatter?.path_to_choices,
          path_to_message_content:
            cache?.frontmatter?.pathToContent ||
            cache?.frontmatter?.path_to_message_content,
        },

        handlebars_body_in:
          cache?.frontmatter?.body || cache?.frontmatter?.handlebars_body_in,
        handlebars_headers_in:
          cache?.frontmatter?.headers ||
          cache?.frontmatter?.handlebars_headers_in,

        bodyParams: {
          ...cache?.frontmatter?.bodyParams,
          ...(cache?.frontmatter?.max_tokens
            ? { max_tokens: cache?.frontmatter?.max_tokens }
            : {}),
          ...getOptionsUnder("body.", cache?.frontmatter),
        },

        reqParams: {
          ...cache?.frontmatter?.reqParams,
          ...getOptionsUnder("reqParams.", cache?.frontmatter),
          ...(cache?.frontmatter?.body
            ? { body: cache?.frontmatter?.body }
            : {}),
        },

        splitter: {
          ...cache?.frontmatter?.chain,
          ...getOptionsUnder("splitter.", cache?.frontmatter),
        },
        chain: {
          ...cache?.frontmatter?.chain,
          ...getOptionsUnder("chain.", cache?.frontmatter),
        },
        ...(path ? { templatePath: path } : {}),
      },

      path: activeFile.path,
    };
  }

  getMetaDataAsStr(frontmatter: any) {
    let cleanFrontMatter = "";
    for (const [key, value] of Object.entries(frontmatter)) {
      if (
        key.startsWith("body") ||
        key.startsWith("header") ||
        IGNORE_IN_YAML.findIndex((e) => e === key) != -1
      )
        continue;
      if (Array.isArray(value)) {
        cleanFrontMatter += `${key} : `;
        value.forEach((v) => {
          cleanFrontMatter += `${v}, `;
        });
        cleanFrontMatter += `\n`;
      } else {
        cleanFrontMatter += `${key} : ${value} \n`;
      }
    }
    return cleanFrontMatter;
  }

  async processCodeBlocks(
    input: string,
    processor: CodeBlockProcessor
  ): Promise<string> {
    const regex = /```(.+?)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let output = input;

    while ((match = regex.exec(input)) !== null) {
      const full = match[0];
      const type = match[1];
      const content = match[2];
      const block = { type, content, full };
      const replacement = await processor(block); // Assuming 'process' is a method in the CodeBlockProcessor class
      output = output.replace(full, replacement);
    }
    return output;
  }

  async executeTemplateDataviewQueries(templateMD: string): Promise<string> {
    const parsedTemplateMD: string = await this.processCodeBlocks(
      templateMD,
      async ({ type, content, full }) => {
        try {
          switch (type.trim()) {
            case "dataview": {
              const res = await getDataviewApi()?.queryMarkdown(content);

              if (!res) throw new Error("Couln't find DataViewApi");

              if (res?.successful) {
                return res.value;
              }

              throw new Error(((res || []) as unknown as string[])?.join(", "));
            }
            case "dataviewjs": {
              const container = document.createElement("div");
              const component = new Component();

              await getDataviewApi()?.executeJs(
                content,
                container,
                component,
                ""
              );

              return container.innerHTML;
            }
            default:
              return full;
          }
        } catch (err: any) {
          this.plugin.handelError(err);
          return "";
        }
      }
    );
    return parsedTemplateMD;
  }
}

export function getOptionsUnder(
  prefix: string,
  obj: Record<string, any> | undefined
) {
  let options: Record<string, any> = {};

  Object.entries(obj || {}).map(([key, data]) => {
    if (key.startsWith(prefix)) {
      options = set(options, key, data);
    }
  });

  return options[prefix.substring(0, prefix.length - 1)];
}

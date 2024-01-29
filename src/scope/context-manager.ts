import { App, Notice, Component, TFile, HeadingCache, EditorPosition } from "obsidian";
import { AsyncReturnType, Context } from "../types";
import TextGeneratorPlugin from "../main";
import { IGNORE_IN_YAML } from "../constants";

import { escapeRegExp, getContextAsString, removeYAML, replaceScriptBlocksWithMustachBlocks, walkUntilTrigger } from "../utils";
import debug from "debug";
const logger = debug("textgenerator:ContextManager");
import Helpersfn, { Handlebars } from "../helpers/handlebars-helpers";
import {
  ContentExtractor,
  ExtractorSlug,
  UnExtractorSlug,
  getExtractorMethods,
} from "../extractors/content-extractor";
import { getAPI as getDataviewApi } from "obsidian-dataview";
import set from "lodash.set";
import merge from "lodash.merge";
import { getHBValues } from "../utils/barhandles";


import JSON5 from 'json5'
import type { ContentManager } from "./content-manager/types";

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
    editor?: ContentManager;
    filePath?: string;
    insertMetadata?: boolean;
    templatePath?: string;
    templateContent?: string;
    addtionalOpts?: any;
  }) {
    const templatePath = props.templatePath || "";
    const templateContent = props.templateContent || "";

    logger(
      "getContext",
      props.insertMetadata,
      props.templatePath,
      props.addtionalOpts
    );

    /* Template */
    if (templatePath.length || templateContent?.length) {
      const options = merge(
        {},
        await this.getTemplateContext({
          editor: props.editor,
          templatePath,
          templateContent,
          filePath: props.filePath,
        }),
        props.addtionalOpts
      );

      if (!templatePath.length)
        return {
          options,
        };

      const { context, inputTemplate, outputTemplate } =
        await this.templateFromPath(templatePath, options, templateContent);

      logger("Context Template", { context, options });

      return {
        context,
        options,
        template: { inputTemplate, outputTemplate },
        templatePath: props.templatePath,
      } as InputContext;
    } else {
      /* Without template */

      const contextTemplate = this.plugin.settings.context.customInstructEnabled
        ? this.plugin.settings.context.customInstruct ||
        this.plugin.defaultSettings.context.customInstruct
        : "{{tg_selection}}";

      const options = await this.getDefaultContext(
        props.editor,
        undefined,
        contextTemplate
      );

      // take context
      let context = await getContextAsString(options as any, contextTemplate);

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
          tg_selection: removeYAML(
            await this.plugin.app.vault.cachedRead(file)
          ),
        }
      );

      const { context, inputTemplate, outputTemplate } =
        await this.templateFromPath(templatePath, options);


      logger("Context Template", { context, options });

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

    return contexts;
  }



  // DEPRICATED
  // extractVariablesFromTemplate(templateContent: string): string[] {
  //   const ast: hbs.AST.Program =
  //     Handlebars.parseWithoutProcessing(templateContent);

  //   const extractVariablesFromBody = (
  //     body: hbs.AST.Statement[],
  //     eachContext: string | null = null
  //   ): string[] => {
  //     return body
  //       .flatMap((statement: hbs.AST.Statement) => {
  //         if (statement.type === "MustacheStatement") {
  //           const moustacheStatement: hbs.AST.MustacheStatement =
  //             statement as hbs.AST.MustacheStatement;
  //           const paramsExpressionList =
  //             moustacheStatement.params as hbs.AST.PathExpression[];
  //           const pathExpression =
  //             moustacheStatement.path as hbs.AST.PathExpression;
  //           const fullPath = eachContext
  //             ? `${eachContext}.${pathExpression.original}`
  //             : pathExpression.original;

  //           return paramsExpressionList[0]?.original || fullPath;
  //         } else if (
  //           statement.type === "BlockStatement" &&
  //           // @ts-ignore
  //           statement.path.original === "each"
  //         ) {
  //           const blockStatement: hbs.AST.BlockStatement =
  //             statement as hbs.AST.BlockStatement;
  //           const eachVariable = blockStatement.path.original;
  //           // @ts-ignore
  //           const eachContext = blockStatement.params[0]?.original;

  //           return extractVariablesFromBody(
  //             blockStatement.program.body,
  //             eachContext
  //           );
  //         } else {
  //           return [];
  //         }
  //       })
  //       .filter((value, index, self) => self.indexOf(value) === index);
  //   };

  //   const handlebarsVariables = extractVariablesFromBody(ast.body);
  //   return handlebarsVariables;
  // }

  async getTemplateContext(props: {
    editor?: ContentManager;
    filePath?: string;
    templatePath?: string;
    templateContent?: string;
  }) {
    const templatePath = props.templatePath || "";
    logger("getTemplateContext", props.editor, props.templatePath);
    const contextOptions: Context = this.plugin.settings.context;

    let templateContent = props.templateContent || "";

    if (templatePath.length > 0) {
      const templateFile = await this.app.vault.getAbstractFileByPath(
        templatePath
      );
      if (templateFile) {
        templateContent = await this.app.vault.read(templateFile as TFile);
      }
    }


    const contextTemplate =
      this.plugin.settings.context.contextTemplate ||
      this.plugin.defaultSettings.context.contextTemplate;

    const contextObj = await this.getDefaultContext(
      props.editor,
      undefined,
      contextTemplate + templateContent
    );

    const context = await getContextAsString(contextObj as any, contextTemplate);

    const selection = contextObj.selection;
    const selections = contextObj.selections;
    const ctnt = contextObj?.content;

    const blocks: any = contextObj;

    blocks["frontmatter"] = {};
    blocks["headings"] = contextObj.headings;


    // const variables = getHBValues(templateContent);
    // const vars: Record<string, true> = {};

    // variables.forEach((v) => {
    //   vars[v] = true;
    // });

    // logger("getTemplateContext Variables ", { variables });

    blocks["frontmatter"] = merge(
      {},
      this.getFrontmatter(this.getMetaData(templatePath)),
      contextObj.frontmatter
    );

    if (contextOptions.includeClipboard)
      try {
        blocks["clipboard"] = await this.getClipboard();
      } catch {
        // empty
      }


    const options = {
      selection,
      selections,
      ...blocks["frontmatter"],
      ...blocks["headings"],
      content: ctnt,
      context,
      ...blocks,
    };

    logger("getTemplateContext Context Variables ", options);
    return options;
  }

  templateContains(variables: string[], searchVariable: string) {
    return variables.some((variable) => variable.includes(searchVariable));
  }

  async getDefaultContext(
    editor?: ContentManager,
    filePath?: string,
    contextTemplate?: string
  ) {
    logger("getDefaultContext", editor, contextTemplate);

    const context: {
      title?: string;
      starredBlocks?: any;
      tg_selection?: string;
      selections?: string[];
      selection?: string;
      previousWord?: string;
      nextWord?: string;
      afterCursor?: string;
      beforeCursor?: string;
      inverseSelection?: string;
      cursorParagraph?: string;
      cursorSentence?: string;
      frontmatter?: Record<string, any>;
      yaml?: Record<string, any>;
      metadata?: string;
      content?: string;
      headings?: AsyncReturnType<typeof this.getHeadingContent>;
      children?: AsyncReturnType<typeof this.getChildrenContent>;
      highlights?: ReturnType<typeof this.getHighlights>;
      mentions?: AsyncReturnType<typeof this.getMentions>
      extractions?: AsyncReturnType<typeof this.getExtractions>;
      keys?: AsyncReturnType<typeof this.plugin.getApiKeys>;
    } = {};

    const variables = this.getHBVariablesOfTemplate(contextTemplate || "") || [];
    const vars: Record<string, true> = {};
    variables.forEach((v) => {
      vars[v] = true;
    });

    const title = vars["title"] || vars["mentions"] ?
      (filePath
        ? this.app.vault.getAbstractFileByPath(filePath)?.name ||
        this.getActiveFileTitle()
        : this.getActiveFileTitle()) || ""
      : "";

    const activeDocCache = this.getMetaData(filePath || "");



    if (editor) {
      //   context["line"] = this.getConsideredContext(editor);
      context["tg_selection"] = await this.getTGSelection(editor);

      const selections = await this.getSelections(editor);
      const selection = await this.getSelection(editor);

      context["selections"] = selection && selections.length == 0 ? [selection] : selections || [];

      context["selection"] = selection || "";

      context["title"] = title

      context["frontmatter"] = this.getFrontmatter(activeDocCache) || "";

      if (vars["previousWord"])
        context["previousWord"] = await this.getPreviousWord(editor);

      if (vars["nextWord"])
        context["nextWord"] = await this.getNextWord(editor);

      if (vars["beforeCursor"])
        context["beforeCursor"] = await this.getBeforeCursor(editor);

      if (vars["afterCursor"])
        context["afterCursor"] = await this.getAfterCursor(editor);

      if (vars["inverseSelection"])
        context["inverseSelection"] = await this.getInverseSelection(editor);



      if (vars["cursorParagraph"])
        context["cursorParagraph"] = await this.getCursorParagraph(editor);

      if (vars["cursorSentence"])
        context["cursorSentence"] = await this.getCursorSentence(editor);

      if (vars["content"])
        context["content"] = await editor.getValue();


      if (vars["highlights"])
        context["highlights"] = editor
          ? await this.getHighlights(editor)
          : [];
    }


    if (vars["starredBlocks"])
      context["starredBlocks"] =
        (await this.getStarredBlocks(filePath || "")) || "";

    if (vars["yaml"])
      context["yaml"] = this.clearFrontMatterFromIgnored(this.getFrontmatter(activeDocCache) || "");

    if (vars["metadata"])
      context["metadata"] = this.getMetaDataAsStr(context["frontmatter"] || {}) || "";

    if (vars["keys"])
      context["keys"] = this.plugin.getApiKeys();


    if (activeDocCache)
      context["headings"] = await this.getHeadingContent(activeDocCache);

    if (vars["children"] && activeDocCache)
      context["children"] = await this.getChildrenContent(activeDocCache, vars);

    if (vars["mentions"] && title)
      context["mentions"] = await this.getMentions(title);

    if (vars["extractions"])
      context["extractions"] = await this.getExtractions(filePath, editor);


    // // execute dataview
    const _dVCache: any = {};
    for (const key in context)
      if (!["frontmatter", "title", "yaml"].includes(key))
        context[key as keyof typeof context] = await this.execDataview(context[key as keyof typeof context], _dVCache)


    logger("getDefaultContext", { context });
    return context;
  }

  overProcessTemplate(templateContent: string) {
    // ignore all scripts content
    // replace all script helpers with script mustache blocks
    templateContent = replaceScriptBlocksWithMustachBlocks(templateContent);

    return templateContent;
  }

  /** Editor variable is for passing it to the next templates that are being called from the handlebars */
  splitTemplate(templateContent: string) {
    logger("splitTemplate", templateContent);
    templateContent = removeYAML(templateContent);

    let inputContent, outputContent, preRunnerContent;
    if (templateContent.includes("***")) {
      const splitContent = templateContent.replaceAll("\\***", "").split("***");
      inputContent = this.overProcessTemplate(splitContent[splitContent.length == 3 ? 1 : 0]);
      outputContent = this.overProcessTemplate(splitContent[splitContent.length == 3 ? 2 : 1]);

      preRunnerContent = this.overProcessTemplate(splitContent[splitContent.length - 3]);
    } else {
      inputContent = this.overProcessTemplate(templateContent);
      outputContent = this.overProcessTemplate("");
    }

    const inputTemplate = this.handlebarsMiddleware(Handlebars.compile(inputContent, {
      noEscape: true,
    }));

    const preRunnerTemplate = preRunnerContent
      ? this.handlebarsMiddleware(Handlebars.compile(preRunnerContent, {
        noEscape: true,
      }))
      : null;

    const outputTemplate = outputContent
      ? this.handlebarsMiddleware(Handlebars.compile(outputContent, {
        noEscape: true,
      }))
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

  clearFrontMatterFromIgnored(yml: Record<string, any>) {
    const objNew: Record<string, any> = {};

    for (const key in yml) {
      if (Object.prototype.hasOwnProperty.call(yml, key) && !IGNORE_IN_YAML[key]) {
        objNew[key] = yml[key];
      }
    }
    return objNew;
  }

  async templateFromPath(templatePath: string, options: any, _templateContent?: string) {
    logger("templateFromPath", templatePath, options);
    const templateFile = await this.app.vault.getAbstractFileByPath(
      templatePath
    );

    if (!templateFile) throw `Template ${templatePath} couldn't be found`;

    let templateContent = _templateContent || await this.app.vault.read(templateFile as TFile);

    const templates = this.splitTemplate(templateContent);

    if (templates.preRunnerTemplate) {
      // run prerunning script
      const n = new Notice("processing Initialization...", 300000)
      try {
        await templates.preRunnerTemplate(options);
      } catch (err: any) {
        n.hide()
        throw err
      }
      n.hide()
    }

    const input = await templates.inputTemplate(options);

    logger("templateFromPath", { input });
    return { context: input, ...templates };
  }

  async getTemplateCustomInputConfig(templatePath: string) {
    const templateFile = await this.app.vault.getAbstractFileByPath(
      templatePath
    );

    let templateContent = await this.app.vault.read(templateFile as TFile);

    const templates = this.splitTemplate(templateContent);

    templates.preRunnerContent;

    // Define a regular expression to match JSON code blocks
    const jsonRegex = /```json:form([\s\S]+?)```/;

    // Match the JSON code block in the text
    const match = templates.preRunnerContent?.match(jsonRegex);

    // Check if a match is found
    if (match && match[1]) {
      // Extract and return the JSON code block
      const jsonCodeBlock = match[1].trim();
      try {
        return JSON5.parse(jsonCodeBlock);
      } catch (err: any) {
        new Notice("JSON not parseable check console(CTRL+SHIFT+i) for more info")
        this.plugin.handelError(err)
        return null;
      }
    } else {
      // Return null if no match is found
      return null;
    }
  }

  getSelections(editor: ContentManager) {
    logger("getSelections", editor);
    const selections = editor
      .getSelections();
    logger("getSelections", { selections });
    return selections;
  }

  getTGSelection(editor: ContentManager) {
    logger("getTGSelection", editor);
    return editor.getTgSelection(this.plugin.settings.tgSelectionLimiter);
  }

  async getSelection(editor: ContentManager) {
    logger("getSelection", editor);
    let selectedText = await editor.getSelection();

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
    const headingsContent: Record<string, string | undefined> = {};
    if (headings) {
      for (let i = 0; i < headings.length; i++) {
        let textBlock = await this.getTextBloc(headings[i].heading);
        textBlock = textBlock?.substring(
          textBlock.indexOf(headings[i].heading),
          textBlock.length
        );
        const reSafeHeading = escapeRegExp(headings[i].heading);
        const headingRegex = new RegExp(`${reSafeHeading}\\s*?\n`, "ig");
        textBlock = textBlock?.replace(headingRegex, "");
        headingsContent[headings[i].heading] = textBlock;
      }
    }
    return headingsContent;
  }

  async getChildrenContent(
    fileCache: {
      links?: {
        original: string;
        link: string;
      }[];
    },
    vars: any
  ) {
    // const contextOptions: Context = this.plugin.settings.context;
    const children: (TFile & {
      content: string;
      frontmatter: any;
      headings: HeadingCache[] | undefined;
    })[] = [];
    const links = fileCache?.links?.filter(
      (e) => e.original.substring(0, 2) === "[["
    );
    //remove duplicates from links
    const uniqueLinks = [...new Set(links)]
    if (uniqueLinks) {
      for (let i = 0; i < uniqueLinks.length; i++) {
        const link = uniqueLinks[i];
        const path = link.link + ".md";
        if (!path) continue
        // @ts-ignore
        const file = this.app.vault.getAbstractFileByPathInsensitive(path);
        if (!file) continue;

        //load the file
        const content = await this.app.vault.read(file as any);

        const metadata = this.getMetaData(file.path);

        //only include frontmatter and headings if the option is set
        const blocks: any = {};

        blocks["frontmatter"] = metadata?.frontmatter;

        blocks["headings"] = metadata?.headings;

        const childInfo: any = {
          ...file,
          content,
          title: file.name.substring(
            0,
            file.name.length - 2
          ),
          ...blocks,
        };

        children.push(childInfo);
      }
    }
    return children;
  }

  async getHighlights(editor: ContentManager) {
    const content = await editor.getValue();
    const highlights =
      content.match(/==(.*?)==/gi)?.map((s: any) => s.replaceAll("==", "")) || [];
    return highlights;
  }

  async getClipboard() {
    return await navigator.clipboard.readText();
  }

  async getMentions(title: string) {
    const linked: any = [];
    const unlinked: any = [];
    const files = this.app.vault.getMarkdownFiles();


    await Promise.all(files.map(async (file) => {
      const content = await this.app.vault.cachedRead(file);

      const regLinked = new RegExp(`.*\\[\\[${title}\\]\\].*`, "ig");
      const resultsLinked = content.match(regLinked);
      if (resultsLinked) {
        linked.push({
          ...file,
          title: file.basename,
          results: resultsLinked
        });
      }

      const regUnlinked = new RegExp(`.*${title}.*`, "ig");
      const resultsUnlinked = content.match(regUnlinked);
      if (resultsUnlinked) {
        unlinked.push({
          ...file,
          title: file.basename,
          results: resultsUnlinked
        });
      }
    }))

    console.log({ linked, unlinked })

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
      if (end === -1) end = docContent.length;
      return docContent.substring(start, end);
    } else {
      console.error("Heading not found ");
    }
  }

  async getExtractions(filePath?: string, editor?: ContentManager) {
    const extractedContent: Record<string, string[]> = {};


    const contentExtractor = new ContentExtractor(this.app, this.plugin);
    const extractorMethods = getExtractorMethods().filter(
      (e) =>
        this.plugin.settings.extractorsOptions[
        e as keyof typeof this.plugin.settings.extractorsOptions
        ]
    );



    const targetFile = filePath ?
      app.vault.getAbstractFileByPath(filePath)
      || this.app.workspace.getActiveFile()
      : this.app.workspace.getActiveFile();

    const targetFileContent = editor ?
      await editor.getValue()
      : await app.vault.cachedRead(targetFile as any)

    if (!targetFile) throw new Error("ActiveFile was undefined");

    for (let index = 0; index < extractorMethods.length; index++) {
      const key = extractorMethods[index];
      contentExtractor.setExtractor(key);

      const links = await contentExtractor.extract(targetFile.path, targetFileContent);

      if (links.length > 0) {
        const parts = await Promise.all(
          links.map((link) => contentExtractor.convert(link))
        );
        extractedContent[UnExtractorSlug[key]] = parts;
      }
    }

    return extractedContent;
  }

  getActiveFileTitle() {
    return `${this.app.workspace.getActiveFile()?.basename}`;
  }

  getMetaData(path?: string, withoutCompatibility?: boolean) {
    const activeFile = !path
      ? this.plugin.textGenerator.embeddingsScope.getActiveNote()
      : { path };

    if (!activeFile?.path || !activeFile.path.endsWith(".md")) return null;

    const cache = this.plugin.app.metadataCache.getCache(activeFile.path);

    return {
      ...cache,

      frontmatter: {
        ...cache?.frontmatter,

        ...(!withoutCompatibility && {
          PromptInfo: {
            ...cache?.frontmatter,
            ...(cache?.frontmatter?.PromptInfo || {}),
          },

          config: {
            ...cache?.frontmatter,
            ...(cache?.frontmatter?.config || {}),
            path_to_choices:
              cache?.frontmatter?.choices ||
              cache?.frontmatter?.path_to_choices,
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
        }),
        ...(path ? { templatePath: path } : {}),
      },

      path: activeFile.path,
    };
  }

  getMetaDataAsStr(frontmatter: Record<string, string | any[]>) {
    let cleanFrontMatter = "";
    for (const [key, value] of Object.entries(frontmatter) as [
      string,
      string // or array
    ]) {
      if (
        !value ||
        key.includes(".") ||
        IGNORE_IN_YAML[key] ||
        key.startsWith("body") ||
        key.startsWith("header")
      )
        continue;
      if (Array.isArray(value)) {
        cleanFrontMatter += `${key} : `;
        value.forEach((v) => {
          cleanFrontMatter += `${v}, `;
        });
        cleanFrontMatter += `\n`;
      } else if (typeof value == "object") {
        continue;
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

  private _dataviewApi: any;
  async execDataview(md: string, _cache: Record<string, string | undefined> = {}): Promise<string> {
    if (!md || typeof md != "string") return md;

    const parsedTemplateMD: string = await this.processCodeBlocks(
      md,
      async ({ type, content, full }) => {
        try {
          switch (type.trim()) {
            case "dataview": {
              const api = this._dataviewApi = this._dataviewApi || await getDataviewApi(this.app);
              const res = await api?.queryMarkdown(content);

              if (!res) throw new Error("Couln't find DataViewApi");

              if (res?.successful) {
                return _cache[content] = _cache[content] || res.value;
              }

              throw new Error(((res || []) as unknown as string[])?.join(", "));
            }
            case "dataviewjs": {
              const api = this._dataviewApi = this._dataviewApi || await getDataviewApi(this.app);
              const container = document.createElement("div");
              const component = new Component();

              api?.executeJs(
                content,
                container,
                component,
                ""
              );

              return _cache[content] = _cache[content] || container.innerHTML;
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

  getHBVariablesOfTemplate(...sections: (string | undefined)[]) {
    const vars = new Set<string>([]);

    for (const section of sections) {
      for (const v of getHBValues(section || "")) {
        vars.add(v);
      }
    }

    return Array.from(vars.values())
  }


  // This function returns all the text before the cursor's current position
  async getBeforeCursor(editor: ContentManager): Promise<string> {
    const cursor = await editor.getCursor();
    const beforeCursor = await editor.getRange(undefined, cursor);
    return beforeCursor;
  }

  // This function returns all the text after the cursor's current position
  async getAfterCursor(editor: ContentManager): Promise<string> {
    const cursor = await editor.getCursor("to");
    const afterCursor = await editor.getRange(cursor, undefined);
    return afterCursor;
  }

  // This function returns the entire paragraph where the cursor is currently located
  async getCursorParagraph(editor: ContentManager): Promise<string> {
    return await editor.getCurrentLine()
  }

  // This function returns the sentence immediately surrounding the cursor, including sentences that the cursor is in the middle of
  async getCursorSentence(editor: ContentManager): Promise<string> {
    const stoppers = ["\n", ".", "?", "!"];
    const part1 = walkUntilTrigger(await this.getBeforeCursor(editor), stoppers, true)
    const part2 = walkUntilTrigger(await this.getAfterCursor(editor), stoppers)
    return part1 + "\n" + part2;
  }

  // This function returns the next word relative to the cursor's position
  async getNextWord(editor: ContentManager): Promise<string> {
    const txts = (await this.getAfterCursor(editor)).split(" ");
    return txts[0]?.trim() || txts[1]?.trim() || ""
  }

  // This function returns the previous word relative to the cursor's position
  async getPreviousWord(editor: ContentManager): Promise<string> {
    const txts = (await this.getBeforeCursor(editor)).trim().split(" ");
    return txts[txts.length - 1]?.trim() || txts[txts.length - 2]?.trim() || ""
  }

  // This function selects everything except the currently selected text
  async getInverseSelection(editor: ContentManager): Promise<string> {
    const content = await editor.getValue();
    const selection = await editor.getSelection();
    const inverseSelection = content.replace(selection, "");
    return inverseSelection;
  }


  handlebarsMiddleware(hb: HandlebarsTemplateDelegate<any>): HandlebarsTemplateDelegate<any> {
    return (async (context: any, options?: Handlebars.RuntimeOptions | undefined) => {
      let hbd = await hb(context, options);
      hbd = await this.execDataview(hbd);
      return hbd;
    }) as any
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

export const contextVariablesObj: Record<
  string,
  {
    example: string;
    hint?: string;
  }
> = {
  title: {
    example: "{{title}}",
    hint: "Represents the note's title.",
  },
  content: {
    example: "{{content}}",
    hint: "Represents the entirety of the note's content.",
  },
  selection: {
    example: "{{selection}}",
    hint: "The portion of text that has been selected by the user.",
  },
  tg_selection: {
    example: "{{tg_selection}}",
    hint: "The text selected using the text generator method.",
  },

  inverseSelection: {
    example: `{{inverseSelection}}`,
    hint: "Shows an error notice when the inverse selection (excluding the currently selected text) is empty.",
  },

  previousWord: {
    example: `{{previousWord}}`,
    hint: "Shows an error notice when the previous word relative to the cursor's position is empty.",
  },

  nextWord: {
    example: `{{nextWord}}`,
    hint: "Shows an error notice when the next word relative to the cursor's position is empty.",
  },

  cursorParagraph: {
    example: `{{cursorParagraph}}`,
    hint: "Shows an error notice when the paragraph where the cursor is currently located is empty.",
  },

  cursorSentence: {
    example: `{{cursorSentence}}`,
    hint: "Shows an error notice when the sentence surrounding the cursor is empty.",
  },

  beforeCursor: {
    example: `{{beforeCursor}}`,
    hint: "Shows an error notice when the text before the cursor's current position is empty.",
  },

  afterCursor: {
    example: `{{afterCursor}}`,
    hint: "Shows an error notice when the text after the cursor's current position is empty.",
  },

  starredBlocks: {
    example: "{{starredBlocks}}",
    hint: "Content under headings marked with a star (*) in the note.",
  },

  clipboard: {
    example: "{{clipboard}}",
    hint: "The current content copied to the clipboard.",
  },
  selections: {
    example: "{{#each selections}} {{this}} {{/each}}",
    hint: "All selected text segments in the note, especially when multiple selections are made.",
  },
  highlights: {
    example: "{{#each highlights}} {{this}} {{/each}}",
    hint: "Highlighted segments marked with ==...== in the note.",
  },
  children: {
    example: "{{#each children}} {{this.content}} {{/each}}",
    hint: "An array of notes or sub-notes that are cited or related to the primary note.",
  },
  "mentions(linked)": {
    example: "{{#each mentions.linked}} {{this.results}} {{/each}}",
    hint: "Mentions across the entire vault where a note is directly linked, e.g., [[note]].",
  },
  "mentions(unlinked)": {
    example: "{{#each mentions.unlinked}} {{this.results}} {{/each}}",
    hint: "Mentions across the vault where a note is referenced without a direct link, e.g., '...note...'.",
  },
  extractions: {
    example: `{{#each extractions}} {{this}} {{/each}}

    Or
    {{#each extractions.pdf}} {{this}} {{/each}}
    `,
    hint: `Extracted content from various sources like PDFs, images, audio files, web pages, and YouTube URLs. possible extractons: ${Object.keys(ExtractorSlug).join(", ")}`,
  },
  headings: {
    example: `{{#each headings}}
# HEADER: {{@key}} 
{{this}} 
{{/each}}`,
    hint: "Contains all the headings within the note and their respective content.",
  },

  metadata: {
    example: `{{metadata}}`,
    hint: "The initial metadata of the note, often provided in YAML format.",
  },

  yaml: {
    example: `{{#each yaml}} 
{{@key}}: {{this}} 
{{/each}}`,
    hint: "The initial metadata (Object) of the note.",
  },

  // extractors
  extract: {
    example: `{{#extract "web_md" "var1" "a"}}
  http://www.google.com
{{/extract}}

Or

{{extract "pdf" "test.pdf"}}
{{extract "youtube" "ytUrl"}}
{{extract "web" "https://example.com"}}`,
    hint: "Extracts content from various sources like PDFs, images, audio files, web pages, and YouTube URLs. possible values: web_md, web_html, pdf, yt, img, audio",
  },

  read: {
    example: `{{read "readme.md"}}`,
    hint: "Reads the content of a file from the vault",
  },


  write: {
    example: `{{#write "readme.md"}}
  text {{selection}}
{{/write}}

Or
{{write "readme.md" selection}}
`,
    hint: "Writes a text or variable into a file",
  },

  append: {
    example: `{{#append "readme.md"}}
  text {{selection}}
{{/append}}

Or
{{append "readme.md" selection}}
`,
    hint: "Appends a text or variable into a file",
  },


  run: {
    example: `{{#run "otherTemplateId" "var1" "selection"}}
  this text will be the "selection" variable for the other template
  it can be any variable even custom ones
{{/run}}

Or
{{#run "otherTemplateId" "var1"}}
  this text will be the "tg_selection" variable for the other template
{{/run}}
`,
    hint: "Runs another template, and sending a value to it, the result will be stored in a variable(var1).",
  },

  script: {
    example: `{{#script}}
  return "hello world";
{{/script}}

Or
{{#script "otherTemplateId" "var1"}}
\`\`\`js
  return "hello world";
\`\`\`
{{/script}}
`,
    hint: "Runs javascript code, avoid using it for security reasons.",
  },

  get: {
    example: `{{get "var1"}}`,
    hint: "Gets value of a variable",
  },

  set: {
    example: `{{#set "var1"}}
    text {{selection}}
  {{/set}}

  Or
  {{set "var1" selection}}
  `,
    hint: "Gets value of a variable",
  },

  log: {
    example: `{{log "test" selection}}`,
    hint: "Logs anything to console (open console in devtools Ctrl+Shift+i)",
  },

  notice: {
    example: `{{notice "test"}}`,
    hint: "Shows a notice to the user",
  },

  error: {
    example: `{{error "Selection was empty"}}`,
    hint: "Shows a error notice to the user, and it will stop the execution.",
  },
};


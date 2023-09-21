import { App } from "obsidian";
import { Message, TextGeneratorSettings } from "./types";
import TextGeneratorPlugin from "./main";
import ContextManager from "./context-manager";
import debug from "debug";
import { transformStringsToChatFormat } from "./utils";
import { LLMConfig } from "./LLMProviders/interface";
const logger = debug("textgenerator:ReqFormatter");
export default class ReqFormatter {
  plugin: TextGeneratorPlugin;
  app: App;
  contextManager: ContextManager;
  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    contextManager: ContextManager
  ) {
    this.app = app;
    this.plugin = plugin;
    this.contextManager = contextManager;
  }

  getFrontmatter(templatePath: string, insertMetadata?: boolean) {
    const activefileFrontmatter: any = insertMetadata
      ? this.contextManager.getMetaData()?.frontmatter
      : {};

    const templateFrontmatter = templatePath?.length
      ? this.contextManager.getMetaData(templatePath)?.frontmatter
      : {};

    return {
      ...templateFrontmatter,
      ...activefileFrontmatter,
    };
  }

  getRequestParameters(
    _params: Partial<TextGeneratorSettings>,
    insertMetadata: boolean,
    templatePath = "",
    additionnalParams: {
      reqParams?: RequestInit;
      bodyParams?: any;
    } = {}
  ) {
    logger("prepareReqParameters", _params, insertMetadata, templatePath);

    const frontmatter: any = this.getFrontmatter(templatePath, insertMetadata);

    const params = {
      ...this.plugin.settings,
      ...this.plugin.settings.LLMProviderOptions[
        frontmatter?.config?.provider ||
          (this.plugin.settings.selectedProvider as any)
      ],
      ..._params,
    };

    let bodyParams: Partial<LLMConfig & { prompt: string }> & {
      messages: Message[];
    } = {
      ...(params.engine && { engine: params.engine }),
      ...(params.max_tokens && { max_tokens: params.max_tokens }),
      ...(params.temperature && { temperature: params.temperature }),
      ...(params.frequency_penalty && {
        frequency_penalty: params.frequency_penalty,
      }),
      messages: [{ role: "user", content: params.prompt || "" }],
    };

    const provider: {
      selectedProvider?: string;
      providerOptions?: any;
    } = {};

    let reqParams: RequestInit & {
      // url: string,
      extractResult?: any;
    } = {
      ...additionnalParams?.reqParams,
    };

    // if (!insertMetadata) {
    //   reqParams.body = JSON.stringify(bodyParams);

    //   logger("prepareReqParameters", { bodyParams, reqParams });
    //   return {
    //     bodyParams: {
    //       ...bodyParams,
    //       messages: bodyParams.messages || [],
    //     },
    //     reqParams,
    //     provider,
    //   };
    // }

    // on insertMetadata
    if (frontmatter) {
      // -- provider options
      provider.selectedProvider = frontmatter.config?.provider;
      provider.providerOptions = frontmatter.config || {};
      // --

      if (bodyParams.messages) {
        if (frontmatter.config?.messages) {
          // unshift adds item at the start of the array
          bodyParams.messages.unshift(
            ...transformStringsToChatFormat(frontmatter.config.messages)
          );
        }

        if (frontmatter.config?.system) {
          bodyParams.messages.unshift({
            role: "system",
            content: frontmatter.config.system,
          });
        }
      }

      if (
        frontmatter.bodyParams &&
        frontmatter.config?.append?.bodyParams == false
      ) {
        bodyParams = {
          prompt: params.prompt,
          ...frontmatter.bodyParams,
        };
      } else if (Object.keys(frontmatter.bodyParams || {}).length) {
        bodyParams = {
          ...bodyParams,
          ...frontmatter.bodyParams,
        };
      }

      if (
        frontmatter.config?.context &&
        frontmatter.config?.context !== "prompt"
      ) {
        bodyParams[
          frontmatter.config.context as never as keyof typeof bodyParams
        ] = params.prompt;
        delete bodyParams.prompt;
      }

      reqParams.body = JSON.stringify(bodyParams);

      if (
        frontmatter["reqParams"] &&
        frontmatter.config?.append?.reqParams == false
      ) {
        reqParams = frontmatter["reqParams"];
      } else if (frontmatter["reqParams"]) {
        reqParams = { ...reqParams, ...frontmatter["reqParams"] };
      }
    } else {
      this.plugin.handelError("No valid Metadata (YAML front matter) found!");
    }

    logger("prepareReqParameters", { bodyParams, reqParams });

    return {
      bodyParams,
      reqParams,
      provider,
      allParams: params,
    };
  }
}

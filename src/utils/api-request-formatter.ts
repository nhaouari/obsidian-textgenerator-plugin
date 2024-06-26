import { App } from "obsidian";
import { Message, TextGeneratorSettings } from "../types";
import TextGeneratorPlugin from "../main";
import ContextManager from "../scope/context-manager";
import debug from "debug";
import { transformStringsToChatFormat } from ".";
import { LLMConfig } from "../LLMProviders/interface";
import { AI_MODELS } from "#/constants";
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

  async getRequestParameters(
    _params: Partial<TextGeneratorSettings & { prompt: string }>,
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
      ...this.plugin.defaultSettings.LLMProviderOptions[
      frontmatter?.config?.provider ||
      (this.plugin.settings.selectedProvider as any)],
      ...this.plugin.settings.LLMProviderOptions[
      frontmatter?.config?.provider ||
      (this.plugin.settings.selectedProvider as any)
      ],
      ...this.getFrontmatter(templatePath, insertMetadata),
      ..._params,
    };


    if (
      !this.plugin.textGenerator.LLMProvider ||
      frontmatter.config?.provider !== this.plugin.textGenerator.LLMProvider.id
    )
      // load the provider
      await this.plugin.textGenerator.loadllm(frontmatter.config?.provider);

    if (!this.plugin.textGenerator.LLMProvider) throw "LLM Provider not intialized";

    params.model = params.model?.toLowerCase();

    if (params.includeAttachmentsInRequest ?? params.advancedOptions?.includeAttachmentsInRequest)
      params.prompt = await this.plugin.contextManager.splitContent(params.prompt, params.noteFile, (AI_MODELS[params.model] || AI_MODELS["models/" + params.model])?.inputOptions || {})

    let bodyParams: Partial<LLMConfig & { prompt: string }> & {
      messages: Message[];
    } = {
      ...(params.model && { model: params.model }),
      ...(params.max_tokens && { max_tokens: params.max_tokens }),
      ...(params.temperature && { temperature: params.temperature }),
      ...(params.frequency_penalty && {
        frequency_penalty: params.frequency_penalty,
      }),
      messages: [],
    };

    if (
      !params.messages?.length &&
      (typeof params.prompt == "object" ||
        params.prompt?.replaceAll?.("\n", "").trim().length)
    ) {
      bodyParams.messages.push(this.plugin.textGenerator.LLMProvider.makeMessage(params.prompt || "", "user"));
    }


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

    const provider: {
      selectedProvider?: string;
      providerOptions?: any;
    } = {};


    // on insertMetadata
    if (frontmatter) {
      // -- provider options
      provider.selectedProvider = frontmatter.config?.provider;
      provider.providerOptions = frontmatter || {};
      // --

      if (bodyParams.messages) {
        if (params.messages || params.config?.messages) {
          // unshift adds item at the start of the array
          bodyParams.messages.unshift(
            ...transformStringsToChatFormat(
              params.messages || params.config.messages
            )
          );
        }

        if (params.system || params.config?.system) {
          bodyParams.messages.unshift(this.plugin.textGenerator.LLMProvider.makeMessage(params.system || params.config.system, "system"));
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

      if (frontmatter.context && frontmatter.context !== "prompt") {
        bodyParams[frontmatter.context as never as keyof typeof bodyParams] =
          params.prompt;
        delete bodyParams.prompt;
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

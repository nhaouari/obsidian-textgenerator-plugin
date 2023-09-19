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

  getRequestParameters(
    params: Partial<TextGeneratorSettings>,
    insertMetadata: boolean,
    templatePath = "",
    additionnalParams: {
      reqParams?: RequestInit;
      bodyParams?: any;
      showSpinner?: boolean;
    } = {}
  ) {
    logger("prepareReqParameters", params, insertMetadata, templatePath);

    let bodyParams: Partial<
      LLMConfig & { messages: Message[]; prompt: string }
    > = {
      ...(params.engine && { engine: params.engine }),
      ...(params.max_tokens && { max_tokens: params.max_tokens }),
      ...(params.temperature && { temperature: params.temperature }),
      ...(params.frequency_penalty && {
        frequency_penalty: params.frequency_penalty,
      }),
    };

    // let reqUrl = new URL(`${params.endpoint?.contains("v1") ? "" : "/v1"}/v1/completions`, params.endpoint).href;
    let reqExtractResult = "choices[0].text";

    // reqUrl = new URL(`${params.endpoint?.contains("v1") ? "" : "/v1"}/chat/completions`, params.endpoint).href;
    reqExtractResult = "choices[0].message.content";
    bodyParams["messages"] = [{ role: "user", content: params.prompt || "" }];

    bodyParams = { ...bodyParams, ...additionnalParams?.bodyParams };

    let reqParams: RequestInit & {
      // url: string,
      extractResult?: any;
    } = {
      // url: reqUrl,
      method: "POST",
      body: "",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.api_key}`,
      },
      extractResult: reqExtractResult,

      ...additionnalParams?.reqParams,
    };

    if (insertMetadata) {
      const activefileFrontmatter =
        this.contextManager.getMetaData()?.frontmatter;
      const templateFrontmatter =
        this.contextManager.getMetaData(templatePath)?.frontmatter;

      const frontmatter: any = {
        ...templateFrontmatter,
        ...activefileFrontmatter,
      };

      //console.log({templateFrontmatter,activefileFrontmatter,frontmatter});
      if (frontmatter == null) {
        this.plugin.handelError("No valid Metadata (YAML front matter) found!");
      } else {
        if (bodyParams["messages"]) {
          //chat mode
          const messages: {
            role: string;
            content: string;
          }[] = [];

          if (frontmatter["config"]?.system) {
            messages.push({
              role: "system",
              content: frontmatter["config"].system,
            });
          }

          if (frontmatter["config"]?.messages) {
            messages.push(
              ...transformStringsToChatFormat(frontmatter["config"].messages)
            );
          }

          bodyParams["messages"] = [...messages, ...bodyParams["messages"]];
        }

        if (
          frontmatter["bodyParams"] &&
          frontmatter["config"]?.append?.bodyParams == false
        ) {
          bodyParams = {
            prompt: params.prompt,
            ...frontmatter["bodyParams"],
          };
        } else if (frontmatter["bodyParams"]) {
          bodyParams = {
            ...bodyParams,
            ...frontmatter["bodyParams"],
          };
        }

        if (
          frontmatter["config"]?.context &&
          frontmatter["config"]?.context !== "prompt"
        ) {
          bodyParams[
            frontmatter["config"].context as never as keyof typeof bodyParams
          ] = params.prompt;
          delete bodyParams.prompt;
        }

        reqParams.body = JSON.stringify(bodyParams);

        if (frontmatter["config"]?.output) {
          reqParams.extractResult = frontmatter["config"]?.output;
        }

        if (
          frontmatter["reqParams"] &&
          frontmatter["config"]?.append?.reqParams == false
        ) {
          reqParams = frontmatter["reqParams"];
        } else if (frontmatter["reqParams"]) {
          reqParams = { ...reqParams, ...frontmatter["reqParams"] };
        }
      }
    } else {
      reqParams.body = JSON.stringify(bodyParams);
    }

    logger("prepareReqParameters", { bodyParams, reqParams });

    return {
      bodyParams: {
        ...bodyParams,
        messages: bodyParams.messages || [],
      },
      reqParams,
    };
  }
}

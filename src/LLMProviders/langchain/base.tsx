/* eslint-disable no-debugger */
import debug from "debug";
import React from "react";

import { ChatOpenAI, ClientOptions, OpenAIChatInput } from "@langchain/openai";

// import { HuggingFaceInference } from "@langchain/community/llms/hf";

import BaseProvider from "../base";
import {
  mapMessagesToLangchainMessages,
  processPromisesSetteledBatch,
} from "../../utils";
import LLMProviderInterface, { LLMConfig } from "../interface";

import { PromptTemplate } from "@langchain/core/prompts";
import type { BaseMessageChunk } from "@langchain/core/messages";

import { chains, splitters, Message, AI_MODELS } from "../refs";
import { Callbacks } from "@langchain/core/callbacks/manager";
import JSON5 from "json5";
import { Handlebars } from "#/helpers/handlebars-helpers";

const logger = debug("textgenerator:LangchainProvider");

export default class LangchainProvider
  extends BaseProvider
  implements LLMProviderInterface {
  static id = "default (Langchain)";
  static slug = "default" as any;
  static provider = "Langchain";
  static displayName = "Langchain LLM";

  /** generate candidates in parallel instead of sending the variable n */
  legacyN = false;

  /** You can change the default headers here */
  defaultHeaders?: Record<string, string | null>;

  llmClass: any;

  llmPredict = false;
  streamable = true;

  provider = LangchainProvider.provider;
  id = LangchainProvider.id;
  originalId = LangchainProvider.id;

  default_values: any = {};

  getConfig(options: LLMConfig) {
    return this.cleanConfig({
      // In langchain v1, use apiKey instead of openAIApiKey
      apiKey: options.api_key,
      openAIApiKey: options.api_key, // Keep for backward compatibility

      // ------------Necessary stuff--------------
      modelKwargs: options.modelKwargs,
      modelName: options.model,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n || 1,
      stop: options.stop || undefined,
      streaming: options.stream || false,
      maxRetries: 3,
      headers: options.headers || undefined,
    } as Partial<OpenAIChatInput>);
  }

  async load() {
    this.llmClass = ChatOpenAI;
  }

  async getLLM(_options: LLMConfig): Promise<any> {
    const options = { ..._options };

    let nh = {};

    try {
      if (options.headers)
        nh = JSON5.parse(await Handlebars.compile(options.headers)(options));
    } catch (e) {
      console.error(e);
    }

    const headers = {
      "User-Agent": undefined,
      "HTTP-Referer": location.origin,
      "X-Title": "obsidian-text-generator",
      ...this.defaultHeaders,
      ...nh,
    };

    const Fetch = this.plugin.textGenerator.proxyService.getFetch(
      this.corsBypass ||
      this.default_values.corsBypass ||
      options.otherOptions.corsBypass
    );

    const baseURL = options.basePath?.length
      ? options.basePath.endsWith("/")
        ? options.basePath.substring(0, options.basePath.length - 1)
        : options.basePath
      : undefined;

    // In langchain v1, the configuration structure changed
    // The 'configuration' property is for OpenAI SDK client options
    const config = this.getConfig(options);

    const llmConfig = {
      ...config,
      // Add configuration object for custom baseURL and fetch
      configuration: {
        ...(baseURL && { baseURL }),
        dangerouslyAllowBrowser: true,
        ...(options.bodyParams && { defaultQuery: options.bodyParams }),
        fetch: Fetch,
        defaultHeaders: headers,
      },
    };

    console.log({ llmConfig });
    const llm = new (this.llmClass as typeof ChatOpenAI)(llmConfig);

    return llm;
  }

  configMerger(options: Partial<LLMConfig>) {
    return {
      ...this.cleanConfig(this.plugin.settings),
      ...this.cleanConfig(
        this.plugin.settings.LLMProviderOptions[
        this.id as keyof typeof this.plugin.settings
        ]
      ),
      ...this.cleanConfig(options.otherOptions),
      ...this.cleanConfig(options),
      otherOptions: this.cleanConfig(
        this.plugin.settings.LLMProviderOptions[
        this.id as keyof typeof this.plugin.settings
        ]
      ),
    };
  }

  getReqOptions(options: Partial<LLMConfig>) {
    return { ...options } as any;
  }

  async generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>,
    customConfig?: any
  ): Promise<string> {
    return new Promise(async (s, r) => {
      let alreadyBegainGenerating = false;
      let result = "";
      try {
        logger("generate", reqParams);

        const params = this.configMerger(reqParams);

        // if the model is streamable
        params.stream = params.stream && this.streamable;

        const llm = await this.getLLM(params);

        let first = true;
        let allText = "";

        const llmFuncs: Callbacks = [
          {
            ...(!!onToken &&
              !!params.stream && {
              async handleLLMNewToken(token: string) {
                const d = first;
                first = false;
                alreadyBegainGenerating = true;
                const tk = (await onToken(token, d)) || token;
                allText += tk;
                result += tk;
              },
            }),

            handleLLMEnd() {
              if (params.stream) s(allText);
            },
          },
        ];

        if (customConfig?.chain?.type) {
          const textSplitter = new splitters.RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            ...customConfig?.splitter,
          });

          const docs = await textSplitter.createDocuments([
            chatToString(messages),
          ]);

          // This convenience function creates a document chain prompted to summarize a set of documents.
          const chain = await getChain(
            customConfig?.chain.loader,
            llm,
            customConfig.chain
          );

          const res = await (chain as any).invoke(
            {
              input_documents: docs,
              signal: reqParams.requestParams?.signal || undefined,
            },
            {
              callbacks: llmFuncs,
              configurable: {
                fetch: this.plugin.textGenerator.proxyService.getFetch(
                  this.corsBypass ||
                  this.default_values.corsBypass ||
                  customConfig.corsBypass
                ),
              },
            }
          );

          result = res.text;
        } else {
          let r: any;
          let res: BaseMessageChunk = {} as any;

          console.log({
            messages,
            k: "invoked",
            llmpredict: reqParams.llmPredict,
            llmPredict2: this.llmPredict,
          });
          if (reqParams.llmPredict || this.llmPredict)
            r = await (llm as any as ChatOpenAI).invoke(
              chatToString(messages),
              {
                signal: params.requestParams?.signal || undefined,
                ...this.getReqOptions(params),

                callbacks: llmFuncs,
                // options: {
                //   body: params.bodyParams,
                // },
              }
            );
          else
            r = await (llm as any as ChatOpenAI).invoke(
              mapMessagesToLangchainMessages(messages) as any as string,
              {
                signal: params.requestParams?.signal || undefined,
                ...this.getReqOptions(params),
                callbacks: llmFuncs,
              }
            );

          if (typeof r == "string") res.content = r;
          else res = r;

          if (typeof res.content == "string") result = res.content;
          else
            result = res.content
              .map((c: any) => {
                if (c.type == "image_url") return `![](${c.image_url})`;
                if (c.type == "text") return c.text;
                // Handle thinking blocks from Claude extended thinking
                if (c.type == "thinking") {
                  // Optionally include thinking in output based on config
                  if (params.includeThinking || params.otherOptions?.includeThinking) {
                    return `<thinking>\n${c.thinking}\n</thinking>\n`;
                  }
                  return "";
                }
                // Handle tool_use blocks
                if (c.type == "tool_use") return "";
                return "";
              })
              .filter(Boolean)
              .join("\n");
        }

        // console.log("used Tokens: ", { allTokens });
        logger("generate end", {
          result,
        });

        s(result);
      } catch (errorRequest: any) {
        logger("generate error", errorRequest);

        if (alreadyBegainGenerating) {
          return s(result);
        }

        r(errorRequest);
      }
    });
  }

  async generateMultiple(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): Promise<string[]> {
    return new Promise(async (s, r) => {
      try {
        logger("generateMultiple", reqParams);

        const params = this.configMerger(reqParams);
        const llm = await this.getLLM(params);
        let requestResults: any[] = [];
        if (this.legacyN) {
          await processPromisesSetteledBatch(
            Array.from({ length: reqParams.n || 1 }).map(async () => {
              requestResults.push(
                ...(
                  await llm.generate(
                    reqParams.llmPredict || this.llmPredict
                      ? [chatToString(messages)]
                      : [
                        mapMessagesToLangchainMessages(
                          messages
                        ) as any as string,
                      ],
                    {
                      signal: params.requestParams?.signal || undefined,
                      ...this.getReqOptions(params),
                    }
                  )
                ).generations[0]
              );
            }),
            2
          );
        } else
          requestResults = (
            await llm.generate(
              reqParams.llmPredict || this.llmPredict
                ? [chatToString(messages)]
                : [mapMessagesToLangchainMessages(messages) as any as string],
              {
                signal: params.requestParams?.signal || undefined,
                ...this.getReqOptions(params),
              }
            )
          ).generations[0];

        logger("generateMultiple end", {
          requestResults,
        });

        s(requestResults.map((a: any) => a.text));
      } catch (errorRequest: any) {
        logger("generateMultiple error", errorRequest);
        return r(errorRequest);
      }
    });
  }

  async calcPrice(
    tokens: number,
    reqParams: Partial<LLMConfig>
  ): Promise<number> {
    throw new Error("calcPrice Not implemented for " + this.id);
  }

  async calcTokens(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): ReturnType<LLMProviderInterface["calcTokens"]> {
    const model = reqParams.model;
    const modelInfo =
      AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS["gpt-3.5-turbo"];

    if (!modelInfo)
      return {
        tokens: 0,
        maxTokens: 0,
      };
    const encoder = this.plugin.tokensScope.getEncoderFromEncoding(
      modelInfo.encoding
    );

    let tokensPerMessage, tokensPerName;
    if (model && ["gpt-3.5-turbo", "gpt-3.5-turbo-0301"].includes(model)) {
      tokensPerMessage = 4;
      tokensPerName = -1;
    } else if (model && ["gpt-4", "gpt-4-0314"].includes(model)) {
      tokensPerMessage = 3;
      tokensPerName = 1;
    } else {
      tokensPerMessage = 3;
      tokensPerName = 1;
    }

    let numTokens = 0;
    for (const message of messages) {
      numTokens += tokensPerMessage;
      for (const [key, value] of Object.entries(message)) {
        numTokens += encoder.encode(value as any).length;
        if (key === "name") {
          numTokens += tokensPerName;
        }
      }
    }

    numTokens += 3; // every reply is primed with assistant

    return {
      tokens: numTokens,
      maxTokens: modelInfo.maxTokens,
    };
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    return <></>;
  }
}

function contentToString(content: Message["content"]) {
  return typeof content == "string"
    ? content
    : Object.values(content).join(" ");
}

function chatToString(messages: Message[] = []) {
  return messages.length > 1
    ? // user: test1
    // assistant: test2
    // ...
    messages
      .map((msg) => {
        return `${msg.role}:${contentToString(msg.content)}`;
      })
      .join("\n")
    : // test1
    contentToString(messages[0].content);
}

async function getChain(chainName: string, llm: any, config: any): Promise<any> {
  // In langchain v1, chains have been deprecated
  // This is a fallback that uses the chains export from our lib/langchain/index.ts
  // which provides backward compatibility
  try {
    const { loadSummarizationChain } = chains as any;

    if (!loadSummarizationChain) {
      throw new Error("loadSummarizationChain is not available in langchain v1");
    }

    const chain = await loadSummarizationChain(llm, {
      maxTokens: 500,

      prompt: config.prompt
        ? PromptTemplate.fromTemplate(config.prompt)
        : undefined,

      questionPrompt: config.questionPrompt
        ? PromptTemplate.fromTemplate(config.questionPrompt)
        : undefined,

      refinePrompt: config.refinePrompt
        ? PromptTemplate.fromTemplate(config.refinePrompt)
        : undefined,

      combinePrompt: config.combinePrompt
        ? PromptTemplate.fromTemplate(config.combinePrompt)
        : undefined,

      combineMapPrompt: config.combineMapPrompt
        ? PromptTemplate.fromTemplate(config.combineMapPrompt)
        : undefined,

      ...config,
      // verbose: true,
    });

    // fsr its not getting set from the properties
    // @ts-ignore
    chain.maxTokens = config?.chain?.maxTokens || 500;
    return chain;
  } catch (error) {
    console.error("Chain functionality is not available:", error);
    throw new Error("Summarization chains are not supported in langchain v1. Please use direct LLM invocation instead.");
  }
}

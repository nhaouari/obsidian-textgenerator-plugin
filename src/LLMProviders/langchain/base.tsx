/* eslint-disable no-debugger */
import debug from "debug";
import React from "react";

import { ChatOpenAI, OpenAIChatInput } from "@langchain/openai";

import { HuggingFaceInference } from "@langchain/community/llms/hf";

import BaseProvider from "../base";
import {
  mapMessagesToLangchainMessages,
  processPromisesSetteledBatch,
} from "../../utils";
import LLMProviderInterface, { LLMConfig } from "../interface";

import { PromptTemplate } from "@langchain/core/prompts";
import type { BaseMessageChunk } from "@langchain/core/messages";

import {
  chains,
  splitters,
  Message,
  AI_MODELS,
} from "../refs";
import { Callbacks } from "@langchain/core/callbacks/manager";

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
      openAIApiKey: options.api_key,

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
    } as Partial<OpenAIChatInput>);
  }

  async load() {
    this.llmClass = ChatOpenAI;
  }

  async getLLM(_options: LLMConfig): Promise<any> {
    const options = { ..._options };

    const headers = {
      "User-Agent": undefined,
      "HTTP-Referer": location.origin,
      "X-Title": "obsidian-text-generator",
      ...this.defaultHeaders,
    };


    const Fetch = this.plugin.textGenerator.proxyService.getFetch(
      this.corsBypass ||
      this.default_values.corsBypass ||
      options.otherOptions.corsBypass
    )

    const llm = new (this.llmClass as typeof ChatOpenAI)(this.getConfig(options), {
      basePath: options.basePath?.length
        ? options.basePath.endsWith("/")
          ? options.basePath.substring(0, options.basePath.length - 1)
          : options.basePath
        : undefined,
      dangerouslyAllowBrowser: true,
      defaultQuery: options.bodyParams,
      fetch: Fetch,
      defaultHeaders: headers,
    });

    // @ts-ignore
    llm.clientOptions ??= {};
    // @ts-ignore
    llm.clientOptions.fetch = Fetch;

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

        const llm = (await this.getLLM(params)) as HuggingFaceInference;

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
          const chain = getChain(
            customConfig?.chain.loader,
            llm,
            customConfig.chain
          );

          const res = await chain.invoke(
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

          console.log({ messages, k: "invoked", llmpredict: reqParams.llmPredict, llmPredict2: this.llmPredict })
          if (reqParams.llmPredict || this.llmPredict)
            r = await (llm as any as ChatOpenAI).invoke(
              chatToString(messages)
              ,
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
              mapMessagesToLangchainMessages(messages),
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
              .map((c) =>
                c.type == "image_url" ? `![](${c.image_url})` : c.type == "text" ? c.text : ""
              )
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
                  await (llm as HuggingFaceInference).generate(
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
            await (llm as HuggingFaceInference).generate(
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
        numTokens += encoder.encode(value).length;
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
  return typeof content == "string" ? content : Object.values(content).join(' ')
}

function chatToString(messages: Message[] = []) {
  return messages.length > 1
    ? // user: test1
    // assistant: test2
    // ...
    messages.map((msg) => {
      return `${msg.role}:${contentToString(msg.content)}`
    }).join("\n")
    : // test1
    contentToString(messages[0].content)
    ;
}

function getChain(chainName: string, llm: any, config: any) {
  const loader = chains[
    (chainName as keyof typeof chains) || "loadSummarizationChain"
  ] as typeof chains.loadSummarizationChain;

  const chain = loader(llm, {
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
}

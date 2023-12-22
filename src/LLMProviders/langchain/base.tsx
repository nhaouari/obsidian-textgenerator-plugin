/* eslint-disable no-debugger */
import debug from "debug";
import React from "react";

import { ChatOpenAI, OpenAIChatInput } from "langchain/chat_models/openai";
import { HuggingFaceInference } from "langchain/llms/hf";

import BaseProvider from "../base";
import { Message } from "../../types";
import { mapMessagesToLangchainMessages, processPromisesSetteledBatch } from "../../utils";
import LLMProviderInterface, { LLMConfig } from "../interface";

import { AI_MODELS } from "#/constants";
import { ContextTemplate } from "#/scope/context-manager";

import { PromptTemplate } from "langchain/prompts";
import { TypedPromptInputValues } from "langchain/dist/prompts/base";
import { chains, splitters } from "#/lib/langchain";

const logger = debug("textgenerator:LangchainProvider");

export default class LangchainProvider
  extends BaseProvider
  implements LLMProviderInterface {
  streamable = true;
  /** generate candidates in parallel instead of sending the variable n */
  legacyN = false;
  id = "default";
  static slug = "default" as any;
  llmPredict = false;
  provider = "Langchain";
  static provider = "Langchain";
  llmClass: any;

  defaultHeaders?: Record<string, string | null>

  getConfig(options: LLMConfig) {
    return this.cleanConfig({
      openAIApiKey: options.api_key,

      // ------------Necessary stuff--------------
      modelName: options.model,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty,
      presencePenalty: +options.presence_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    } as Partial<OpenAIChatInput>);
  }

  async load() {
    this.llmClass = ChatOpenAI;
  }

  getLLM(options: LLMConfig) {
    return new (this.llmClass as typeof ChatOpenAI)(this.getConfig(options), {
      basePath: options.basePath?.length
        ? options.basePath.endsWith("/")
          ? options.basePath.substring(0, options.basePath.length - 1)
          : options.basePath
        : undefined,

      defaultQuery: options.bodyParams,

      defaultHeaders: {
        "User-Agent": undefined,
        "HTTP-Referer": location.origin,
        "X-Title": "obsidian-text-generator",
        ...this.defaultHeaders
      },
    }) as any;
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

        const llm = this.getLLM(params) as HuggingFaceInference;

        let first = true;
        let allText = "";

        const llmFuncs: Parameters<
          InstanceType<typeof ChatOpenAI>["predict"]
        >["2"] = [
            {
              ...(onToken &&
                params.stream && {
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

          console.log({ chain });

          const res = await chain.call(
            {
              input_documents: docs,
              signal: reqParams.requestParams?.signal || undefined,
            },
            {
              callbacks: llmFuncs,
            }
          );

          result = res.text;
        } else {
          if (reqParams.llmPredict || this.llmPredict)
            result = await (llm as any as ChatOpenAI).predict(
              messages.length > 1
                ? // user: test1
                // assistant: test2
                // ...
                messages
                  .map((msg) => `${msg.role}:${msg.content}`)
                  .join("\n")
                : // test1
                messages[0].content,
              {
                signal: params.requestParams?.signal || undefined,
                ...this.getReqOptions(params),
                // options: {
                //   body: params.bodyParams,
                // },
              },
              llmFuncs
            )
          else {
            const res = (
              await llm.predictMessages(
                mapMessagesToLangchainMessages(messages),
                {
                  signal: params.requestParams?.signal || undefined,
                },
                llmFuncs
              )
            );

            // @ts-ignore
            result = res.content;
          }
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
        const llm = this.getLLM(params);
        let requestResults: any[] = [];
        if (this.legacyN) {
          await processPromisesSetteledBatch(
            Array.from({ length: reqParams.n || 1 }).
              map(async () => {
                requestResults.push(...(await (llm as HuggingFaceInference).generate(
                  reqParams.llmPredict || this.llmPredict
                    ? messages.length > 1
                      ? // user: test1
                      // assistant: test2
                      // ...
                      [messages.map((msg) => `${msg.role}:${msg.content}`).join("\n")]
                      : // test1
                      [messages[0].content]
                    : [mapMessagesToLangchainMessages(messages) as any as string],
                  {
                    signal: params.requestParams?.signal || undefined,
                    ...this.getReqOptions(params),
                  }
                )).generations[0])
              }),
            2
          )

        } else
          requestResults = (await (llm as HuggingFaceInference).generate(
            reqParams.llmPredict || this.llmPredict
              ? messages.length > 1
                ? // user: test1
                // assistant: test2
                // ...
                [messages.map((msg) => `${msg.role}:${msg.content}`).join("\n")]
                : // test1
                [messages[0].content]
              : [mapMessagesToLangchainMessages(messages) as any as string],
            {
              signal: params.requestParams?.signal || undefined,
              ...this.getReqOptions(params),
            }
          )).generations[0];

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

  // old code
  //   async generateBatch(
  //     messages: Message[][],
  //     reqParams: Partial<LLMConfig>,
  //     customConfig?: any,
  //     onOneFinishs?: (content: string, index: number) => void
  //   ): Promise<string[]> {
  //     return new Promise(async (s, r) => {
  //       try {
  //         const arrDocs =
  //           reqParams.llmPredict || this.llmPredict || customConfig?.chain?.type
  //             ? messages.map((msgs) => chatToString(msgs))
  //             : (messages.map((msgs) =>
  //                 mapMessagesToLangchainMessages(msgs)
  //               ) as any as string[]);

  //         console.log({ arrDocs });

  //         logger("generateMultiple", reqParams);

  //         const params = this.configMerger(reqParams);
  //         const chat = this.getLLM(params);

  //         let results: string[] = [];
  //         if (customConfig?.chain?.type)
  //           results = await chainGenrate(chat, arrDocs, {
  //             chain: customConfig.chain,
  //             splitter: customConfig.splitter,
  //             signal: reqParams.requestParams?.signal,
  //             onOneFinishs,
  //           });
  //         else
  //           results = (
  //             await processPromisesSetteledBatch(
  //               arrDocs.map(async (doc, i) => {
  //                 const [err, res] = await safeAwait(
  //                   (chat as HuggingFaceInference).generate([doc], {
  //                     signal: reqParams.requestParams?.signal || undefined,
  //                     ...this.getReqOptions(reqParams),
  //                     n: 1,
  //                   })
  //                 );

  //                 const content = err
  //                   ? "fAILED:" + err.message
  //                   : res.generations[0][0].text;

  //                 await onOneFinishs?.(content, i);

  //                 if (err) throw err;

  //                 return content;
  //               }),
  //               3
  //             )
  //           ).map(promiseForceFullfil);

  //         logger("generateMultiple end", {
  //           results,
  //         });

  //         s(results);
  //       } catch (errorRequest: any) {
  //         logger("generateMultiple error", errorRequest);
  //         return r(errorRequest);
  //       }
  //     });
  //   }

  async convertToChain(
    templates: ContextTemplate,
    reqParams: Partial<LLMConfig>
  ): Promise<chains.LLMChain<string, any>> {
    return new Promise(async (s, r) => {
      try {
        logger("generateMultiple", reqParams);

        const prompt = new PromptTemplate({
          template: templates.inputTemplate as any,
          inputVariables: [],
        });

        prompt.format = async function format(
          values: TypedPromptInputValues<any>
        ): Promise<string> {
          const allValues = await prompt.mergePartialAndUserVariables(values);
          return await (prompt.template as any)(allValues);
        };

        const params = this.configMerger(reqParams);
        const chat = this.getLLM(params);

        const llm = new chains.LLMChain({
          llm: chat,
          prompt,
          llmKwargs: {
            signal: params.requestParams?.signal || undefined,
            ...this.getReqOptions(params),
          },
        });

        return llm;
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
      AI_MODELS[model as keyof typeof AI_MODELS] ||
      AI_MODELS["gpt-3.5-turbo"];

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

function chatToString(messages: Message[] = []) {
  return messages.length > 1
    ? // user: test1
    // assistant: test2
    // ...
    messages.map((msg) => `${msg.role}:${msg.content}`).join("\n")
    : // test1
    messages[0].content;
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

import BaseProvider from "../base";
import { Message } from "../../types";
import { ChatOpenAI, OpenAIChatInput } from "langchain/chat_models/openai";
import { HuggingFaceInference } from "langchain/llms/hf";
import { mapMessagesToLangchainMessages } from "../../utils";
import debug from "debug";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { BaseChatModelParams } from "langchain/dist/chat_models/base";
import { OPENAI_MODELS } from "#/constants";

const logger = debug("textgenerator:LangchainProvider");

export default class LangchainProvider
  extends BaseProvider
  implements LLMProviderInterface
{
  streamable = true;
  id = "default";
  getConfig(
    options: LLMConfig
  ): Partial<OpenAIChatInput & BaseChatModelParams> {
    return this.cleanConfig({
      openAIApiKey: options.api_key,

      // ------------Necessary stuff--------------
      modelName: options.engine,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: options.frequency_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    });
  }

  getLLM(options: LLMConfig) {
    return new ChatOpenAI({
      ...this.getConfig(options),
    }) as any;
  }

  getReqOptions(options: LLMConfig) {
    return {} as any;
  }

  async generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>
  ): Promise<string> {
    return new Promise(async (s, r) => {
      let alreadyBegainGenerating = false;
      let result = "";
      try {
        logger("generate", reqParams);

        const params = {
          ...this.cleanConfig(this.plugin.settings),
          ...this.cleanConfig(reqParams.otherOptions),
          ...this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
              this.id as keyof typeof this.plugin.settings
            ]
          ),

          ...this.cleanConfig(reqParams),
          otherOptions: this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
              this.id as keyof typeof this.plugin.settings
            ]
          ),
        };

        // if the model is streamable
        params.stream = params.stream && this.streamable;

        const chat = this.getLLM(params) as HuggingFaceInference;

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
              console.log("ended");
              if (params.stream) s(allText);
            },
          },
        ];

        result = reqParams.llmPredict
          ? await (chat as any as ChatOpenAI).predict(
              messages.length > 1
                ? // user: test1
                  // assistant: test2
                  // ...
                  messages.map((msg) => `${msg.role}:${msg.content}`).join("\n")
                : // test1
                  messages[0].content,
              {
                signal: params.requestParams?.signal || undefined,
                ...this.getReqOptions(params),
              },
              llmFuncs
            )
          : (
              await chat.predictMessages(
                mapMessagesToLangchainMessages(messages),
                {
                  signal: params.requestParams?.signal || undefined,
                },
                llmFuncs
              )
            ).content;

        // console.log("used Tokens: ", { allTokens });
        logger("generate end", {
          result,
        });

        if (!params.streaming) {
          s(result);
        }
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

        const params = {
          ...this.cleanConfig(this.plugin.settings),
          ...this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
              this.id as keyof typeof this.plugin.settings
            ]
          ),
          ...this.cleanConfig(reqParams.otherOptions),
          ...this.cleanConfig(reqParams),
          otherOptions: this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
              this.id as keyof typeof this.plugin.settings
            ]
          ),
        };

        const chat = this.getLLM(params);

        const requestResults = await (chat as ChatOpenAI).generate(
          [mapMessagesToLangchainMessages(messages)],
          {
            signal: params.requestParams?.signal || undefined,
            ...this.getReqOptions(params),
          }
        );

        logger("generateMultiple end", {
          requestResults,
        });

        s(requestResults.generations[0].map((a: any) => a.text));
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
    const model = reqParams.engine;
    const modelInfo =
      OPENAI_MODELS[model as keyof typeof OPENAI_MODELS] ||
      OPENAI_MODELS["gpt-3.5-turbo"];

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

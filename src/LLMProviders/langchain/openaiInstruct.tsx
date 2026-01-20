import React from "react";
import debug from "debug";
import LangchainBase from "./base";
import type { OpenAI, OpenAIInput } from "@langchain/openai";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { HeaderEditor, ModelsHandler } from "../utils";

import { AI_MODELS, Input, Message, SettingItem, useGlobal } from "../refs";

const logger = debug("textgenerator:llmProvider:openaiInstruct");

const default_values = {
  basePath: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo-instruct",
};

export default class LangchainOpenAIInstructProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static provider = "Langchain";
  static id = "OpenAI Instruct (Langchain)" as const;
  static slug = "openAIInstruct" as const;
  static displayName = "OpenAI Instruct";

  llmPredict = true;

  provider = LangchainOpenAIInstructProvider.provider;
  id = LangchainOpenAIInstructProvider.id;
  originalId = LangchainOpenAIInstructProvider.id;
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
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      headers: options.headers || undefined as any,
    } as Partial<OpenAIInput>);
  }

  async load() {
    const { OpenAI } = await import("@langchain/openai");
    this.llmClass = OpenAI;
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

        const llm = await this.getLLM(params);

        const requestResults = await (llm as OpenAI).generate(
          messages.map((m) => m.content as any),
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

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
    });

    return (
      <>
        <SettingItem
          name="API Key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              global.plugin.settings.api_key = value;
              config.api_key = value;

              global.triggerReload();
              global.plugin.encryptAllKeys();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Base Path"
          description={`Make sure it supports CORS`}
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.basePath || default_values.basePath}
            placeholder="Enter your API Base Path"
            setValue={async (value) => {
              config.basePath = value;
              global.plugin.settings.endpoint = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <ModelsHandler
          register={props.register}
          sectionId={props.sectionId}
          llmProviderId={props.self.originalId || id}
          default_values={default_values}
        />

        <HeaderEditor
          enabled={!!config.headers}
          setEnabled={async (value) => {
            if (!value) config.headers = undefined;
            else config.headers = "{}";
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
          headers={config.headers}
          setHeaders={async (value) => {
            config.headers = value;
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
        />
        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://beta.openai.com/signup/">
            <SettingItem
              name="Create account OpenAI"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/api-reference/introduction">
            <SettingItem
              name="API documentation"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://discord.com/channels/1083485983879741572/1159894948636799126">
            <SettingItem
              name="You can use LM Studio"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/models/overview">
            <SettingItem
              name="more information"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
        </div>
      </>
    );
  }

  async calcPrice(
    tokens: number,
    reqParams: Partial<LLMConfig>
  ): Promise<number> {
    const model = reqParams.model;
    const modelInfo =
      AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS["gpt-3.5-turbo"];

    console.log(reqParams.max_tokens, modelInfo.prices.completion);
    return (
      (tokens * modelInfo.prices.prompt +
        (reqParams.max_tokens || 100) * modelInfo.prices.completion) /
      1000
    );
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
}

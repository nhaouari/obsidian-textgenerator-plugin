import React from "react";
import LangchainBase from "./base";

import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { HeaderEditor, ModelsHandler } from "../utils";
import debug from "debug";

import { AI_MODELS, Dropdown, Input, Message, SettingItem, useGlobal } from "../refs";
import { OpenAIChatInput } from "@langchain/openai";

const logger = debug("textgenerator:llmProvider:openaiAgent");

const default_values = {
  basePath: "https://api.openai.com/v1",
  model: "o1-mini",
  reasoningEffort: "medium" as "low" | "medium" | "high",
};

export default class LangchainOpenAIAgentProvider
  extends LangchainBase
  implements LLMProviderInterface {
  /** for models to know what provider is that, for example if this class is being extended. and the id changes. */

  static provider = "Langchain";
  static id = "OpenAI Agent (Langchain)" as const;
  static slug = "openAIAgent" as const;
  static displayName = "OpenAI Agent (Thinking Models)";

  id = LangchainOpenAIAgentProvider.id;
  provider = LangchainOpenAIAgentProvider.provider;
  originalId = LangchainOpenAIAgentProvider.id;

  default_values = default_values;

  async load() {
    const { ChatOpenAI } = await import("@langchain/openai");
    this.llmClass = ChatOpenAI;
  }

  getConfig(options: LLMConfig) {
    const reasoningEffort = options.reasoningEffort || this.default_values.reasoningEffort || "medium";

    return this.cleanConfig({
      // In langchain v1, use apiKey instead of openAIApiKey
      apiKey: options.api_key,
      openAIApiKey: options.api_key, // Keep for backward compatibility

      // ------------Necessary stuff--------------
      modelKwargs: {
        ...options.modelKwargs,
        // Add reasoning effort for o-series thinking models
        reasoning_effort: reasoningEffort,
      },
      modelName: options.model,
      // frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n || 1,
      stop: options.stop || undefined,
      streaming: options.stream || false,
      maxRetries: 3,
      headers: options.headers || undefined,

      bodyParams: {
        max_completion_tokens: +options.max_tokens,
      },
    } as Partial<OpenAIChatInput>);
  }


  //   getLLM(options: LLMConfig) {
  //     return new ChatOpenAI({
  //       ...this.getConfig(options),
  //     });
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
    });

    return (
      <React.Fragment key={id}>
        <SettingItem
          name="API Key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              if (props.self.originalId == id)
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
              config.basePath = value || default_values.basePath;
              global.plugin.settings.endpoint =
                value || default_values.basePath;
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
          config={config}
        />

        <SettingItem
          name="Reasoning Effort"
          description="Controls how much effort the model spends on reasoning (for thinking models)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Dropdown
            value={config.reasoningEffort || default_values.reasoningEffort}
            setValue={async (value) => {
              config.reasoningEffort = value;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
            values={["low", "medium", "high"]}
          />
        </SettingItem>

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
          <div className="plug-tg-text-lg plug-tg-opacity-70">Thinking Models</div>
          <p className="plug-tg-text-sm plug-tg-opacity-60">
            This provider is optimized for OpenAI's reasoning models (o1, o3, o4 series).
            These models use extended thinking to provide more thorough responses.
          </p>
        </div>

        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://platform.openai.com/signup/">
            <SettingItem
              name="Create account OpenAI"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://platform.openai.com/docs/guides/reasoning">
            <SettingItem
              name="Reasoning Models Guide"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://platform.openai.com/docs/models">
            <SettingItem
              name="Available Models"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
        </div>
      </React.Fragment>
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
        if (typeof value === 'string') {
          numTokens += encoder.encode(value).length;
          if (key === "name") {
            numTokens += tokensPerName;
          }
        } else if (Array.isArray(value)) {
          // Handle MessageContentComplex[] case
          for (const content of value) {
            if (typeof content === 'object' && 'text' in content) {
              numTokens += encoder.encode(content.text).length;
            }
          }
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

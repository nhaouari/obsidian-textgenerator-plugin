import React from "react";
import debug from "debug";
import LangchainBase from "./base";

import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { BaseLanguageModelParams } from "@langchain/core/language_models/base";

import { Dropdown, fetchWithoutCORS, Input, Message, SettingItem, useGlobal } from "../refs";

import type { AnthropicInput } from "@langchain/anthropic";
import { HeaderEditor, ModelsHandler } from "../utils";

const logger = debug("textgenerator:llmProvider:chatanthropic");


const default_values = {
  basePath: "https://api.anthropic.com/",
  model: "claude-3-5-sonnet-latest",
  enableThinking: false,
  thinkingBudget: 10000,
};



export default class LangchainChatAnthropicProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static provider = "Langchain";
  static id = "Chat Anthropic (Langchain)" as const;
  static slug = "anthropic" as const;
  static displayName = "Chat Anthropic";

  corsBypass = true;

  provider = LangchainChatAnthropicProvider.provider;
  id = LangchainChatAnthropicProvider.id;
  originalId = LangchainChatAnthropicProvider.id;

  default_values = default_values;

  defaultHeaders?: Record<string, string | null> | undefined = {
    "anthropic-dangerous-direct-browser-access": "true"
  }

  getConfig(
    options: LLMConfig
  ): Partial<AnthropicInput & BaseLanguageModelParams> {
    // Check if thinking is enabled (for Claude 4 models)
    const enableThinking = options.enableThinking ||
      options.otherOptions?.enableThinking ||
      false;

    const thinkingBudget = options.thinkingBudget ||
      options.otherOptions?.thinkingBudget ||
      default_values.thinkingBudget;

    // Build thinking config if enabled
    const thinkingConfig = enableThinking ? {
      thinking: {
        type: "enabled" as const,
        budget_tokens: thinkingBudget,
      },
    } : {};

    return this.cleanConfig({
      anthropicApiKey: options.api_key,
      anthropicApiUrl: options.basePath,
      // stopSequences: options.stop,

      // ------------Necessary stuff--------------
      modelKwargs: {
        ...options.modelKwargs,
        ...thinkingConfig,
      },
      modelName: options.model,
      maxTokens: options.max_tokens,
      temperature: enableThinking ? 1 : options.temperature, // Temperature must be 1 for thinking models
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      headers: options.headers || undefined,
    });
  }

  async load() {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    this.llmClass = ChatAnthropic;
  }

  //   getLLM(options: LLMConfig) {
  //     return new ChatAnthropic({
  //       ...this.getConfig(options),
  //     });
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= { ...props.self.default_values });

    // Check if current model is a thinking model (Claude 4)
    const isThinkingModel = config.model?.includes("claude-opus-4") ||
      config.model?.includes("claude-sonnet-4");

    return (
      <>
        <SettingItem
          name="Anthropic api key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              config.api_key = value;
              global.plugin.encryptAllKeys();
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Base Path"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.basePath}
            placeholder="Enter your API BasePath"
            setValue={async (value) => {
              config.basePath = value;
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
          getModels={async () => {
            try {
              if (!config.api_key) {
                throw new Error("Please provide a valid api key.");
              }

              let basePath = config.basePath || default_values.basePath || "https://api.anthropic.com";

              if (basePath.endsWith("/")) {
                basePath = basePath.slice(0, -1);
              }

              const reqParams = {
                url: `${basePath}/v1/models`,
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": config.api_key,
                  "anthropic-version": "2023-06-01",
                },
              };

              const response = await fetchWithoutCORS(reqParams);
              const data = JSON.parse(response) as { data: { id: string }[] };

              if (!data.data || !Array.isArray(data.data)) {
                throw new Error("Invalid response format from API");
              }

              const postingModels: string[] = [];

              data.data.forEach(model => {
                postingModels.push(model.id);
              });

              return postingModels.sort();
            } catch (err: any) {
              global.plugin.handelError(err);
              return [];
            }
          }}
        />

        {/* Extended Thinking Options - only show for Claude 4 thinking models */}
        {isThinkingModel && (
          <>
            <div className="plug-tg-text-lg plug-tg-opacity-70 plug-tg-mt-4">Extended Thinking</div>
            <SettingItem
              name="Enable Extended Thinking"
              description="Allows Claude to think through complex problems step by step"
              register={props.register}
              sectionId={props.sectionId}
            >
              <Input
                type="checkbox"
                value={config.enableThinking ? "true" : "false"}
                setValue={async (value) => {
                  config.enableThinking = value === "true";
                  global.triggerReload();
                  await global.plugin.saveSettings();
                }}
              />
            </SettingItem>

            {config.enableThinking && (
              <SettingItem
                name="Thinking Budget"
                description="Maximum tokens for the thinking process (1,024 - 100,000)"
                register={props.register}
                sectionId={props.sectionId}
              >
                <Input
                  type="number"
                  value={String(config.thinkingBudget || default_values.thinkingBudget)}
                  placeholder="10000"
                  setValue={async (value) => {
                    const budget = Math.max(1024, Math.min(100000, parseInt(value) || 10000));
                    config.thinkingBudget = budget;
                    global.triggerReload();
                    await global.plugin.saveSettings();
                  }}
                />
              </SettingItem>
            )}
          </>
        )}

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
          <a href="https://docs.anthropic.com/claude/reference/getting-started-with-the-api">
            <SettingItem
              name="Getting started"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://docs.anthropic.com/en/docs/about-claude/models">
            <SettingItem
              name="Available models"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking">
            <SettingItem
              name="Extended Thinking Guide"
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


  makeMessage(content: any, role: "system" | "user" | "assistant"): Message {
    return {
      role: role === "user" ? "human" : role,
      content
    };
  }
}

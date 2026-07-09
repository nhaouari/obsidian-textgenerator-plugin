import React from "react";
import LangchainBase from "./base";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "#/ui/icons";
import { ModelsHandler, HeaderEditor } from "../utils";
import debug from "debug";
import { OpenAIChatInput } from "@langchain/openai";
import { Input, SettingItem, useGlobal } from "../refs";

const logger = debug("textgenerator:llmProvider:minimaxChat");

const default_values = {
  basePath: "https://api.minimax.io/v1",
  model: "MiniMax-M3",
};

export default class LangchainMiniMaxChatProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  static provider = "Langchain" as const;
  static id = "MiniMax (Langchain)" as const;
  static slug = "minimax" as const;
  static displayName = "MiniMax";

  streamable = true;

  id = LangchainMiniMaxChatProvider.id;
  provider = LangchainMiniMaxChatProvider.provider;
  originalId = LangchainMiniMaxChatProvider.id;

  default_values = default_values;

  async load() {
    const { ChatOpenAI } = await import("@langchain/openai");
    this.llmClass = ChatOpenAI;
  }

  getConfig(options: LLMConfig): Partial<OpenAIChatInput> {
    return this.cleanConfig({
      apiKey: options.api_key,
      openAIApiKey: options.api_key,

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

  RenderSettings(
    props: Parameters<LLMProviderInterface["RenderSettings"]>[0]
  ) {
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
              config.api_key = value;
              global.triggerReload();
              global.plugin.encryptAllKeys();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Base Path"
          description="MiniMax OpenAI-compatible API endpoint"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.basePath || default_values.basePath}
            placeholder="Enter your API Base Path"
            setValue={async (value) => {
              config.basePath = value || default_values.basePath;
              global.triggerReload();
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
          <a href="https://platform.minimax.io/docs/api-reference/api-overview">
            <SettingItem
              name="API documentation"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://platform.minimaxi.com/docs/api-reference/api-overview">
            <SettingItem
              name="API documentation (China)"
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
}

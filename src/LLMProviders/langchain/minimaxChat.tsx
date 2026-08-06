import React from "react";
import type { BaseLanguageModelParams } from "@langchain/core/language_models/base";
import type { AnthropicInput } from "@langchain/anthropic";
import type { OpenAIChatInput } from "@langchain/openai";

import { IconExternalLink } from "#/ui/icons";
import LangchainBase from "./base";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { HeaderEditor, ModelsHandler } from "../utils";
import { Dropdown, Input, Message, SettingItem, useGlobal } from "../refs";
import {
  calculateMiniMaxPrice,
  getMiniMaxEndpoint,
  getMiniMaxModelKwargs,
  MINIMAX_DEFAULT_THINKING_MODES,
  MINIMAX_DOCS,
  MINIMAX_MODELS,
  MiniMaxProtocol,
  MiniMaxRegion,
  MiniMaxServiceTier,
  MiniMaxThinkingMode,
  normalizeMiniMaxMessages,
  wrapMiniMaxAnthropicFetch,
} from "./minimaxConfig";

const commonDefaultValues = {
  apiRegion: "Global" as MiniMaxRegion,
  model: MINIMAX_MODELS.m3,
  thinkingMode: "adaptive" as const,
  serviceTier: "standard" as const,
};

const openAIDefaultValues = {
  ...commonDefaultValues,
  basePath: getMiniMaxEndpoint("Global", "openai"),
};

const anthropicDefaultValues = {
  ...commonDefaultValues,
  basePath: getMiniMaxEndpoint("Global", "anthropic"),
  thinkingMode: MINIMAX_DEFAULT_THINKING_MODES.anthropic,
};

type MiniMaxDefaultValues = {
  apiRegion: MiniMaxRegion;
  model: string;
  thinkingMode: MiniMaxThinkingMode;
  serviceTier: MiniMaxServiceTier;
  basePath: string;
};

function MiniMaxSettings({
  props,
  protocol,
  defaultValues,
}: {
  props: Parameters<LLMProviderInterface["RenderSettings"]>[0];
  protocol: MiniMaxProtocol;
  defaultValues: MiniMaxDefaultValues;
}) {
  const global = useGlobal();
  const id = props.self.id;
  const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
    ...defaultValues,
  });
  const isM3 = (config.model || defaultValues.model) === MINIMAX_MODELS.m3;

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
        name="API Region"
        register={props.register}
        sectionId={props.sectionId}
      >
        <Dropdown
          value={config.apiRegion || defaultValues.apiRegion}
          values={["Global", "China"]}
          setValue={async (value) => {
            const region = value as MiniMaxRegion;
            config.apiRegion = region;
            config.basePath = getMiniMaxEndpoint(region, protocol);
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Base Path"
        description={`${
          protocol === "openai" ? "OpenAI" : "Anthropic"
        }-compatible API endpoint`}
        register={props.register}
        sectionId={props.sectionId}
      >
        <Input
          value={config.basePath || defaultValues.basePath}
          placeholder="Enter your API Base Path"
          setValue={async (value) => {
            config.basePath = value || defaultValues.basePath;
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
        />
      </SettingItem>

      <ModelsHandler
        register={props.register}
        sectionId={props.sectionId}
        llmProviderId={props.self.originalId || id}
        default_values={defaultValues}
        config={config}
      />

      {isM3 && (
        <>
          <SettingItem
            name="Thinking Mode"
            register={props.register}
            sectionId={props.sectionId}
          >
            <Dropdown
              value={config.thinkingMode || defaultValues.thinkingMode}
              values={["adaptive", "disabled"]}
              setValue={async (value) => {
                config.thinkingMode = value;
                global.triggerReload();
                await global.plugin.saveSettings();
              }}
            />
          </SettingItem>

          <SettingItem
            name="Service Tier"
            register={props.register}
            sectionId={props.sectionId}
          >
            <Dropdown
              value={config.serviceTier || defaultValues.serviceTier}
              values={["standard", "priority"]}
              setValue={async (value) => {
                config.serviceTier = value;
                global.triggerReload();
                await global.plugin.saveSettings();
              }}
            />
          </SettingItem>
        </>
      )}

      <HeaderEditor
        enabled={!!config.headers}
        setEnabled={async (value) => {
          config.headers = value ? "{}" : undefined;
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
        {(["Global", "China"] as MiniMaxRegion[]).map((region) => (
          <a key={region} href={MINIMAX_DOCS[region][protocol]}>
            <SettingItem
              name={`${region} API documentation`}
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
        ))}
      </div>
    </>
  );
}

abstract class LangchainMiniMaxBaseProvider extends LangchainBase {
  abstract protocol: MiniMaxProtocol;
  abstract default_values: MiniMaxDefaultValues;
  abstract getConfig(options: LLMConfig): any;

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    return (
      <MiniMaxSettings
        props={props}
        protocol={this.protocol}
        defaultValues={this.default_values}
      />
    );
  }

  generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>,
    customConfig?: any
  ) {
    return super.generate(
      normalizeMiniMaxMessages(messages, this.protocol),
      reqParams,
      onToken,
      customConfig
    );
  }

  generateMultiple(messages: Message[], reqParams: Partial<LLMConfig>) {
    return super.generateMultiple(
      normalizeMiniMaxMessages(messages, this.protocol),
      reqParams
    );
  }

  async calcPrice(tokens: number, reqParams: Partial<LLMConfig>) {
    return calculateMiniMaxPrice(
      tokens,
      reqParams.max_tokens || 100,
      reqParams.model || MINIMAX_MODELS.m3,
      reqParams.serviceTier || "standard"
    );
  }
}

export default class LangchainMiniMaxOpenAIProvider
  extends LangchainMiniMaxBaseProvider
  implements LLMProviderInterface
{
  static provider = "Langchain" as const;
  static id = "MiniMax OpenAI (Langchain)" as const;
  static slug = "minimaxOpenAI" as const;
  static displayName = "MiniMax OpenAI";

  protocol = "openai" as const;
  streamable = true;
  id = LangchainMiniMaxOpenAIProvider.id;
  provider = LangchainMiniMaxOpenAIProvider.provider;
  originalId = LangchainMiniMaxOpenAIProvider.id;
  default_values = openAIDefaultValues;

  async load() {
    const { ChatOpenAI } = await import("@langchain/openai");
    this.llmClass = ChatOpenAI;
  }

  getConfig(options: LLMConfig): Partial<OpenAIChatInput> {
    return this.cleanConfig({
      apiKey: options.api_key,
      openAIApiKey: options.api_key,
      modelKwargs: getMiniMaxModelKwargs(
        options.model,
        options.thinkingMode,
        options.serviceTier,
        options.modelKwargs
      ),
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
}

export class LangchainMiniMaxAnthropicProvider
  extends LangchainMiniMaxBaseProvider
  implements LLMProviderInterface
{
  static provider = "Langchain" as const;
  static id = "MiniMax Anthropic (Langchain)" as const;
  static slug = "minimaxAnthropic" as const;
  static displayName = "MiniMax Anthropic";

  protocol = "anthropic" as const;
  streamable = true;
  corsBypass = true;
  id = LangchainMiniMaxAnthropicProvider.id;
  provider = LangchainMiniMaxAnthropicProvider.provider;
  originalId = LangchainMiniMaxAnthropicProvider.id;
  default_values = anthropicDefaultValues;

  async load() {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    this.llmClass = class MiniMaxChatAnthropic extends ChatAnthropic {
      constructor(fields: any) {
        const { configuration = {}, ...rest } = fields;
        const fetchImpl = configuration.fetch || globalThis.fetch;
        super({
          ...rest,
          clientOptions: {
            ...rest.clientOptions,
            ...configuration,
            fetch: wrapMiniMaxAnthropicFetch(fetchImpl),
          },
        });
      }
    };
  }

  getConfig(
    options: LLMConfig
  ): Partial<AnthropicInput & BaseLanguageModelParams> {
    const modelKwargs = getMiniMaxModelKwargs(
      options.model,
      options.thinkingMode,
      options.serviceTier,
      options.modelKwargs
    );
    const { thinking, service_tier, ...invocationKwargs } = modelKwargs as any;

    return this.cleanConfig({
      anthropicApiKey: options.api_key,
      anthropicApiUrl: options.basePath,
      modelName: options.model,
      maxTokens: options.max_tokens,
      temperature:
        thinking?.type === "adaptive" ? undefined : options.temperature,
      stopSequences: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      thinking,
      invocationKwargs: {
        ...invocationKwargs,
        ...(service_tier ? { service_tier } : {}),
      },
    } as any);
  }
}

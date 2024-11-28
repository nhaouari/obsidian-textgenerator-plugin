import React from "react";
import debug from "debug";
import LangchainBase from "./base";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { BaseLLMParams } from "@langchain/core/language_models/llms";

import { OllamaInput } from "@langchain/community/llms/ollama";

import { Input, SettingItem, useGlobal } from "../refs";

const logger = debug("textgenerator:llmProvider:ollama");

export default class LangchainOllamaProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static slug = "ollama" as const;

  static provider = "Langchain";
  static id = "Ollama (Langchain)" as const;
  static displayName = "Ollama";

  streamable = true;
  llmPredict = true;

  corsBypass = true;

  id = LangchainOllamaProvider.id;
  provider = LangchainOllamaProvider.provider;
  originalId = LangchainOllamaProvider.id;

  getConfig(options: LLMConfig): Partial<OllamaInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      baseUrl: options.basePath,

      // ------------Necessary stuff--------------
      modelKwargs: options.modelKwargs,
      model: options.model as any,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      headers: options.headers || undefined as any,
    });
  }

  async load() {
    const { Ollama } = await import("@langchain/community/llms/ollama");
    this.llmClass = Ollama;
  }

  //   getLLM(options: LLMConfig) {
  //     return new Ollama({
  //       ...this.getConfig(options),
  //     } as any);
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {});
    return (
      <>
        <SettingItem
          name="Base Path"
          description={`Make sure it supports CORS`}
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.basePath}
            placeholder="Enter your API basePath"
            setValue={async (value) => {
              config.basePath = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Model"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.model}
            setValue={async (value) => {
              config.model = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://discord.com/channels/1083485983879741572/1202326921858523246">
            <SettingItem
              name="How to use locally hosted ollama (Discord Link)"
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

import React from "react";
import debug from "debug";
import LangchainBase from "./base";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { BaseLLMParams } from "langchain/llms/base";
import type { HFInput } from "langchain/llms/hf";

const logger = debug("textgenerator:llmProvider:hf");

import { Input, SettingItem, useGlobal } from "../refs";

export default class LangchainHFProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  static provider = "Langchain";
  static id = "Huggingface (Langchain)" as const;
  static slug = "hf" as const;
  static displayName = "Huggingface";

  llmPredict = true;
  streamable = false;
  provider = LangchainHFProvider.provider;
  id = LangchainHFProvider.id;
  originalId = LangchainHFProvider.id;
  getConfig(options: LLMConfig): Partial<HFInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      apiKey: options.otherOptions.api_key,
      // ------------Necessary stuff--------------
      model: options.model || (options.otherOptions.model as any),
      modelKwargs: options.modelKwargs,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      parameters: {
        candidate_labels: ["refund", "legal", "faq"],
      },
    });
  }

  async load() {
    const { HuggingFaceInference } = await import("langchain/llms/hf");
    this.llmClass = HuggingFaceInference;
  }

  //   getLLM(options: LLMConfig) {
  //     return new HuggingFaceInference({
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
          name="API Key"
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
          <a href="https://huggingface.co/settings/tokens">
            <SettingItem
              name="Setup API token"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://huggingface.co/docs/api-inference/index">
            <SettingItem
              name="API documentation"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://huggingface.co/docs/api-inference/faq">
            <SettingItem
              name="More information"
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

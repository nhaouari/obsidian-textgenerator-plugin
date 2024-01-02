import LangchainBase from "./base";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import Input from "#/ui/settings/components/input";
import { BaseLLMParams } from "langchain/llms/base"

import debug from "debug";
import { OllamaInput } from "langchain/llms/ollama";

const logger = debug("textgenerator:llmProvider:ollama");

const id = "Ollama (Langchain)" as const;
export default class LangchainOllamaProvider
  extends LangchainBase
  implements LLMProviderInterface {
  id = id;
  static slug = "ollama" as const;
  provider = "Langchain";
  llmPredict = true;
  static provider = "Langchain";
  static id = id;
  streamable = false;
  getConfig(options: LLMConfig): Partial<OllamaInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      baseUrl: options.basePath,

      // ------------Necessary stuff--------------
      model: options.model as any,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: options.frequency_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    });
  }

  async load() {
    const { Ollama } = await import("langchain/llms/ollama");
    this.llmClass = Ollama;
  }

  //   getLLM(options: LLMConfig) {
  //     return new Ollama({
  //       ...this.getConfig(options),
  //     } as any);
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {});
    return (
      <>
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
}

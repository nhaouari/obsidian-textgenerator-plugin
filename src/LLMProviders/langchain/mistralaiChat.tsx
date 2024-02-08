import LangchainBase from "./base";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import Input from "#/ui/settings/components/input";

import debug from "debug";
import { ModelsHandler } from "../utils";
import { OpenAIChatInput } from "langchain/chat_models/openai";

const logger = debug("textgenerator:llmProvider:mistralChat");


const default_values = {
  basePath: "https://api.mistral.ai/v1",
};

export default class LangchainMistralAIChatProvider
  extends LangchainBase
  implements LLMProviderInterface {

  static provider = "Langchain" as const;
  static id = "MistralAI Chat (Langchain)" as const;
  static slug = "mistralAIChat" as const;
  static displayName: string = "MistralAI Chat";

  llmPredict = false;
  legacyN: boolean = true;
  streamable = true;
  defaultHeaders?: Record<string, string | null> | undefined = {
    "X-Stainless-OS": null,
    "X-Stainless-Arch": null,
    "X-Stainless-Lang": null,
    "X-Stainless-Runtime": null,
    "X-Stainless-Runtime-Version": null,
    "X-Stainless-Package-Version": null,
    "HTTP-Referer": null,
    "X-Title": null,
  }

  id = LangchainMistralAIChatProvider.id;
  provider = LangchainMistralAIChatProvider.provider;
  originalId = LangchainMistralAIChatProvider.id;

  //   getLLM(options: LLMConfig) {
  //     return new Ollama({
  //       ...this.getConfig(options),
  //     } as any);
  //   }

  getConfig(options: LLMConfig) {
    return this.cleanConfig({
      openAIApiKey: options.api_key,


      // ------------Necessary stuff--------------
      modelKwargs: {
        ...options.modelKwargs,
        response_format: undefined,
        frequency_penalty: undefined,
        presence_penalty: undefined,
        n: undefined
      },
      modelName: options.model,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    } as Partial<OpenAIChatInput>);
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values
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
              config.basePath = value || default_values.basePath;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://console.mistral.ai/users/">
            <SettingItem
              name="Create account mistralAI"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://docs.mistral.ai/api">
            <SettingItem
              name="API documentation"
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

import LangchainBase from "./base";
import React from "react";
import LLMProviderInterface from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import Input from "#/ui/settings/components/input";

import debug from "debug";
import { ModelsHandler } from "../utils";

const logger = debug("textgenerator:llmProvider:mistralChat");


const default_values = {
  basePath: "https://api.mistral.ai/v1",
};

export default class LangchainMistralAIChatProvider
  extends LangchainBase
  implements LLMProviderInterface {

  static slug = "mistralAIChat" as const;
  static provider = "Langchain" as const;
  static id = "MistralAI Chat (Langchain)" as const;

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

  //   getLLM(options: LLMConfig) {
  //     return new Ollama({
  //       ...this.getConfig(options),
  //     } as any);
  //   }

  provider = LangchainMistralAIChatProvider.provider;
  id = LangchainMistralAIChatProvider.id;
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
          llmProviderId={id}
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

        <div className="flex flex-col gap-2">
          <div className="text-lg opacity-70">Useful links</div>
          <a href="https://console.mistral.ai/users/">
            <SettingItem
              name="Create account mistralAI"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://docs.mistral.ai/api">
            <SettingItem
              name="API documentation"
              className="text-xs opacity-50 hover:opacity-100"
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

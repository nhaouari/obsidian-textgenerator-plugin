import LangchainBase from "./base";

import { GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import React, { useId } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import Input from "#/ui/settings/components/input";
import debug from "debug";
import { ModelsHandler } from "../utils";

const logger = debug("textgenerator:llmProvider:gemini");

const default_values = {
  model: "models/gemini-pro"
}


const id = "Google GenerativeAI (Langchain)" as const;
export default class LangchainChatGoogleGenerativeAIProvider
  extends LangchainBase
  implements LLMProviderInterface {
  mobileSupport = true;
  streamable = true;
  legacyN = true
  id = id;
  static id = id;
  provider = "Langchain";
  static provider = "Langchain";
  static slug = "googleGenerativeAI" as const;

  getConfig(options: LLMConfig): Partial<GoogleGenerativeAIChatInput> {
    return this.cleanConfig({
      apiKey: options.api_key,
      modelName: options.model,

      // candidateCount is not supported yet by langchain
      candidateCount: options.n,

      // ------------Necessary stuff--------------
      modelKwargs: options.modelKwargs,
      //   modelName: options.model,
      maxOutputTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: options.frequency_penalty,
      stopSequences: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    });
  }

  async load() {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    this.llmClass = ChatGoogleGenerativeAI;
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values
    });


    return (
      <>
        <SettingItem
          name="Api Key"
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
          llmProviderId={id}
          default_values={default_values}
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

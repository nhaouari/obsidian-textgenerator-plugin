import LangchainBase from "./base";

import { GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import React, { useId } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import Input from "#/ui/settings/components/input";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:gemini");


const id = "Google GenerativeAI (Langchain)" as const;
export default class LangchainChatGoogleGenerativeAIProvider
  extends LangchainBase
  implements LLMProviderInterface {
  mobileSupport = true;
  streamable = false;
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

  //   async getLLM(options: LLMConfig) {
  //     return new ChatGooglePaLM({
  //       ...this.getConfig(options),
  //     });
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      model: "models/gemini-pro"
    });

    const modelsDatasetId = useId();

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
          name="model"
          register={props.register}
          sectionId={props.sectionId}
        >
          <datalist id={modelsDatasetId}>
            <option value="models/gemini-pro" />
          </datalist>
          <Input
            value={config.model}
            datalistId={modelsDatasetId}
            placeholder="Enter your Model name"

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
        <div className="flex flex-col gap-2">
          <div className="text-lg opacity-70">Useful links</div>
          <a href="https://beta.openai.com/signup/">
            <SettingItem
              name="Create account OpenAI"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/api-reference/introduction">
            <SettingItem
              name="API documentation"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/models/overview">
            <SettingItem
              name="more information"
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

import LangchainBase from "./base";

import { GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import debug from "debug";
import { HeaderEditor, ModelsHandler } from "../utils";

import { Input, SettingItem, useGlobal } from "../refs";

const logger = debug("textgenerator:llmProvider:gemini");

const default_values = {
  model: "gemini-2.0-flash",
};

export default class LangchainChatGoogleGenerativeAIProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static provider = "Langchain";
  static id = "Google GenerativeAI (Langchain)" as const;
  static slug = "googleGenerativeAI" as const;
  static displayName = "Google GenerativeAI";

  mobileSupport = true;
  streamable = true;
  legacyN = true;

  provider = LangchainChatGoogleGenerativeAIProvider.provider;
  id = LangchainChatGoogleGenerativeAIProvider.id;
  originalId = LangchainChatGoogleGenerativeAIProvider.id;
  getConfig(options: LLMConfig): Partial<GoogleGenerativeAIChatInput> {
    return this.cleanConfig({
      apiKey: options.api_key,
      model: options.model,

      // candidateCount is not supported yet by langchain
      candidateCount: options.n,

      // ------------Necessary stuff--------------
      modelKwargs: options.modelKwargs,
      //   modelName: options.model,
      maxOutputTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      stopSequences: options.stop,
      streaming: options.stream,
      maxRetries: 3,
      headers: options.headers || undefined,
      baseUrl: options.basePath || undefined,
      apiVersion: options.apiVersion || undefined,
    });
  }

  async load() {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    this.llmClass = ChatGoogleGenerativeAI;
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
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
              global.triggerReload();

              global.plugin.encryptAllKeys();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        {/* <SettingItem
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

              await global.plugin.saveSettings();
            }}
          />
        </SettingItem> */}
        <ModelsHandler
          register={props.register}
          sectionId={props.sectionId}
          llmProviderId={props.self.originalId || id}
          default_values={default_values}
          getModels={async () => {
            // Fetch models from Google Generative AI API
            try {
              if (!config.api_key) {
                throw new Error("Please provide a valid API key");
              }

              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${config.api_key}`
              );

              if (!response.ok) {
                throw new Error(
                  `API request failed with status ${response.status}`
                );
              }

              const data = (await response.json()) as {
                models: { name: string }[];
              };

              if (!data.models || !Array.isArray(data.models)) {
                throw new Error("Invalid response format from API");
              }

              // Extract model names from the response
              return data.models.map((model) =>
                model.name.replace("models/", "")
              );
            } catch (error) {
              global.plugin.handelError(error);
              return [];
            }
          }}
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
          <a href="https://makersuite.google.com/app/apikey">
            <SettingItem
              name="Get API KEY"
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

import React from "react";
import LangchainBase from "./base";
import type {
  AzureOpenAIInput,
  OpenAIChatInput,
} from "langchain/chat_models/openai";
import { BaseChatModelParams } from "langchain/dist/chat_models/base";

import { IconExternalLink } from "@tabler/icons-react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import useGlobal from "#/ui/context/global";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:azureopenaiChat");

const id = "Azure OpenAI Chat (Langchain)" as const;
export default class LangchainAzureOpenAIChatProvider
  extends LangchainBase
  implements LLMProviderInterface {
  id = id;
  static id = id;
  static slug = "azureOpenaiChat" as const;
  provider = "Langchain";
  static provider = "Langchain";
  getConfig(
    options: LLMConfig
  ): Partial<OpenAIChatInput & AzureOpenAIInput & BaseChatModelParams> {
    return this.cleanConfig({
      azureOpenAIApiKey: options.api_key,
      azureOpenAIBasePath: options.otherOptions?.azureOpenAIBasePath,
      azureOpenAIApiInstanceName:
        options.otherOptions?.azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName:
        options.otherOptions?.azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion: options.otherOptions?.azureOpenAIApiVersion,

      // ------------Necessary stuff--------------
      modelKwargs: options.modelKwargs,
      modelName: options.model,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: options.frequency_penalty,
      ...(+options.presence_penalty == null ? {} : { presencePenalty: +options.presence_penalty }),
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    });
  }

  async load() {
    const { ChatOpenAI } = await import("langchain/chat_models/openai");
    this.llmClass = ChatOpenAI;
  }

  //   getLLM(options: LLMConfig) {
  //     return new ChatOpenAI({
  //       ...this.getConfig(options),
  //     });
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

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
              global.triggerReload();
              // TODO: it could use a debounce here
              global.plugin.encryptAllKeys();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Endpoint (optional)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIBasePath}
            placeholder="Enter your API BasePath"
            setValue={async (value) => {
              config.azureOpenAIBasePath = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Instance Name"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIApiInstanceName}
            placeholder="Enter your Instance name"
            setValue={async (value) => {
              config.azureOpenAIApiInstanceName = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Deployment name"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIApiDeploymentName}
            placeholder="Enter your Deployment name"
            setValue={async (value) => {
              config.azureOpenAIApiDeploymentName = value;
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
          <Input
            value={config.model}
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
          name="Api version"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIApiVersion}
            placeholder="Enter your Api version"
            setValue={async (value) => {
              config.azureOpenAIApiVersion = value;
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

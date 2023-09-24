import LangchainBase from "./base";

import type { AnthropicInput } from "langchain/chat_models/anthropic";
import React, { useEffect, useState } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import Dropdown from "#/ui/settings/components/dropdown";
import useGlobal from "#/ui/context/global";
import { IconExternalLink, IconReload } from "@tabler/icons-react";
import { request } from "obsidian";
import clsx from "clsx";
import { useToggle } from "usehooks-ts";
import { BaseLanguageModelParams } from "langchain/dist/base_language";
import Input from "#/ui/settings/components/input";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:chatanthropic");

const id = "Chat Anthropic (Langchain)" as const;
export default class LangchainChatAnthropicProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  id = id;
  static id = id;
  provider = "Langchain";
  static provider = "Langchain";
  getConfig(
    options: LLMConfig
  ): Partial<AnthropicInput & BaseLanguageModelParams> {
    return this.cleanConfig({
      anthropicApiKey: options.api_key,
      anthropicApiUrl: options.otherOptions?.anthropicApiUrl,
      stopSequences: options.stop,

      // ------------Necessary stuff--------------
      modelName: options.engine,
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
    const { ChatAnthropic } = await import("langchain/chat_models/anthropic");
    this.llmClass = ChatAnthropic;
  }

  //   getLLM(options: LLMConfig) {
  //     return new ChatAnthropic({
  //       ...this.getConfig(options),
  //     });
  //   }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {});

    return (
      <>
        <SettingItem
          name="Anthropic api key"
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
            value={config.anthropicApiUrl}
            placeholder="Enter your API BasePath"
            setValue={async (value) => {
              config.anthropicApiUrl = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <ModelsHandler register={props.register} sectionId={props.sectionId} />
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

function ModelsHandler(props: {
  register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
  sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
}) {
  const global = useGlobal();
  const [models, setModels] = useState<Set<string>>(new Set<string>());
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const updateModels = async () => {
    setLoadingUpdate(true);
    try {
      if (global.plugin.settings.api_key.length > 0) {
        const reqParams = {
          url: `${global.plugin.settings.endpoint}/v1/models`,
          method: "GET",
          body: "",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plugin.settings.api_key}`,
          },
        };

        const requestResults: {
          data: {
            id: string;
          }[];
        } = JSON.parse(await request(reqParams));

        requestResults.data.forEach(async (model) => {
          models.add(model.id);
        });

        setModels(new Set(models));

        global.plugin.settings.models = models;
        await global.plugin.saveSettings();
      } else {
        throw "Please provide a valid api key.";
      }
    } catch (err: any) {
      global.plugin.handelError(err);
    }
    setLoadingUpdate(false);
  };
  useEffect(() => {
    if (global.plugin.settings.models?.length > 0) {
      setModels(new Set(global.plugin.settings.models));
    } else {
      [
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-3.5-turbo-16k",
        "gpt-3.5-turbo-16k-0613",
        "gpt-3.5-turbo-0613",
        "gpt-4-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
        "text-davinci-003",
        "text-davinci-002",
        "text-davinci-001",
        "text-curie-001",
        "text-babbage-001",
        "text-ada-001",
      ].forEach((e) => models.add(e));
      global.plugin.settings.models = models;
      global.plugin.saveSettings();
      setModels(new Set(models));
    }
  }, []);

  return (
    <>
      <SettingItem
        name="Model"
        register={props.register}
        sectionId={props.sectionId}
      >
        <div className="flex items-center gap-2">
          <Dropdown
            value={global.plugin.settings.engine}
            setValue={async (selectedModel) => {
              global.plugin.settings.engine = selectedModel;
              await global.plugin.saveSettings();
            }}
            values={[...models].sort()}
          />

          <button
            className={clsx({
              "dz-loading": loadingUpdate,
            })}
            onClick={updateModels}
            disabled={loadingUpdate}
          >
            <IconReload />
          </button>
        </div>
      </SettingItem>
    </>
  );
}

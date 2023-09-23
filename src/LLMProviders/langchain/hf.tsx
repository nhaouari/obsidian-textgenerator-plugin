import LangchainBase from "./base";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import { useToggle } from "usehooks-ts";
import Input from "#/ui/settings/components/input";
import { BaseLLMParams } from "langchain/llms/base";
import type { HFInput } from "langchain/llms/hf";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:hf");

const id = "Huggingface (Langchain)" as const;
export default class LangchainHFProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  id = id;
  static id = id;
  streamable = false;
  getConfig(options: LLMConfig): Partial<HFInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      apiKey: options.otherOptions.api_key,

      // ------------Necessary stuff--------------
      model: options.otherOptions.engine as any,
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
            value={config.api_key}
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
            value={config.engine}
            setValue={async (value) => {
              config.engine = value;
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

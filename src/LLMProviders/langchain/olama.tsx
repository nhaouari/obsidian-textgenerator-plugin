import LangchainBase from "./base";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import { useToggle } from "usehooks-ts";
import Input from "#/ui/settings/components/input";
import { BaseLLMParams } from "langchain/llms/base";
import { Ollama } from "langchain/llms/ollama";

import type { OllamaInput } from "langchain/dist/util/ollama.d.ts";

import debug from "debug";

const logger = debug("textgenerator:llmProvider:ollama");

const id = "Olama (Langchain)" as const;
export default class LangchainOlamaProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  id = id;
  static id = id;
  streamable = false;
  getConfig(options: LLMConfig): Partial<OllamaInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      baseUrl: options.endpoint,

      // ------------Necessary stuff--------------
      model: options.engine as any,
      maxTokens: options.max_tokens,
      temperature: options.temperature,
      frequencyPenalty: options.frequency_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    });
  }

  getLLM(options: LLMConfig) {
    return new Ollama({
      ...this.getConfig(options),
    } as any);
  }

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
            value={config.engine}
            setValue={async (value) => {
              config.engine = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <SettingItem
          name="Endpoint"
          description={`Make sure it supports CORS`}
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.endpoint}
            placeholder="Enter your API endpoint"
            setValue={async (value) => {
              config.endpoint = value;
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

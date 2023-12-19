import LangchainBase from "./base";
import type { OpenAI, OpenAIInput } from "langchain/llms/openai";
import React, { useEffect, useId, useState } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import Dropdown from "#/ui/settings/components/dropdown";
import useGlobal from "#/ui/context/global";
import { IconExternalLink, IconReload } from "@tabler/icons-react";
import { request } from "obsidian";
import clsx from "clsx";
import Input from "#/ui/settings/components/input";
import { AI_MODELS } from "#/constants";
import { Message } from "#/types";
import debug from "debug";
import { ModelsHandler } from "../utils";

const logger = debug("textgenerator:llmProvider:openaiInstruct");

const default_values = {
  basePath: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo-instruct",
};

const id = "OpenAI Instruct (Langchain)" as const;
export default class LangchainOpenAIInstructProvider
  extends LangchainBase
  implements LLMProviderInterface {
  id = id;
  provider = "Langchain";
  llmPredict = true;
  static provider = "Langchain";
  static id = id;
  static slug = "openAIInstruct" as const;

  getConfig(options: LLMConfig) {
    return this.cleanConfig({
      openAIApiKey: options.api_key,

      // ------------Necessary stuff--------------
      modelName: options.model,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    } as Partial<OpenAIInput>);
  }

  async load() {
    const { OpenAI } = await import("langchain/llms/openai");
    this.llmClass = OpenAI;
  }

  async generateMultiple(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): Promise<string[]> {
    return new Promise(async (s, r) => {
      try {
        logger("generateMultiple", reqParams);

        const params = {
          ...this.cleanConfig(this.plugin.settings),
          ...this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
            this.id as keyof typeof this.plugin.settings
            ]
          ),
          ...this.cleanConfig(reqParams.otherOptions),
          ...this.cleanConfig(reqParams),
          otherOptions: this.cleanConfig(
            this.plugin.settings.LLMProviderOptions[
            this.id as keyof typeof this.plugin.settings
            ]
          ),
        };

        const llm = this.getLLM(params);

        const requestResults = await (llm as OpenAI).generate(
          messages.map((m) => m.content),
          {
            signal: params.requestParams?.signal || undefined,
            ...this.getReqOptions(params),
          }
        );

        logger("generateMultiple end", {
          requestResults,
        });

        s(requestResults.generations[0].map((a: any) => a.text));
      } catch (errorRequest: any) {
        logger("generateMultiple error", errorRequest);
        return r(errorRequest);
      }
    });
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
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
              global.plugin.settings.api_key = value;
              config.api_key = value;

              global.triggerReload();
              global.plugin.encryptAllKeys();
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
            value={config.basePath || default_values.basePath}
            placeholder="Enter your API Base Path"
            setValue={async (value) => {
              config.basePath = value;
              global.plugin.settings.endpoint = value;
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
          <a href="https://discord.com/channels/1083485983879741572/1159894948636799126">
            <SettingItem
              name="You can use LM Studio"
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

  async calcPrice(
    tokens: number,
    reqParams: Partial<LLMConfig>
  ): Promise<number> {
    const model = reqParams.model;
    const modelInfo =
      AI_MODELS[model as keyof typeof AI_MODELS] ||
      AI_MODELS["gpt-3.5-turbo"];

    console.log(reqParams.max_tokens, modelInfo.prices.completion);
    return (
      (tokens * modelInfo.prices.prompt +
        (reqParams.max_tokens || 100) * modelInfo.prices.completion) /
      1000
    );
  }

  async calcTokens(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): ReturnType<LLMProviderInterface["calcTokens"]> {
    const model = reqParams.model;
    const modelInfo =
      AI_MODELS[model as keyof typeof AI_MODELS] ||
      AI_MODELS["gpt-3.5-turbo"];

    if (!modelInfo)
      return {
        tokens: 0,
        maxTokens: 0,
      };
    const encoder = this.plugin.tokensScope.getEncoderFromEncoding(
      modelInfo.encoding
    );

    let tokensPerMessage, tokensPerName;
    if (model && ["gpt-3.5-turbo", "gpt-3.5-turbo-0301"].includes(model)) {
      tokensPerMessage = 4;
      tokensPerName = -1;
    } else if (model && ["gpt-4", "gpt-4-0314"].includes(model)) {
      tokensPerMessage = 3;
      tokensPerName = 1;
    } else {
      tokensPerMessage = 3;
      tokensPerName = 1;
    }

    let numTokens = 0;
    for (const message of messages) {
      numTokens += tokensPerMessage;
      for (const [key, value] of Object.entries(message)) {
        numTokens += encoder.encode(value).length;
        if (key === "name") {
          numTokens += tokensPerName;
        }
      }
    }

    numTokens += 3; // every reply is primed with assistant

    return {
      tokens: numTokens,
      maxTokens: modelInfo.maxTokens,
    };
  }
}

import LangchainBase from "./base";
import { OpenAI, OpenAIInput } from "langchain/llms/openai";
import React, { useEffect, useState } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import Dropdown from "#/ui/settings/components/dropdown";
import useGlobal from "#/ui/context/global";
import { IconExternalLink, IconReload } from "@tabler/icons-react";
import { request } from "obsidian";
import clsx from "clsx";
import { useToggle } from "usehooks-ts";
import { BaseChatModelParams } from "langchain/dist/chat_models/base";
import Input from "#/ui/settings/components/input";
import { OPENAI_MODELS } from "#/constants";
import { Message } from "#/types";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:chatgpt");

const default_values = {
  basePath: "https://api.openai.com/v1",
};

const id = "OpenAI (Langchain)" as const;
export default class LangchainOpenAIProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  id = id;
  static id = id;

  getConfig(options: LLMConfig) {
    return this.cleanConfig({
      openAIApiKey: options.api_key,

      // ------------Necessary stuff--------------
      modelName: options.engine,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty,
      n: options.n,
      stop: options.stop,
      streaming: options.stream,
      maxRetries: 3,
    } as Partial<OpenAIInput>);
  }

  getLLM(options: LLMConfig) {
    return new OpenAI(
      {
        ...this.getConfig(options),
      },
      {
        basePath: options.otherOptions?.basePath?.length
          ? options.endpoint
          : undefined,
      }
    );
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
            value={config.api_key}
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
          <a href="https://lmstudio.ai/">
            <SettingItem
              name="You can use LM Studio +v0.2.3"
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
    const model = reqParams.engine;
    const modelInfo =
      OPENAI_MODELS[model as keyof typeof OPENAI_MODELS] ||
      OPENAI_MODELS["gpt-3.5-turbo"];

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
    const model = reqParams.engine;
    const modelInfo =
      OPENAI_MODELS[model as keyof typeof OPENAI_MODELS] ||
      OPENAI_MODELS["gpt-3.5-turbo"];

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

function ModelsHandler(props: {
  register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
  sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
}) {
  const global = useGlobal();
  const [models, setModels] = useState<Set<string>>(new Set<string>());
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
    ...default_values,
  });

  const updateModels = async () => {
    setLoadingUpdate(true);
    try {
      if (global.plugin.settings.api_key.length > 0) {
        console.log(`${config.basePath}/models`);
        const reqParams = {
          url: `${config.basePath}/models`,
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
      Object.entries(OPENAI_MODELS).forEach(
        ([e, o]) => o.llm.contains(id) && models.add(e)
      );
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
            value={config.engine}
            setValue={async (selectedModel) => {
              config.engine = selectedModel;
              //   global.plugin.settings.engine = selectedModel;
              await global.plugin.saveSettings();
              global.triggerReload();
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

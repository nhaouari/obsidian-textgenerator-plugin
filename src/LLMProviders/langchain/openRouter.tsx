import React from "react";
import LangchainBase from "./base";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { IconExternalLink } from "@tabler/icons-react";
import { HeaderEditor, ModelsHandler } from "../utils";
import debug from "debug";
import {
  AI_MODELS,
  Input,
  Message,
  SettingItem,
  useGlobal
} from "../refs";

const logger = debug("textgenerator:llmProvider:openrouter");

const default_values = {
  basePath: "https://openrouter.ai/api/v1",
  model: 'openai/gpt-4o'
};

export default class LangchainOpenRouterChatProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static provider = "Langchain";
  static id = "OpenRouter Chat (Langchain)" as const;
  static slug = "openRouterChat" as const;
  static displayName = "OpenRouter Chat";

  id = LangchainOpenRouterChatProvider.id;
  provider = LangchainOpenRouterChatProvider.provider;
  originalId = LangchainOpenRouterChatProvider.id;

  async load() {
    const { ChatOpenAI } = await import("@langchain/openai");
    this.llmClass = ChatOpenAI;
  }

  RenderSettings(
    props: Parameters<LLMProviderInterface["RenderSettings"]>[0]
  ) {
    const global = useGlobal();
    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values
    });

    return (
      <React.Fragment key={id}>
        <SettingItem
          name="API Key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              if (props.self.originalId === id) {
                global.plugin.settings.api_key = value;
              }
              config.api_key = value;
              global.triggerReload();
              global.plugin.encryptAllKeys();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Base Path"
          description="Your OpenRouter or OpenAI endpoint (must support CORS)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.basePath || default_values.basePath}
            placeholder="Enter your API Base Path"
            setValue={async (value) => {
              config.basePath = value || default_values.basePath;
              global.plugin.settings.endpoint =
                value || default_values.basePath;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <ModelsHandler
          register={props.register}
          sectionId={props.sectionId}
          llmProviderId={props.self.originalId || id}
          default_values={default_values}
          config={config}
        />

        <HeaderEditor
          enabled={!!config.headers}
          setEnabled={async (v) => {
            if (!v) {
              config.headers = undefined;
            } else {
              config.headers = "{}";
            }
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
          headers={config.headers}
          setHeaders={async (h) => {
            config.headers = h;
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
        />

        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">
            Useful links
          </div>
          {[
            {
              href: "https://openrouter.ai/docs",
              name: "OpenRouter docs"
            },
          ].map((l) => (
            <a key={l.href} href={l.href}>
              <SettingItem
                name={l.name}
                className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
                register={props.register}
                sectionId={props.sectionId}
              >
                <IconExternalLink />
              </SettingItem>
            </a>
          ))}
        </div>
      </React.Fragment>
    );
  }

  async calcPrice(
    tokens: number,
    reqParams: Partial<LLMConfig>
  ): Promise<number> {
    const model = reqParams.model || "openai/gpt-4.1";
    const modelInfo =
      AI_MODELS[model as keyof typeof AI_MODELS] ||
      AI_MODELS["openai/gpt-4.1"];

    return (
      (tokens * modelInfo.prices.prompt +
        (reqParams.max_tokens || 0) * modelInfo.prices.completion) /
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
      AI_MODELS["openai/gpt-4.1"];

    if (!modelInfo) {
      return { tokens: 0, maxTokens: 0 };
    }

    const encoder = this.plugin.tokensScope.getEncoderFromEncoding(
      modelInfo.encoding
    );

    let tokensPerMessage: number;
    let tokensPerName: number;
    if (
      model &&
      ["openai/gpt-4.1", "openai/gpt-4.1-0301"].includes(model)
    ) {
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
        if (typeof value === "string") {
          numTokens += encoder.encode(value).length;
          if (key === "name") {
            numTokens += tokensPerName;
          }
        } else if (Array.isArray(value)) {
          for (const content of value) {
            if (typeof content === "object" && content.type === "text") {
              numTokens += encoder.encode(content.text).length;
            }
          }
        }
      }
    }

    numTokens += 3; // every reply is primed with assistant

    return {
      tokens: numTokens,
      maxTokens: modelInfo.maxTokens
    };
  }
}

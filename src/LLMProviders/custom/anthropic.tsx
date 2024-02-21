
import debug from "debug";
import React, { useMemo } from "react";
import LLMProviderInterface from "../interface";
import useGlobal from "#/ui/context/global";
import { getHBValues } from "#/utils/barhandles";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import CustomProvider from "./base";
import { IconExternalLink } from "@tabler/icons-react";

const logger = debug("textgenerator:AnthropicCustomProvider");

const globalVars: Record<string, boolean> = {
  n: true,
  temperature: true,
  timeout: true,
  stream: true,
  messages: true,
  max_tokens: true,
  stop: true,
};

export const default_values = {
  endpoint: "https://api.anthropic.com/v1/messages",
  custom_header: `{
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
    "x-api-key":  "{{api_key}}"
}`,
  custom_body: `{
    model: "{{model}}",
    stream: {{stream}},
    max_tokens: {{max_tokens}},
    messages: {{stringify messages}}
}`,
  path_to_choices: "content",
  path_to_message_content: "text",
  path_to_error_message: "error.message",
  CORSBypass: true,
  streamable: false,
  model: "claude-2.1"
};

export type CustomConfig = Record<keyof typeof default_values, string>;

export default class AnthropicLegacyProvider
  extends CustomProvider
  implements LLMProviderInterface {
  static provider = "Custom";
  static id = "Anthropic Legacy (Custom)" as const;
  static slug = "anthropicLegacy" as const;
  static displayName: string = "Anthropic Legacy";

  streamable = true;

  provider = AnthropicLegacyProvider.provider;
  id = AnthropicLegacyProvider.id;
  originalId = AnthropicLegacyProvider.id;

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[
      props.self.id || "default"
    ] ??= {
      ...default_values
    });

    const vars = useMemo(() => {
      return getHBValues(
        `${config?.custom_header} 
        ${config?.custom_body}`
      ).filter((d) => !globalVars[d]);
    }, [global.trg]);

    return (
      <>
        <SettingItem
          name="Endpoint"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.endpoint || default_values.endpoint}
            placeholder="Enter your API endpoint"
            setValue={async (value) => {
              config.endpoint = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        {vars.map((v: string) => (
          <SettingItem
            key={v}
            name={v}
            register={props.register}
            sectionId={props.sectionId}
          >
            <Input
              value={config[v]}
              placeholder={`Enter your ${v}`}
              type={v.toLowerCase().contains("key") ? "password" : "text"}
              setValue={async (value) => {
                config[v] = value;
                global.triggerReload();
                if (v.toLowerCase().contains("key"))
                  global.plugin.encryptAllKeys();
                // TODO: it could use a debounce here
                await global.plugin.saveSettings();
              }}
            />
          </SettingItem>
        ))}

        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://docs.anthropic.com/claude/reference/getting-started-with-the-api">
            <SettingItem
              name="Getting started"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://docs.anthropic.com/claude/reference/selecting-a-model">
            <SettingItem
              name="Available models"
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

import debug from "debug";
import React, { useEffect, useMemo } from "react";
import LLMProviderInterface from "../interface";
import useGlobal from "#/ui/context/global";
import { getHBValues } from "#/utils/barhandles";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import CustomProvider, { default_values as baseDefaultValues } from "./base";
import { IconExternalLink } from "@tabler/icons-react";

const globalVars: Record<string, boolean> = {
  n: true,
  temperature: true,
  timeout: true,
  stream: true,
  messages: true,
  max_tokens: true,
  stop: true,
};

const untangableVars = [
  "custom_header",
  "custom_body",
  "sanatization_response",
  "streamable",
  "CORSBypass",
];

export const default_values = {
  ...baseDefaultValues,
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

  sanatization_response: `async (data, res)=>{
    // catch error
    if (res.status >= 300) {
      const err = data?.error?.message || JSON.stringify(data);
      throw err;
    }
  
    // get choices
    const choices = data.content.map(c=> ({role:"assistant", content:c.text}));
  
    // the return object should be in the format of 
    // { content: string }[] 
    // if there's only one response, put it in the array of choices.
    return choices;
  }`,
  CORSBypass: true,
  streamable: false,
  model: "claude-2.1",
};

export type CustomConfig = Record<keyof typeof default_values, string>;

export default class AnthropicLegacyProvider
  extends CustomProvider
  implements LLMProviderInterface
{
  static provider = "Custom";
  static id = "Anthropic Legacy (Custom)" as const;
  static slug = "anthropicLegacy" as const;
  static displayName: string = "Anthropic Legacy";

  streamable = true;

  provider = AnthropicLegacyProvider.provider;
  id = AnthropicLegacyProvider.id;
  originalId = AnthropicLegacyProvider.id;
  default_values = default_values;

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[
      props.self.id || "default"
    ] ??= {
      ...default_values,
    });

    useEffect(() => {
      untangableVars.forEach((v) => {
        config[v] = default_values[v as keyof typeof default_values];
      });
      global.triggerReload();
      global.plugin.saveSettings();
    }, []);

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

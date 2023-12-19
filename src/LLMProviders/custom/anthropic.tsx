
import debug from "debug";
import React, { useMemo } from "react";
import LLMProviderInterface from "../interface";
import useGlobal from "#/ui/context/global";
import { getHBValues } from "#/utils/barhandles";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import CustomProvider from "./base";

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

const testMessages = [
  {
    role: "user",
    content: "test",
  },
  {
    role: "assistant",
    content: `test2
test3

test4`,
  },
];

const default_values = {
  endpoint: "https://api.anthropic.com/v1/complete",
  handlebars_headers_in: `{
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
    "x-api-key":  "{{api_key}}"
}`,
  handlebars_body_in: `{
    "model": "{{model}}",
    "stream": {{stream}},
    "max_tokens_to_sample": {{max_tokens}},
    "prompt": "Human:{{escp2 messages.[0].content}}\\n\\nAssistant:"
 }`,
  path_to_choices: "completion",
  path_to_message_content: "",
  path_to_error_message: "",
  CORSBypass: true,
  streamable: false,
  model: "claude-2"
};

export type CustomConfig = Record<keyof typeof default_values, string>;

const id = "Anthropic Legacy (Custom)" as const;
export default class AnthropicLegacyProvider
  extends CustomProvider
  implements LLMProviderInterface {
  streamable = true;
  id = id;
  static slug = "anthropicLegacy" as const;
  static id = id;
  provider = "Custom";
  static provider = "Custom";
  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[
      props.self.id || "default"
    ] ??= {
      ...default_values
    });

    const vars = useMemo(() => {
      return getHBValues(
        `${config?.handlebars_headers_in} 
        ${config?.handlebars_body_in}`
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
      </>
    );
  }
}

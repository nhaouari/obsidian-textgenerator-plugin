import { cleanConfig } from "../../utils";
import debug from "debug";
import React, { useEffect, useMemo, useState } from "react";
import LLMProviderInterface from "../interface";
import useGlobal from "#/ui/context/global";
import { getHBValues } from "#/utils/barhandles";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import SettingsTextarea from "#/ui/settings/components/textarea";
import { Handlebars } from "../../helpers/handlebars-helpers";
import clsx from "clsx";
import CustomProvider, { default_values as baseDefaultValues } from "./base";
import JSON5 from "json5";
import { Platform } from "obsidian";
import { useDebounceCallback } from "usehooks-ts";
import { AI_MODELS } from "#/constants";
import Dropdown from "#/ui/settings/components/dropdown";

const logger = debug("textgenerator:CustomProvider");

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

export const default_values = {
  ...baseDefaultValues,
  endpoint: "https://api.openai.com/v1/chat/completions",
  stream: false,
  model: "gpt-3.5-turbo-16k",

  // this for the example
  temperature: 0.7,
  frequency_penalty: 0,
  presence_penalty: 0.5,
  top_p: 1,
  max_tokens: 400,
  n: 1,
};

export type CustomConfig = Record<keyof typeof default_values, string>;

export default class DefaultCustomProvider
  extends CustomProvider
  implements LLMProviderInterface {
  streamable = true;
  static provider = "Custom";
  static id = "Default (Custom)" as const;
  static slug = "custom" as const;
  static displayName = "Custom";

  provider = DefaultCustomProvider.provider;
  id = DefaultCustomProvider.id;
  originalId = DefaultCustomProvider.id;

  default_values = default_values;
  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const [bodyValidityError, setBodyValidityError] = useState("");
    const [headerValidityError, setHeaderValidityError] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const config = (global.plugin.settings.LLMProviderOptions[
      props.self.id || "default"
    ] ??= {
      ...default_values,
    });

    // Debounced handlers for the header/body textareas — these also run
    // Handlebars.compile() for a live preview, which is expensive per keystroke.
    const debouncedHeaderChange = useDebounceCallback(async (value: string) => {
      config.custom_header = value;

      const compiled = await Handlebars.compile(
        config.custom_header || default_values.custom_header
      )({
        ...global.plugin.settings,
        ...cleanConfig(default_values),
        n: 1,
        messages: testMessages,
      });

      console.log("------ PREVIEW OF HEADER ------\n", compiled);
      setHeaderValidityError("");
      try {
        console.log(
          "------ PREVIEW OF HEADER COMPILED ------\n",
          JSON5.parse(compiled)
        );
      } catch (err: any) {
        setHeaderValidityError(err.message || err);
        console.warn(err);
      }

      global.triggerReload();
      await global.plugin.saveSettings();
    }, 500);

    const debouncedBodyChange = useDebounceCallback(async (value: string) => {
      config.custom_body = value;

      const compiled = await Handlebars.compile(
        config.custom_body || default_values.custom_body
      )({
        ...global.plugin.settings,
        ...cleanConfig(config),
        n: 1,
        messages: testMessages,
      });

      console.log("------ PREVIEW OF BODY ------\n", compiled);
      setBodyValidityError("");
      try {
        console.log(
          "------ PREVIEW OF BODY COMPILED ------\n",
          JSON5.parse(compiled)
        );
      } catch (err: any) {
        setBodyValidityError(err.message || err);
        console.warn(
          "this error could be cause of one of the variables being undefined which breaks the json5 format, check the preview above",
          err
        );
      }

      global.triggerReload();
      await global.plugin.saveSettings();
    }, 500);

    // delete any global variables that would interfer with global context
    useEffect(() => {
      for (const c in globalVars) {
        delete config[c];
      }
    }, []);

    const vars = useMemo(() => {
      return getHBValues(
        `${config?.custom_header} 
        ${config?.custom_body}`
      ).filter((d) => !globalVars[d]);
    }, [global.trg]);

    const limitedExperiance = config.CORSBypass && !Platform.isDesktop;

    const isStreamable = config.streamable && !limitedExperiance;

    const modelKey = (config.model || "").toLowerCase();
    const autoDetectedThinking = !!(AI_MODELS as any)[modelKey]?.isThinking;
    const isThinking = config.isThinkingModel !== undefined
      ? config.isThinkingModel
      : autoDetectedThinking;

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
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        {!!vars.includes("api_key") && (
          <SettingItem
            name="API Key"
            register={props.register}
            sectionId={props.sectionId}
          >
            <Input
              value={config.api_key}
              type="password"
              placeholder="Enter your API endpoint"
              setValue={async (value) => {
                config.api_key = value;
                global.plugin.encryptAllKeys();
                global.triggerReload();
                await global.plugin.saveSettings();
              }}
            />
          </SettingItem>
        )}

        {vars.map((v: string) =>
          v == "api_key" ? null : (
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
          )
        )}


        <SettingItem
          name="Thinking model"
          description={
            autoDetectedThinking
              ? "Auto-detected from model name — temperature will be omitted"
              : "Enable for reasoning/thinking models (temperature will be omitted)"
          }
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="checkbox"
            value={isThinking ? "true" : "false"}
            setValue={async (value) => {
              const checked = value === "true";
              config.isThinkingModel = checked === autoDetectedThinking
                ? undefined
                : checked;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        {isThinking && (
          <SettingItem
            name="Reasoning Effort"
            description="Controls how much effort the model spends on reasoning"
            register={props.register}
            sectionId={props.sectionId}
          >
            <Dropdown
              value={config.reasoningEffort || "medium"}
              setValue={async (value) => {
                config.reasoningEffort = value;
                global.triggerReload();
                await global.plugin.saveSettings();
              }}
              values={["low", "medium", "high"]}
            />
          </SettingItem>
        )}

        <SettingItem
          name="Advance mode"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="checkbox"
            value={showAdvanced ? "true" : "false"}
            placeholder="Is it Streamable"
            setValue={async (value) => {
              setShowAdvanced(value == "true");
            }}
          />
        </SettingItem>
        {showAdvanced && (
          <>
            <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
              <div className="plug-tg-font-bold">Headers:</div>
              <div className="plug-tg-text-[8px]">
                Check console in the devtools to see a preview of the body with
                example values
              </div>

              <SettingsTextarea
                placeholder="Headers"
                className="plug-tg-resize-none"
                value={config.custom_header || default_values.custom_header}
                setValue={debouncedHeaderChange}
                rows={5}
              />
              <div className="plug-tg-text-red-300">{headerValidityError}</div>
            </div>

            <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
              <div className="plug-tg-font-bold">Body:</div>
              <div className="plug-tg-text-[8px]">
                Check console in the devtools to see a preview of the body with
                example values
              </div>
              <SettingsTextarea
                placeholder="Body as JSON5 content"
                className="plug-tg-resize-none"
                value={config.custom_body || default_values.custom_body}
                setValue={debouncedBodyChange}
                rows={20}
              />
              <div className="plug-tg-text-red-300">{bodyValidityError}</div>
            </div>


            <div className="plug-tg-w-full plug-tg-pb-8"></div>

            <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
              <div className="plug-tg-font-bold">Response Sanatization:</div>
              <SettingsTextarea
                value={
                  config.sanatization_response ||
                  default_values.sanatization_response
                }
                setValue={async (val) => {
                  config.sanatization_response = val;
                  global.triggerReload();
                  await global.plugin.saveSettings();
                }}
                rows={20}
              />
            </div>
            <SettingItem
              name="Streamable"
              description={
                limitedExperiance
                  ? "Disable CORS Bypass to be able to use this feature"
                  : "If enabled, means this API is streamable"
              }
              register={props.register}
              sectionId={props.sectionId}
              className={clsx({
                "plug-tg-pointer-events-none plug-tg-cursor-not-allowed plug-tg-opacity-60":
                  limitedExperiance,
              })}
            >
              <Input
                type="checkbox"
                value={
                  !limitedExperiance && config.streamable ? "true" : "false"
                }
                placeholder="Is it Streamable"
                setValue={async (value) => {
                  config.streamable = value == "true";
                  global.triggerReload();
                  // TODO: it could use a debounce here
                  await global.plugin.saveSettings();
                }}
              />
            </SettingItem>
            <SettingItem
              name="CORS Bypass"
              description="enable this only if you get blocked by CORS, in mobile this will result in failure in some functions"
              register={props.register}
              sectionId={props.sectionId}
            >
              <Input
                type="checkbox"
                value={"" + config.CORSBypass}
                setValue={async (val) => {
                  config.CORSBypass = val == "true";
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
              />
            </SettingItem>
            {isStreamable && (
              <>
                <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
                  <div className="plug-tg-font-bold">Stream Sanatization:</div>
                  <SettingsTextarea
                    value={
                      config.sanatization_streaming ||
                      default_values.sanatization_streaming
                    }
                    setValue={async (val) => {
                      config.sanatization_streaming = val;
                      global.triggerReload();
                      await global.plugin.saveSettings();
                    }}
                    rows={20}
                  />
                </div>
              </>
            )}
          </>
        )}
      </>
    );
  }
}

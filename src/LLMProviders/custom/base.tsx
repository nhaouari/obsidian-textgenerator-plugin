import BaseProvider, { cleanConfig } from "../base";
import { AsyncReturnType, Message } from "../../types";
import debug from "debug";
import React, { useMemo } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import useGlobal from "#/ui/context/global";
import { getHBValues } from "#/utils/barhandles";
import SettingItem from "#/ui/settings/components/item";
import Input from "#/ui/settings/components/input";
import { RequestUrlParam, requestUrl } from "obsidian";
import get from "lodash.get";
import Handlebars from "handlebars";
import clsx from "clsx";

const logger = debug("textgenerator:CustomProvider");

Handlebars.registerHelper("stringify", function (context) {
  return '"' + JSON.stringify(context) + '"';
});

Handlebars.registerHelper("escp", function (context) {
  return ("" + context).replaceAll("\n", "\\n").replaceAll("\n", "\\n");
});

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
  endpoint: "https://api.openai.com/v1/chat/completions",
  handlebars_headers_in: `{
      "Content-Type": "application/json",
      "authorization": "Bearer {{api_key}}"
}`,
  handlebars_body_in: `{
    "model": "{{model}}",
    "temperature": {{temperature}},
    "top_p": {{top_p}},
    "frequency_penalty": {{frequency_penalty}},
    "presence_penalty": {{presence_penalty}},
    "max_tokens": {{max_tokens}},
    "n": {{n}},
    "stream": {{stream}},
	"stop": "{{stop}}",
    "messages": [
      {{#each messages}}{{#if @index}},{{/if}}
      {
        "role": "{{role}}",
        "content": "{{escp content}}"
      }{{/each}}
    ]
  }`,
  path_to_choices: "choices",
  path_to_message_content: "message.content",
  path_to_error_message: "error.message",
  sanatization_streaming: `(chunk) => {
    let resultText = "";
    const lines = chunk.split("\\ndata: ");
  
    const parsedLines = lines
      .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
      .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
      .map((line) => JSON.parse(line)); // Parse the JSON string
  
    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      const { content } = delta;
      // Update the UI with the new content
      if (content) {
        resultText += content;
      }
    }
    return resultText;
  }`,
};

export type CustomConfig = Record<keyof typeof default_values, string>;

const id = "Default (Custom)" as const;
export default class CustomProvider
  extends BaseProvider
  implements LLMProviderInterface
{
  streamable = true;
  id = id;
  static id = id;
  async request(
    params: RequestUrlParam & {
      signal?: AbortSignal;
      stream?: boolean;
      onToken?: (token: string, first: boolean) => Promise<void>;
      path_to_choices?: string;
      path_to_error_message?: string;
      sanatization_streaming: string;
      CORSBypass?: boolean;
    }
  ) {
    const requestOptions: RequestInit = {
      method: params.method || "POST",
      headers: params.headers,
      body: ["GET", "HEAD"].contains(params.method?.toUpperCase() || "_")
        ? undefined
        : params.body,
      redirect: "follow",
      signal: params.signal,
    };

    logger({ params, requestOptions });

    const k = (
      params.CORSBypass
        ? await requestUrl({
            url: params.url,
            body:
              typeof requestOptions.body == "string"
                ? requestOptions.body
                : undefined,
            headers:
              typeof requestOptions.headers == "object"
                ? (requestOptions.headers as any)
                : undefined,

            method: requestOptions.method,
            throw: true,
          })
        : await fetch(params.url, requestOptions)
    ) as AsyncReturnType<typeof fetch>;

    if (!params.CORSBypass && params.stream) {
      if (!k.body) return;
      const reader = k.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let isFirst = true;
      let text = "";

      while (!done) {
        if (params.signal?.aborted) {
          console.log("aborted");
          done = true;
          break;
        }

        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const decodedVal = decoder.decode(value, { stream: true });

        const chunkValue = (0, eval)(
          params.sanatization_streaming || default_values.sanatization_streaming
        )(decodedVal);

        // try {
        // chunkValue = get(
        //   chunkValue,
        //   params.path_to_content_streaming
        // );
        // } catch (err: any) {
        //   console.warn(err);
        // }

        text += chunkValue || "";
        await params.onToken?.(chunkValue, isFirst);
        isFirst = false;
      }

      return text as string;
    } else {
      try {
        const resJson = params.CORSBypass ? k.json : await k.json();

        if (k.status >= 300) {
          console.log(resJson);
          const err = get(
            resJson,
            params.path_to_error_message || default_values.path_to_error_message
          );
          console.error(err);
          throw err || JSON.stringify(resJson);
        }

        return (
          (get(
            resJson,
            params.path_to_choices || default_values.path_to_choices
          ) as object[]) || resJson
        );
      } catch {
        return params.CORSBypass ? k.text : await k.text();
      }
    }
  }

  async generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (token: string, first: boolean) => void,
    customConfig?: CustomConfig
  ): Promise<string> {
    return new Promise(async (s, r) => {
      try {
        logger("generate", reqParams);

        let first = true;
        let allText = "";

        const config = (this.plugin.settings.LLMProviderOptions[
          this.id || id
        ] ??= {});

        let resultContent = "";

        const handlebarData = {
          ...this.plugin.settings,
          ...cleanConfig(config),
          ...cleanConfig(reqParams.otherOptions),
          ...cleanConfig(reqParams),
          ...customConfig,
          // if the model is streamable
          stream:
            (reqParams.stream &&
              this.streamable &&
              config.streamable &&
              !config.CORSBypass) ||
            false,
          n: 1,
          messages,
        };
        console.log(
          "url",
          Handlebars.compile(handlebarData.endpoint || default_values.endpoint)(
            handlebarData
          )
        );
        const res = await this.request({
          method: handlebarData.method,
          url: Handlebars.compile(
            handlebarData.endpoint || default_values.endpoint
          )(handlebarData),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON.parse(
            "" +
              Handlebars.compile(
                handlebarData.handlebars_headers_in ||
                  default_values.handlebars_headers_in
              )(handlebarData)
          ) as any,

          body: JSON.stringify(
            JSON.parse(
              "" +
                Handlebars.compile(
                  handlebarData.handlebars_body_in ||
                    default_values.handlebars_body_in
                )(handlebarData)
            )
          ) as any,

          path_to_choices:
            handlebarData.path_to_choices || default_values.path_to_choices,
          sanatization_streaming:
            handlebarData.sanatization_streaming ||
            default_values.sanatization_streaming,
          CORSBypass: handlebarData.CORSBypass,
          async onToken(token: string) {
            onToken?.(token, first);
            allText += token;
            first = false;
          },
        });

        if (handlebarData.stream) resultContent = res as string;
        else {
          const choices = res as any;
          resultContent =
            (get(
              choices?.[0] || choices,
              handlebarData.path_to_message_content ||
                default_values.path_to_message_content
            ) as string) || choices;
        }

        logger("generate end", {
          resultContent,
        });

        s(resultContent);
      } catch (errorRequest: any) {
        logger("generate error", errorRequest);
        return r(errorRequest);
      }
    });
  }

  async generateMultiple(
    messages: Message[],
    reqParams: Partial<LLMConfig>,
    customConfig?: CustomConfig
  ): Promise<string[]> {
    return new Promise(async (s, r) => {
      try {
        logger("generateMultiple", reqParams);

        const config = (this.plugin.settings.LLMProviderOptions[
          this.id || id
        ] ??= {});

        const handlebarData = {
          ...this.plugin.settings,
          ...cleanConfig(config),
          ...cleanConfig(reqParams.otherOptions),
          ...cleanConfig(reqParams),
          ...customConfig,
          // if the model is streamable
          stream: false,
          messages,
        };

        const res = await this.request({
          method: handlebarData.method,
          url: Handlebars.compile(config.endpoint || default_values.endpoint)(
            handlebarData
          ),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON.parse(
            Handlebars.compile(
              handlebarData.handlebars_headers_in ||
                default_values.handlebars_headers_in
            )(handlebarData)
          ) as any,

          body: JSON.stringify(
            this.cleanConfig(
              JSON.parse(
                Handlebars.compile(
                  handlebarData.handlebars_body_in ||
                    default_values.handlebars_body_in
                )(handlebarData)
              )
            )
          ) as any,

          path_to_choices:
            handlebarData.path_to_choices || default_values.path_to_choices,
          sanatization_streaming:
            handlebarData.sanatization_streaming ||
            default_values.sanatization_streaming,
        });

        const choices = res
          ? (res as object[])?.map((o) =>
              get(
                o,
                handlebarData.path_to_message_content ||
                  default_values.path_to_message_content
              )
            )
          : get(
              res,
              handlebarData.path_to_message_content ||
                default_values.path_to_message_content
            );

        logger("generateMultiple end", {
          choices,
        });

        if (!handlebarData.stream) {
          s(choices);
        }
      } catch (errorRequest: any) {
        logger("generateMultiple error", errorRequest);
        return r(errorRequest);
      }
    });
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[
      props.self.id || "default"
    ] ??= {
      ...default_values,
      model: "gpt-3.5-turbo-16k",
      presence_penalty: 0.5,
      top_p: 1,
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

        <div className="flex flex-col gap-1">
          <div className="font-bold">Headers:</div>
          <textarea
            placeholder="Headers"
            className="resize-none"
            defaultValue={
              config.handlebars_headers_in ||
              default_values.handlebars_headers_in
            }
            onChange={async (e) => {
              config.handlebars_headers_in = e.target.value;

              const compiled = Handlebars.compile(
                config.handlebars_headers_in ||
                  default_values.handlebars_headers_in
              )({
                ...global.plugin.settings,
                ...cleanConfig(config),
                n: 1,
                messages: testMessages,
              });

              console.log(compiled);
              try {
                console.log(JSON.parse(compiled));
              } catch (err: any) {
                console.warn(err);
              }

              global.triggerReload();
              await global.plugin.saveSettings();
            }}
            spellCheck={false}
            rows={5}
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="font-bold">Body:</div>
          <textarea
            placeholder="Textarea will autosize to fit the content"
            className="resize-none"
            defaultValue={
              config.handlebars_body_in || default_values.handlebars_body_in
            }
            onChange={async (e) => {
              config.handlebars_body_in = e.target.value;

              const compiled = Handlebars.compile(
                config.handlebars_body_in || default_values.handlebars_body_in
              )({
                ...global.plugin.settings,
                ...cleanConfig(config),
                n: 1,
                messages: testMessages,
              });

              console.log(compiled);
              try {
                console.log(JSON.parse(compiled));
              } catch (err: any) {
                console.warn(err);
              }

              global.triggerReload();
              await global.plugin.saveSettings();
            }}
            spellCheck={false}
            rows={20}
          />
        </div>

        <div className="opacity-70">Variables</div>
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

        <div className="w-full pb-8"></div>

        <SettingItem
          name="Path to choices(Array) from response"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.path_to_choices || default_values.path_to_choices}
            placeholder="Enter your path to choices"
            setValue={async (value) => {
              config.path_to_choices = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <div className="opacity-70">
          Path to the choices Array that has the messages
        </div>
        <SettingItem
          name="Path to message content(String) from choice object"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={
              config.path_to_message_content ||
              default_values.path_to_message_content
            }
            placeholder="Enter your path to message content"
            setValue={async (value) => {
              config.path_to_message_content = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <div className="opacity-70">
          Path from one of the choices to the content(if left empty it will
          assume that the choices is an array of strings)
        </div>

        <SettingItem
          name="Path to error message from body"
          description="incase of an error (optional)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.path_to_error_message}
            placeholder={default_values.path_to_error_message}
            setValue={async (value) => {
              config.path_to_error_message = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <div className="opacity-70">
          Path from one of the choices to the content(if left empty it will
          assume that the choices is an array of strings)
        </div>

        <SettingItem
          name="CORS Bypass"
          description="enable this only if you get blocked by CORS, this will result in failure in some functions"
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
        <SettingItem
          name="Streamable"
          description={
            config.CORSBypass
              ? "Disable CORS Bypass to be able to use this feature"
              : "If enabled, means this API is streamable"
          }
          register={props.register}
          sectionId={props.sectionId}
          className={clsx({
            "cursor-not-allowed pointer-events-none opacity-60":
              config.CORSBypass,
          })}
        >
          <Input
            type="checkbox"
            value={!config.CORSBypass && config.streamable ? "true" : "false"}
            placeholder="Is it Streamable"
            setValue={async (value) => {
              config.streamable = value == "true";
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        {!config.CORSBypass && config.streamable && (
          <>
            <div className="flex flex-col gap-1">
              <div className="font-bold">Sanatization(Streaming) function:</div>
              <textarea
                placeholder="Textarea will autosize to fit the content"
                value={
                  config.sanatization_streaming ||
                  default_values.sanatization_streaming
                }
                onChange={async (e) => {
                  config.sanatization_streaming = e.target.value;
                  global.triggerReload();
                  await global.plugin.saveSettings();
                }}
                spellCheck={false}
                rows={20}
              />
            </div>
          </>
        )}
      </>
    );
  }
}

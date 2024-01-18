import BaseProvider from "../base";
import { cleanConfig } from "../../utils";
import { AsyncReturnType, Message } from "../../types";
import debug from "debug";
import React, { useMemo } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { RequestUrlParam, requestUrl } from "obsidian";
import get from "lodash.get";
import { Handlebars } from "../../helpers/handlebars-helpers";
import JSON5 from "json5";

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
      .map((line) => JSON5.parse(line)); // Parse the JSON string
  
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

const id = "custom"
export default class CustomProvider
  extends BaseProvider
  implements LLMProviderInterface {
  streamable = true;
  provider = "Custom";
  static provider = "Custom";
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

    const k = (
      params.CORSBypass
        ? await requestUrl({
          url: params.url,
          method: requestOptions.method,
          body:
            typeof requestOptions.body == "string"
              ? requestOptions.body
              : requestOptions.body
                ? JSON.stringify(requestOptions.body)
                : undefined,
          headers:
            typeof requestOptions.headers == "object"
              ? (requestOptions.headers as any)
              : requestOptions.headers
                ? JSON5.parse(requestOptions.headers)
                : undefined,

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
      const resText = params.CORSBypass ? k.text : await k.text();
      let resJson = {};

      try {
        resJson = JSON5.parse(resText as any);
      } catch (err: any) {
        resJson = resText;
      }

      if (k.status >= 300) {
        const err = get(
          resJson,
          params.path_to_error_message || default_values.path_to_error_message
        );
        console.error(err, { resJson });
        throw err || JSON.stringify(resJson);
      }

      return (
        (get(
          resJson,
          params.path_to_choices || default_values.path_to_choices
        ) as object[]) || resJson
      );
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
          ...cleanConfig(customConfig),
          keys: this.plugin.getApiKeys(),
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

        const res = await this.request({
          method: handlebarData.method,
          url: await Handlebars.compile(
            handlebarData.endpoint || default_values.endpoint
          )(handlebarData),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON5.parse(
            "" +
            (await Handlebars.compile(
              handlebarData.handlebars_headers_in ||
              default_values.handlebars_headers_in
            )(handlebarData))
          ) as any,

          body: JSON.stringify(
            JSON5.parse(
              "" +
              (await Handlebars.compile(
                handlebarData.handlebars_body_in ||
                default_values.handlebars_body_in
              )(handlebarData))
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
          url: await Handlebars.compile(
            config.endpoint || default_values.endpoint
          )(handlebarData),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON5.parse(
            await Handlebars.compile(
              handlebarData.handlebars_headers_in ||
              default_values.handlebars_headers_in
            )(handlebarData)
          ) as any,

          body: JSON.stringify(
            this.cleanConfig(
              JSON5.parse(
                await Handlebars.compile(
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
    return <>Default unuseable</>
  }
}

import React from "react";
import debug from "debug";
import JSON5 from "json5";
import get from "lodash.get";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { Handlebars } from "../../helpers/handlebars-helpers";
import BaseProvider from "../base";
import { AsyncReturnType, cleanConfig } from "../utils";
import { requestWithoutCORS, requestWithoutCORSParam, Message } from "../refs";

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
  endpoint: "https://api.openai.com/v1/chat/completions",
  custom_header: `{
    "Content-Type": "application/json",
    authorization: "Bearer {{api_key}}"
}`,
  custom_body: `{
    model: "{{model}}",
    temperature: {{temperature}},
    top_p: {{top_p}},
    frequency_penalty: {{frequency_penalty}},
    presence_penalty: {{presence_penalty}},
    max_tokens: {{max_tokens}},
    n: {{n}},
    stream: {{stream}},
    stop: "{{stop}}",
    messages: {{stringify messages}}
}`,
  frequency_penalty: 0,
  model: "gpt-3.5-turbo-16k",
  presence_penalty: 0.5,
  top_p: 1,
  max_tokens: 400,
  n: 1,
  stream: false,
  temperature: 0.7,

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
  sanatization_response: `async (data, res)=>{
  // catch error
  if (res.status >= 300) {
    const err = data?.error?.message || JSON.stringify(data);
    throw err;
  }

  // get choices
  const choices = data.choices.map(c=> c.message);

  // the return object should be in the format of 
  // { content: string }[] 
  // if there's only one response, put it in the array of choices.
  return choices;
}`,
};

export type CustomConfig = Record<keyof typeof default_values, string>;

export default class CustomProvider
  extends BaseProvider
  implements LLMProviderInterface {

  static provider = "Custom";
  static id = "Default (Custom)";
  static displayName: string = "Custom";

  streamable = true;

  provider = CustomProvider.provider;
  id = CustomProvider.id;
  originalId = CustomProvider.id;

  default_values = default_values;
  async request(
    params: requestWithoutCORSParam & {
      signal?: AbortSignal;
      stream?: boolean;
      onToken?: (token: string, first: boolean) => Promise<void>;
      sanatization_streaming: string;
      sanatization_response: string;
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

    console.log("request options", {
      url: params.url,
      method: requestOptions.method,
      body:
        typeof requestOptions.body == "string"
          ? JSON.parse(requestOptions.body)
          : requestOptions.body
            ? requestOptions.body
            : undefined,
      headers:
        typeof requestOptions.headers == "object"
          ? (requestOptions.headers as any)
          : requestOptions.headers
            ? JSON5.parse(requestOptions.headers)
            : undefined,

    })
    const k = (
      params.CORSBypass
        ? await requestWithoutCORS({
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

        const chunkValue = await (0, eval)(
          params.sanatization_streaming || this.default_values.sanatization_streaming
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

      return await (0, eval)(
        params.sanatization_response || this.default_values.sanatization_response
      )(resJson, k)
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
          this.id
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
            handlebarData.endpoint || this.default_values.endpoint
          )(handlebarData),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON5.parse(
            "" +
            (await Handlebars.compile(
              handlebarData.custom_header ||
              this.default_values.custom_header
            )(handlebarData))
          ) as any,

          body: JSON.stringify(
            JSON5.parse(
              "" +
              (await Handlebars.compile(
                handlebarData.custom_body ||
                this.default_values.custom_body
              )(handlebarData))
            )
          ) as any,

          sanatization_streaming:
            handlebarData.sanatization_streaming || this.default_values.sanatization_streaming,
          sanatization_response:
            handlebarData.sanatization_response || this.default_values.sanatization_response,
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
              "content"
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
          this.id
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
            config.endpoint || this.default_values.endpoint
          )(handlebarData),
          signal: handlebarData.requestParams?.signal || undefined,
          stream: handlebarData.stream,
          headers: JSON5.parse(
            await Handlebars.compile(
              handlebarData.custom_header ||
              this.default_values.custom_header
            )(handlebarData)
          ) as any,

          body: JSON.stringify(
            this.cleanConfig(
              JSON5.parse(
                await Handlebars.compile(
                  handlebarData.custom_body ||
                  this.default_values.custom_body
                )(handlebarData)
              )
            )
          ) as any,

          sanatization_response: handlebarData.sanatization_response,
          sanatization_streaming:
            handlebarData.sanatization_streaming ||
            this.default_values.sanatization_streaming,
        });

        const choices = res
          ? (res as object[])?.map((o) =>
            get(
              o,
              "content"
            )
          )
          : get(
            res,
            "content"
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

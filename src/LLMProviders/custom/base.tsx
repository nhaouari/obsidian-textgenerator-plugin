import BaseProvider from "../base";
import { cleanConfig } from "../../utils";
import { AsyncReturnType, Message } from "../../types";
import debug from "debug";
import React, { useMemo } from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import { default_values as OPENAI_default_values } from "./custom";
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


const default_values = OPENAI_default_values;

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

        const chunkValue = await (0, eval)(
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

      return await (0, eval)(
        params.sanatization_response || default_values.sanatization_response
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
              handlebarData.custom_header ||
              default_values.custom_header
            )(handlebarData))
          ) as any,

          body: JSON.stringify(
            JSON5.parse(
              "" +
              (await Handlebars.compile(
                handlebarData.custom_body ||
                default_values.custom_body
              )(handlebarData))
            )
          ) as any,

          sanatization_streaming:
            handlebarData.sanatization_streaming || default_values.sanatization_streaming,
          sanatization_response:
            handlebarData.sanatization_response || default_values.sanatization_response,
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
              handlebarData.custom_header ||
              default_values.custom_header
            )(handlebarData)
          ) as any,

          body: JSON.stringify(
            this.cleanConfig(
              JSON5.parse(
                await Handlebars.compile(
                  handlebarData.custom_body ||
                  default_values.custom_body
                )(handlebarData)
              )
            )
          ) as any,

          sanatization_response: handlebarData.sanatization_response,
          sanatization_streaming:
            handlebarData.sanatization_streaming ||
            default_values.sanatization_streaming,
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

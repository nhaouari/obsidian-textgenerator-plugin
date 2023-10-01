import React from "react";
import TextGeneratorPlugin from "src/main";
import { Message } from "src/types";
import LLMProviderInterface, { LLMConfig } from "./interface";
import { ContextTemplate } from "#/context-manager";
import { LLMChain } from "langchain/chains";
import { processPromisesSetteledBatch, promiseForceFullfil } from "#/utils";
import safeAwait from "safe-await";

export default class ProviderBase implements LLMProviderInterface {
  id = "default";
  provider = "default";
  plugin: TextGeneratorPlugin;
  constructor(props: { plugin: TextGeneratorPlugin }) {
    this.plugin = props.plugin;
  }

  streamable?: boolean | undefined;
  mobileSupport?: boolean | undefined;

  async load() {}

  async generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>,
    customConfig?: any
  ): Promise<string> {
    return "";
  }

  async generateMultiple(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): Promise<string[]> {
    return [];
  }

  cleanConfig<T>(options: T): T {
    const cleanedOptions: any = {}; // Create a new object to store the cleaned properties

    for (const key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        const value = options[key];

        // Check if the value is not an empty string
        if (
          (typeof value != "undefined" && typeof value !== "string") ||
          value !== ""
        ) {
          cleanedOptions[key] = value; // Copy non-empty properties to the cleaned object
        }
      }
    }

    return cleanedOptions;
  }

  async convertToChain(
    templates: ContextTemplate,
    reqParams: Partial<LLMConfig>,
    customConfig?: any
  ): Promise<any> {
    throw new Error("Convert to chain is not supported outside of langchain");
  }

  async generateBatch(
    messages: Message[][],
    reqParams: Partial<LLMConfig>,
    customConfig?: any,
    onOneFinishs?: ((content: string, index: number) => void) | undefined
  ): Promise<string[]> {
    const k = await processPromisesSetteledBatch(
      messages.map(async (msgs, i) => {
        const [err, res] = await safeAwait(
          this.generate(msgs, reqParams, undefined, customConfig)
        );

        const content = err ? "fAILED:" + err.message : res;

        await onOneFinishs?.(content, i);

        if (err) throw err;

        return content;
      }),
      customConfig.nParallelRequests || 3
    );

    return k.map(promiseForceFullfil);
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    return <></>;
  }

  getSettings() {
    return this.plugin.settings.LLMProviderOptions[this.id] as Record<
      string,
      any
    >;
  }
  calcTokens(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): ReturnType<LLMProviderInterface["calcTokens"]> {
    throw new Error("calcTokens Method not implemented." + this.id);
  }
  calcPrice(tokens: number, reqParams: Partial<LLMConfig>): Promise<number> {
    throw new Error("calcPrice Method not implemented." + this.id);
  }
}

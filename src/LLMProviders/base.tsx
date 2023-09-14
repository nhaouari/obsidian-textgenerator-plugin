import React from "react";
import TextGeneratorPlugin from "src/main";
import { Message } from "src/types";
import LLMProviderInterface, { LLMConfig } from "./interface";

export default class ProviderBase implements LLMProviderInterface {
  id = "default";
  plugin: TextGeneratorPlugin;
  constructor(props: { plugin: TextGeneratorPlugin }) {
    this.plugin = props.plugin;
  }

  streamable?: boolean | undefined;

  async generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>
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
        if (typeof value !== "string" || value !== "") {
          cleanedOptions[key] = value; // Copy non-empty properties to the cleaned object
        }
      }
    }

    return cleanedOptions;
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

export function cleanConfig<T>(options: T): T {
  const cleanedOptions: any = {}; // Create a new object to store the cleaned properties

  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      const value = options[key];

      // Check if the value is not an empty string
      if (typeof value !== "string" || value !== "") {
        cleanedOptions[key] = value; // Copy non-empty properties to the cleaned object
      }
    }
  }

  return cleanedOptions;
}

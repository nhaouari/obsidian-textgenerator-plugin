import debug from "debug";
import { OPENAI_MODELS } from "src/constants";

import cl100k_base from "@dqbd/tiktoken/encoders/cl100k_base.json";
import r50k_base from "@dqbd/tiktoken/encoders/r50k_base.json";
import p50k_base from "@dqbd/tiktoken/encoders/p50k_base.json";
import TextGeneratorPlugin from "src/main";
import wasm from "../../node_modules/@dqbd/tiktoken/tiktoken_bg.wasm";
import { init, Tiktoken } from "@dqbd/tiktoken/lite/init";
import { Notice } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
const logger = debug("textgenerator:tokens-service");

export default class TokensScope {
  plugin: TextGeneratorPlugin;
  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;
  }

  async setup() {
    await init((imports) => WebAssembly.instantiate(wasm, imports));

    return this;
  }

  getEncoderFromEncoding(encoding: string) {
    let model: any;
    switch (encoding) {
      case "cl100k_base":
        model = cl100k_base;
        break;
      case "r50k_base":
        model = r50k_base;
        break;
      case "p50k_base":
        model = p50k_base;
        break;
      default:
        break;
    }
    const encoder = new Tiktoken(
      model?.bpe_ranks,
      model?.special_tokens,
      model?.pat_str
    );
    return encoder;
  }

  async estimate(context: any) {
    logger("estimateTokens", context);
    const { options, template } = context;

    const prompt =
      template && !context.context
        ? await template.inputTemplate(options)
        : context.context;

    const { bodyParams } =
      this.plugin.textGenerator.reqFormatter.getRequestParameters(
        {
          ...this.plugin.settings,
          prompt,
        },
        true,
        ""
      );

    const llmSettings = this.plugin.textGenerator.LLMProvider.getSettings();

    const conf = {
      ...this.plugin.settings,
      ...llmSettings,
      ...bodyParams,
    };

    const { tokens, maxTokens } =
      await this.plugin.textGenerator.LLMProvider.calcTokens(
        bodyParams.messages,
        conf
      );

    const cost = await this.plugin.textGenerator.LLMProvider.calcPrice(
      tokens,
      conf
    );

    const result = {
      // model: this.plugin.textGenerator.LLMProvider.getSettings().model || this.plugin.settings.model || "gpt-3.5-turbo",
      maxTokens,
      completionTokens: this.plugin.settings.max_tokens,
      tokens,
      cost,
    };

    logger("estimateTokens", result);
    return result;
  }

  showTokens(props: {
    tokens: any;
    maxTokens: number;
    cost: number;
    // model: string;
    completionTokens: number;
    // total: number;
  }) {
    // <tr><td><strong>Model</strong></td><td>${props.model}</td></tr>
    // <tr><td><strong>Prompt tokens</strong></td><td>${props.tokens}</td></tr>

    logger("showTokens", props);

    const summaryEl = document.createElement("div");
    summaryEl.classList.add("summary");
    // summaryEl.innerHTML =  as any;

    const provider = createRoot(summaryEl);

    provider.render(
      <div className="flow-root">
        <ul
          role="list"
          className="divide-y divide-gray-200 dark:divide-gray-700"
        >
          <li className="py-3 sm:py-4">
            <div className="flex items-center justify-between space-x-4">
              <div>Total tokens</div>
              <div className="inline-flex items-center pr-3 text-base font-semibold text-gray-900 dark:text-white">
                {props.tokens}
              </div>
            </div>
          </li>

          <li className="py-3 sm:py-4">
            <div className="flex items-center justify-between space-x-4">
              <div>Completion tokens</div>
              <div className="inline-flex items-center pr-3 text-base font-semibold text-gray-900 dark:text-white">
                {props.completionTokens}
              </div>
            </div>
          </li>

          <li className="py-3 sm:py-4">
            <div className="flex items-center justify-between space-x-4">
              <div>Max Tokens</div>
              <div className="inline-flex items-center pr-3 text-base font-semibold text-gray-900 dark:text-white">
                {props.maxTokens}
              </div>
            </div>
          </li>

          <li className="py-3 sm:py-4">
            <div className="flex items-center justify-between space-x-4">
              <div>Estimated Price</div>
              <div className="inline-flex items-center pr-3 text-base font-semibold text-gray-900 dark:text-white">
                ${props.cost.toLocaleString()}
              </div>
            </div>
          </li>
        </ul>
      </div>
    );

    logger("showTokens", { summaryEl });
    logger(summaryEl);
    new Notice(summaryEl as any, 5000);
  }
}

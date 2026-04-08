import React from "react";
import LangchainBase from "./base";
import type { AzureOpenAIInput, OpenAIInput } from "@langchain/openai";
import { IconExternalLink } from "@tabler/icons-react";

import LLMProviderInterface, { LLMConfig } from "../interface";
import debug from "debug";

import { Input, SettingItem, useGlobal } from "../refs";
import { HeaderEditor, ModelsHandler } from "../utils";

const logger = debug("textgenerator:llmProvider:azureopenaiInstruct");

const default_values = {
  azureOpenAIApiVersion: "2024-06-01",
  model: "",
};

/**
 * Normalize whatever the user pastes into the Endpoint field.
 * Accepts:
 *   - plain instance name   → azureOpenAIApiInstanceName
 *   - full Azure URL        → azureOpenAIBasePath (stripped to origin + /openai/deployments)
 * Also extracts api-version from the query string when present.
 */
function parseEndpoint(raw?: string): {
  azureOpenAIBasePath?: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiVersion?: string;
} {
  if (!raw) return {};
  const trimmed = raw.trim();

  if (!trimmed.includes("://") && !trimmed.includes("."))
    return { azureOpenAIApiInstanceName: trimmed };

  let apiVersion: string | undefined;
  let urlStr = trimmed;

  const qIdx = urlStr.indexOf("?");
  if (qIdx !== -1) {
    const params = new URLSearchParams(urlStr.slice(qIdx));
    apiVersion = params.get("api-version") || undefined;
    urlStr = urlStr.slice(0, qIdx);
  }

  urlStr = urlStr.replace(/\/+$/, "");

  // Strip known API paths so users can paste any Azure OpenAI URL
  urlStr = urlStr
    .replace(/\/chat\/completions$/i, "")
    .replace(/\/completions$/i, "")
    .replace(/\/openai\/responses$/i, "")
    .replace(/\/openai\/deployments\/[^/]+$/i, "")
    .replace(/\/openai\/deployments$/i, "")
    .replace(/\/openai$/i, "")
    .replace(/\/+$/, "");

  // Ensure path ends with /openai/deployments for AzureChatOpenAI
  if (!urlStr.match(/\/openai\/deployments$/i)) {
    urlStr += "/openai/deployments";
  }

  return {
    azureOpenAIBasePath: urlStr,
    ...(apiVersion && { azureOpenAIApiVersion: apiVersion }),
  };
}

export default class LangchainAzureOpenAIInstructProvider
  extends LangchainBase
  implements LLMProviderInterface {
  static provider = "Langchain";
  static id = "Azure OpenAI Instruct (Langchain)" as const;
  static slug = "azureOpenaiInstruct" as const;
  static displayName = "Azure OpenAI Instruct";

  llmPredict = true;
  provider = LangchainAzureOpenAIInstructProvider.provider;
  id = LangchainAzureOpenAIInstructProvider.id;
  originalId = LangchainAzureOpenAIInstructProvider.id;
  isAzure = true;

  default_values = default_values;

  getConfig(options: LLMConfig): Partial<OpenAIInput & AzureOpenAIInput> {
    const endpoint = parseEndpoint(
      options.otherOptions?.endpoint ||
      options.otherOptions?.azureOpenAIBasePath
    );

    const { azureOpenAIApiVersion: urlVersion, ...endpointFields } = endpoint;

    return this.cleanConfig({
      apiKey: options.api_key,
      azureOpenAIApiKey: options.api_key,
      ...endpointFields,
      ...(options.otherOptions?.azureOpenAIApiInstanceName && !endpointFields.azureOpenAIApiInstanceName && !endpointFields.azureOpenAIBasePath
        ? { azureOpenAIApiInstanceName: options.otherOptions.azureOpenAIApiInstanceName }
        : {}),
      azureOpenAIApiDeploymentName:
        options.otherOptions?.azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion:
        options.otherOptions?.azureOpenAIApiVersion ||
        urlVersion ||
        default_values.azureOpenAIApiVersion,

      modelKwargs: options.modelKwargs,
      modelName: options.model,
      maxTokens: +options.max_tokens,
      temperature: +options.temperature,
      frequencyPenalty: +options.frequency_penalty || 0,
      presencePenalty: +options.presence_penalty || 0,
      n: options.n,
      stop: options.otherOptions?.supportsStop === false
        ? undefined
        : options.stop?.length ? options.stop : undefined,
      streaming: options.stream,
      maxRetries: 3,
      headers: options.headers || (undefined as any),
    });
  }

  getReqOptions(options: Partial<LLMConfig>) {
    const opts = super.getReqOptions(options);
    if (options.otherOptions?.supportsStop === false) {
      delete opts.stop;
    }
    return opts;
  }

  async load() {
    const { AzureOpenAI } = await import("@langchain/openai");
    this.llmClass = AzureOpenAI;
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();
    const id = props.self.id;
    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
    });

    const displayEndpoint =
      config.endpoint ||
      config.azureOpenAIBasePath ||
      config.azureOpenAIApiInstanceName ||
      "";

    return (
      <>
        <SettingItem
          name="API Key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              config.api_key = value;
              global.triggerReload();
              global.plugin.encryptAllKeys();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Endpoint"
          description="Instance name (e.g. my-instance) or full URL (e.g. https://my-instance.openai.azure.com/openai/deployments)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={displayEndpoint}
            placeholder="my-instance or https://..."
            setValue={async (value) => {
              config.endpoint = value;
              config.azureOpenAIBasePath = undefined;
              config.azureOpenAIApiInstanceName = undefined;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Deployment Name"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIApiDeploymentName || ""}
            placeholder="e.g. gpt-4o"
            setValue={async (value) => {
              config.azureOpenAIApiDeploymentName = value;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="API Version"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.azureOpenAIApiVersion || default_values.azureOpenAIApiVersion}
            placeholder={default_values.azureOpenAIApiVersion}
            setValue={async (value) => {
              config.azureOpenAIApiVersion = value || default_values.azureOpenAIApiVersion;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <ModelsHandler
          register={props.register}
          sectionId={props.sectionId}
          llmProviderId={props.self.originalId || id}
          default_values={default_values}
          config={config}
        />

        <SettingItem
          name="Supports stop parameter"
          description="Disable for models that reject the stop parameter (e.g. o-series reasoning models)"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="checkbox"
            value={config.supportsStop !== false ? "true" : "false"}
            setValue={async (value) => {
              config.supportsStop = value === "true";
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <HeaderEditor
          enabled={!!config.headers}
          setEnabled={async (value) => {
            if (!value) config.headers = undefined;
            else config.headers = "{}";
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
          headers={config.headers}
          setHeaders={async (value) => {
            config.headers = value;
            global.triggerReload();
            await global.plugin.saveSettings();
          }}
        />

        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://portal.azure.com/#create/Microsoft.CognitiveServicesOpenAI">
            <SettingItem
              name="Create Azure OpenAI resource"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://learn.microsoft.com/en-us/azure/ai-services/openai/reference">
            <SettingItem
              name="API documentation"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models">
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

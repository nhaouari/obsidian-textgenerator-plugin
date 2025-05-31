import { IconList, IconPencil, IconPlus, IconReload, IconScreenshot, IconVideo, IconWaveSine } from "@tabler/icons-react";
import clsx from "clsx";
import React, { useState, useEffect, useId } from "react";
import LLMProviderInterface from "./interface";
import JSON5 from "json5";
import { currentDate } from "#/utils";

import {
  AI_MODELS,
  Dropdown,
  DropdownSearch,
  Input,
  SettingItem,
  fetchWithoutCORS,
  useGlobal,
} from "./refs";
import { arrayBufferToBase64 } from "obsidian";
import { default_values } from "./custom/custom";

type LLMProviderType = "Default (Custom)" | "OpenAI Chat (Langchain)" | "OpenAI Instruct (Langchain)" | "OpenAI Agent (Langchain)" | "Google GenerativeAI (Langchain)" | "Google Palm (Langchain)" | "MistralAI Chat (Langchain)" | "Anthropic Chat (Langchain)" | "Anthropic Legacy (Custom)" | "OpenRouter Chat (Langchain)";

interface ModelType {
  encoding: string;
  prices: {
    prompt: number;
    completion: number;
  };
  maxTokens: number;
  llm: LLMProviderType[];
  order?: number;
  inputOptions?: {
    images?: boolean;
    audio?: boolean;
    videos?: boolean;
  };
}

type AI_MODELS_Type = Record<string, ModelType>;

export function ModelsHandler(props: {
  register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
  sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
  default_values: any;
  llmProviderId: string;
  config?: any;
  getModels?: () => Promise<string[]>;
}) {
  const default_values = props.default_values;
  const id = props.llmProviderId;

  const global = useGlobal();
  const [models, setModels] = useState<string[]>([]);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [edit, setEdit] = useState(false);

  const config =
    props.config ||
    (global.plugin.settings.LLMProviderOptions[id] ??= {
      ...default_values,
    });

  const updateModels = async () => {
    setLoadingUpdate(true);
    try {
      if (props.getModels) {
        const newModels = await props.getModels();
        const postingModels: string[] = [];

        newModels.forEach(async (model) => {
          if (!models.includes(model)) postingModels.push(model);
        });

        setModels([...models, ...postingModels.sort()]);
      } else {
        if (!config.api_key && !global.plugin.settings.api_key)
          throw "Please provide a valid api key.";


        let basePath = config.basePath || default_values.basePath || "https://api.anthropic.com";

        if (basePath.endsWith("/")) {
          basePath = basePath.slice(0, -1);
        }

        const reqParams = {
          url: `${basePath}/models`,
          method: "GET",
          body: "",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.api_key || global.plugin.settings.api_key}`,
          },
        };

        const requestResults: {
          data: {
            id: string;
          }[];
        } = JSON5.parse(await fetchWithoutCORS(reqParams));

        const postingModels: string[] = [];

        requestResults.data.forEach(async (model) => {
          if (!models.includes(model.id)) postingModels.push(model.id);
        });

        setModels([...models, ...postingModels.sort()]);
      }
    } catch (err: any) {
      global.plugin.handelError(err);
    }
    setLoadingUpdate(false);
  };

  useEffect(() => {
    Object.entries(AI_MODELS as AI_MODELS_Type).forEach(
      ([e, o]) => o.llm.includes(id) && models.push(e)
    );

    setModels(
      [...new Set(models)]
        .sort()
        .sort(
          (m1: keyof typeof AI_MODELS, m2: keyof typeof AI_MODELS) =>
            ((AI_MODELS as AI_MODELS_Type)[m2]?.order || 0) - ((AI_MODELS as AI_MODELS_Type)[m1]?.order || 0)
        )
    );
  }, []);

  const modelName = "" + config.model as string;
  const model = (AI_MODELS as AI_MODELS_Type)[modelName.toLowerCase()] || (AI_MODELS as AI_MODELS_Type)["models" + modelName.toLowerCase()];

  const supportedInputs = Object.keys(model?.inputOptions || {}).filter(e => !!e);
  return (
    <>
      <SettingItem
        name="Model"
        register={props.register}
        sectionId={props.sectionId}
      >
        <div className="plug-tg-flex plug-tg-flex-col">
          <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2">
            {global.plugin.settings.experiment || edit ? (
              <DropdownSearch
                value={config.model}
                setValue={async (selectedModel) => {
                  config.model = selectedModel;
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
                values={models}
              />
            ) : (
              <Dropdown
                value={config.model}
                setValue={async (selectedModel) => {
                  config.model = selectedModel;
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
                values={models}
              />
            )}

            <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
              <button
                className="plug-tg-btn plug-tg-btn-xs"
                onClick={() => setEdit((i) => !i)}
              >
                {edit ? <IconList size={11} /> : <IconPencil size={11} />}
              </button>
              <button
                className={clsx("plug-tg-btn plug-tg-btn-xs", {
                  "plug-tg-loading": loadingUpdate,
                })}
                onClick={updateModels}
                disabled={loadingUpdate}
              >
                <IconReload size={11} />
              </button>
            </div>
          </div>

          {!!supportedInputs.length && <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2">
            {model?.inputOptions?.images && <IconScreenshot size={16} />}
            {model?.inputOptions?.audio && <IconWaveSine size={16} />}
            {model?.inputOptions?.videos && <IconVideo size={16} />}
          </div>}
        </div>
      </SettingItem>
    </>
  );
}

export const saveExport = (data: any, name: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${name}_${currentDate()}.json`;
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

export function cleanConfig<T>(options: T): T {
  const cleanedOptions: any = {}; // Create a new object to store the cleaned properties

  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      const value = options[key];

      // Check if the value is not an empty string
      if (value != undefined && (typeof value !== "string" || value !== "")) {
        cleanedOptions[key] = value; // Copy non-empty properties to the cleaned object
      }
    }
  }

  return cleanedOptions;
}

export function convertArrayBufferToBase64Link(arrayBuffer: ArrayBuffer, type: string) {
  // Convert the number array to a Base64 string using btoa and String.fromCharCode
  const base64String = arrayBufferToBase64(arrayBuffer);

  // Format as a data URL
  return `data:${type || ""};base64,${base64String}`;
}

export function HeaderEditor({
  headers,
  setHeaders,
  enabled,
  setEnabled,
}: {
  headers?: string;
  setHeaders: (headers: string) => void;
  enabled?: boolean;
  setEnabled: (enabled: boolean) => void;
}) {
  const [error, setError] = useState<string>();

  const validateAndSetHeaders = (value: string) => {
    try {
      if (!value) {
        setHeaders("");
        setError(undefined);
        return;
      }

      // Try parsing as JSON to validate
      const parsed = JSON5.parse(value) as Record<string, unknown>;

      // Verify it's an object
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        throw new Error("Headers must be a JSON object");
      }

      // Verify all values are strings
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val !== "string") {
          throw new Error("Header values must be strings");
        }
      }

      setHeaders(value);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
      <SettingItem
        name="Enable Custom Headers"
        register={undefined}
        sectionId={undefined}
      >
        <Input
          type="checkbox"
          value={enabled ? "true" : "false"}
          placeholder="Enable Custom Headers"
          setValue={async (value) => {
            setEnabled(value == "true");
          }}
        />
      </SettingItem>

      {enabled && (
        <>
          <textarea
            placeholder="Headers"
            className="plug-tg-resize-none plug-tg-w-full"
            defaultValue={headers}
            onChange={async (e) => {
              validateAndSetHeaders(e.target.value);

              const compiled = await Handlebars.compile(
                headers
              )({
                ...cleanConfig(default_values),
                n: 1,
              });

              console.log("------ PREVIEW OF HEADER ------\n", compiled);
              setError(undefined);
              try {
                console.log(
                  "------ PREVIEW OF HEADER COMPILED ------\n",
                  JSON5.parse(compiled)
                );
              } catch (err: any) {
                setError(err.message || err);
                console.warn(err);
              }
            }}
            spellCheck={false}
            rows={5}
          />
          <div className="plug-tg-text-red-300">{error}</div>
        </>
      )}
    </div>
  );
}


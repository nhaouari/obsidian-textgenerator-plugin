import { IconList, IconPencil, IconReload } from "@tabler/icons-react";
import clsx from "clsx";
import React, { useState, useEffect, useId } from "react";
import LLMProviderInterface from "./interface";
import JSON5 from "json5";
import { currentDate } from "#/utils";

import {
  AI_MODELS,
  Dropdown,
  DropdownSearch,
  SettingItem,
  fetchWithoutCORS,
  useGlobal,
} from "./refs";
import { arrayBufferToBase64 } from "obsidian";

export function ModelsHandler(props: {
  register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
  sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
  default_values: any;
  llmProviderId: string;
  config?: any;
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
      if (!config.api_key && !global.plugin.settings.api_key)
        throw "Please provide a valid api key.";

      const reqParams = {
        url: `${config.basePath || default_values.basePath}/models`,
        method: "GET",
        body: "",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.api_key || global.plugin.settings.api_key
            }`,
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
    } catch (err: any) {
      global.plugin.handelError(err);
    }
    setLoadingUpdate(false);
  };

  useEffect(() => {
    Object.entries(AI_MODELS).forEach(
      ([e, o]) => o.llm.contains(id) && models.push(e)
    );

    setModels(
      [...new Set(models)]
        .sort()
        .sort(
          (m1: keyof typeof AI_MODELS, m2: keyof typeof AI_MODELS) =>
            (AI_MODELS[m2]?.order || 0) - (AI_MODELS[m1]?.order || 0)
        )
    );
  }, []);

  const modelsDatasetId = useId();
  return (
    <>
      <SettingItem
        name="Model"
        register={props.register}
        sectionId={props.sectionId}
      >
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
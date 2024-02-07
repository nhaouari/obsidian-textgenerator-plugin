import { AI_MODELS } from "#/constants";
import useGlobal from "#/ui/context/global";
import Dropdown from "#/ui/settings/components/dropdown";
import Input from "#/ui/settings/components/input";
import SettingItem from "#/ui/settings/components/item";
import { IconList, IconPencil, IconReload } from "@tabler/icons-react";
import clsx from "clsx";
import React, { useState, useEffect, useId } from "react";
import LLMProviderInterface from "./interface";
import JSON5 from "json5";
import { currentDate } from "#/utils";
import { request } from "obsidian";

export function ModelsHandler(props: {
    register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
    sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
    default_values: any;
    llmProviderId: string,
    config?: any
}) {
    const default_values = props.default_values;
    const id = props.llmProviderId;

    const global = useGlobal();
    const [models, setModels] = useState<string[]>([]);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [edit, setEdit] = useState(false);

    const config = props.config || (global.plugin.settings.LLMProviderOptions[id] ??= {
        ...default_values,
    });

    const updateModels = async () => {
        setLoadingUpdate(true);
        try {
            if (!config.api_key && !global.plugin.settings.api_key) throw "Please provide a valid api key.";

            const reqParams = {
                url: `${config.basePath || default_values.basePath}/models`,
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
            } = JSON5.parse(await request(reqParams));

            const postingModels: string[] = [];

            requestResults.data.forEach(async (model) => {
                if (!models.includes(model.id))
                    postingModels.push(model.id);
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
        )
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
                    {global.plugin.settings.experiment || edit ? <>
                        <datalist id={modelsDatasetId}>
                            {[...models].map(model => <option key={model} value={model} />)}
                        </datalist>

                        <Input
                            value={config.model}
                            datalistId={modelsDatasetId}
                            placeholder="Enter your Model name"
                            setValue={async (value) => {
                                config.model = value;
                                global.triggerReload();
                                // TODO: it could use a debounce here
                                await global.plugin.saveSettings();
                            }}
                        />
                    </>
                        : <Dropdown
                            value={config.model}
                            setValue={async (selectedModel) => {
                                config.model = selectedModel;
                                await global.plugin.saveSettings();
                                global.triggerReload();
                            }}
                            values={models}
                        />
                    }

                    <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
                        <button
                            onClick={() => setEdit((i) => !i)}
                        >
                            {edit ? <IconList /> : <IconPencil />}
                        </button>
                        <button
                            className={clsx({
                                "plug-tg-loading": loadingUpdate,
                            })}
                            onClick={updateModels}
                            disabled={loadingUpdate}
                        >
                            <IconReload />
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



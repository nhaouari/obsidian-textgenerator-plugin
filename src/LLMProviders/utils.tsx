import { AI_MODELS } from "#/constants";
import useGlobal from "#/ui/context/global";
import Dropdown from "#/ui/settings/components/dropdown";
import Input from "#/ui/settings/components/input";
import SettingItem from "#/ui/settings/components/item";
import { IconReload } from "@tabler/icons-react";
import clsx from "clsx";
import { request } from "obsidian";
import React, { useState, useEffect, useId } from "react";
import LLMProviderInterface from "./interface";

export function ModelsHandler(props: {
    register: Parameters<LLMProviderInterface["RenderSettings"]>[0]["register"];
    sectionId: Parameters<LLMProviderInterface["RenderSettings"]>[0]["sectionId"];
    default_values: any;
    llmProviderId: string
}) {
    const default_values = props.default_values;
    const id = props.llmProviderId;

    const global = useGlobal();
    const [models, setModels] = useState<string[]>([]);
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {
        ...default_values,
    });

    const updateModels = async () => {
        setLoadingUpdate(true);
        try {
            if (global.plugin.settings.api_key.length > 0) {
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
                } = JSON.parse(await request(reqParams));

                requestResults.data.forEach(async (model) => {
                    models.push(model.id);
                });

                setModels(
                    [...new Set(models)]
                        .sort(
                            (m1: keyof typeof AI_MODELS, m2: keyof typeof AI_MODELS) =>
                                (AI_MODELS[m2]?.order || 0) - (AI_MODELS[m1]?.order || 0)
                        )
                );
            } else {
                throw "Please provide a valid api key.";
            }
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
                    {global.plugin.settings.experiment ? <>
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
                            values={
                                [...models]
                                    .sort()
                                    .sort(
                                        (m1: keyof typeof AI_MODELS, m2: keyof typeof AI_MODELS) =>
                                            (AI_MODELS[m2]?.order || 0) - (AI_MODELS[m1]?.order || 0))
                            }
                        />
                    }

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
            </SettingItem>
        </>
    );
}
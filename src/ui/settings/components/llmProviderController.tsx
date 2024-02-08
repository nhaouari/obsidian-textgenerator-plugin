import React, { useEffect, useId, useState } from "react";
import type { Register } from "../sections";
import Dropdown from "./dropdown";
import SettingItem from "./item";
import LLMProviderInterface from "../../../LLMProviders/interface";
import useGlobal from "../../context/global";

export default function LLMProviderController(props: {
    register: Register,
    setSelectedProvider(p: string): void
    getSelectedProvider(): string,
    triggerResize(): void,
    /** Minimal, aka just select the llm provider */
    mini?: boolean
}) {

    const global = useGlobal();
    let llmList = global.plugin.textGenerator.LLMRegestry.getList();
    const sectionId = useId();
    const [selectedLLM, setSelectedLLM] = useState<
        LLMProviderInterface | undefined
    >();

    const [selectedLLMId, setSelectedLLMId] = useState<string | undefined>(
        props.getSelectedProvider() || llmList[0]
    );

    const updateLLm = (selectedLLMId: string | undefined) => {
        if (!selectedLLMId) return;
        const llm = global.plugin.textGenerator.LLMRegestry.get(selectedLLMId);

        if (llm) {
            props.setSelectedProvider(selectedLLMId as any);
            setSelectedLLM(
                //@ts-ignore
                new llm({
                    plugin: global.plugin,
                })
            );
        }

        global.plugin.textGenerator.load();
    };

    const clone = async () => {
        // pick a name and id
        const name = (selectedLLM?.slug || selectedLLMId?.split("(")[0].trim() || "")
        const newId = selectedLLM?.id + " " + llmList.filter(l => l.startsWith(name)).length;

        // add the llm clone
        await global.plugin.textGenerator.addLLMCloneInRegistry({
            id: newId,
            name: name + " " + llmList.filter(l => l.startsWith(name)).length,
            extends: selectedLLMId
        })

        llmList = global.plugin.textGenerator.LLMRegestry.getList();

        setSelectedLLMId(newId);
        updateLLm(newId);
    }

    const del = async () => {
        const parentId = selectedLLM?.originalId;
        if (!selectedLLMId) return;
        // delete the llm clone
        await global.plugin.textGenerator.deleteLLMCloneFromRegistry(selectedLLMId)

        llmList = global.plugin.textGenerator.LLMRegestry.getList();

        setSelectedLLMId(parentId);
        updateLLm(parentId);
    }

    useEffect(() => updateLLm(selectedLLMId), []);

    const isDefaultProvider = selectedLLM ? !selectedLLM.cloned : false;

    return <>
        <SettingItem
            name={`LLM Provider`}
            description={selectedLLM?.cloned ? `${selectedLLM.originalId}` : selectedLLMId?.split("(")?.[1]?.split(")")?.[0] || ""}
            register={props.register}
            sectionId={sectionId}
        >
            <Dropdown
                value={selectedLLMId}
                setValue={(selectedLLMId) => {
                    setSelectedLLMId(selectedLLMId);
                    updateLLm(selectedLLMId);
                    global.plugin.saveSettings();
                    global.triggerReload();
                    props.triggerResize();
                }}
                aliases={global.plugin.textGenerator.LLMRegestry.UnProviderNames}
                values={llmList}
            />

            {isDefaultProvider ?
                <button
                    onClick={clone}
                >
                    +
                </button>
                :
                <button
                    onClick={del}
                >
                    -
                </button>
            }
        </SettingItem>
        {!props.mini &&
            selectedLLM && (
                <div className="plug-tg-flex plug-tg-h-full plug-tg-w-full plug-tg-flex-col plug-tg-gap-2">
                    <selectedLLM.RenderSettings
                        key={selectedLLMId}
                        register={props.register}
                        self={selectedLLM}
                        sectionId={sectionId}
                    />
                </div>
            )
        }
    </>
}
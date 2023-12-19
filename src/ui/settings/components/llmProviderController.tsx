import React, { useEffect, useId, useState } from "react";
import type { Register } from "../sections";
import Dropdown from "./dropdown";
import SettingItem from "./item";
import { useToggle } from "usehooks-ts";
import { LLMProviderRegistery } from "../../../LLMProviders";
import LLMProviderInterface from "../../../LLMProviders/interface";
import useGlobal from "../../context/global";

export default function LLMProviderController(props: {
    register: Register,
    setSelectedProvider(p: string): void
    getSelectedProvider(): string,
    triggerResize(): void,
    mini?: boolean
}) {

    const llmList = LLMProviderRegistery.getList();
    const global = useGlobal();
    const sectionId = useId();
    const [selectedLLM, setSelectedLLM] = useState<
        LLMProviderInterface | undefined
    >();

    const [selectedLLMName, setSelectedLLMName] = useState<string | undefined>(
        props.getSelectedProvider() || llmList[0]
    );

    const updateLLm = (selectedLLMName: string | undefined) => {
        if (!selectedLLMName) return;

        const llm = LLMProviderRegistery.get(selectedLLMName);
        if (llm) {
            props.setSelectedProvider(selectedLLMName as any);
            setSelectedLLM(
                //@ts-ignore
                new llm({
                    plugin: global.plugin,
                })
            );
        }

        global.plugin.textGenerator.setup();
    };

    useEffect(() => updateLLm(selectedLLMName), []);

    return <><SettingItem
        name={`LLM Provider`}
        description={`${selectedLLMName?.split("(")?.[1]?.split(")")?.[0] || ""}`}
        register={props.register}
        sectionId={sectionId}
    >
        <Dropdown
            value={selectedLLMName}
            setValue={(selectedLLMName) => {
                setSelectedLLMName(selectedLLMName);
                updateLLm(selectedLLMName);
                global.plugin.saveSettings();
                global.triggerReload();
                props.triggerResize();
            }}
            values={llmList}
        />
    </SettingItem>
        {!props.mini &&
            selectedLLM && (
                <div className="flex h-full w-full flex-col gap-2">
                    <selectedLLM.RenderSettings
                        register={props.register}
                        self={selectedLLM}
                        sectionId={sectionId}
                    />
                </div>
            )
        }
    </>
}
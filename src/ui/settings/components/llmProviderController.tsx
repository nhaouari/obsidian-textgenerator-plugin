import React, { useEffect, useId, useState } from "react";
import type { Register } from "../sections";
import Dropdown from "./dropdown";
import SettingItem from "./item";
import LLMProviderInterface from "../../../LLMProviders/interface";
import useGlobal from "../../context/global";
import Input from "./input";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import clsx from "clsx";
import Confirm from "#/ui/package-manager/components/confirm";
import ExportImportHandler from "#/ui/components/exportImport";
import { z } from "zod";


const profileFileSchema = z.object({
    id: z.string(),
    profile: z.object({
        extends: z.string(),
        name: z.string()
    }),
    config: z.record(z.any())
})


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

        global.plugin.textGenerator.load();

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

    const isDefaultProvider = selectedLLM ? !selectedLLM.cloned : false;

    const clone = async () => {
        // pick a name and id
        const name = (selectedLLM?.slug || selectedLLMId?.split("(")[0].trim() || "")
        const newId = selectedLLM?.id + " " + llmList.filter(l => l.startsWith(name)).length;

        if (!(isDefaultProvider ? selectedLLMId : selectedLLM?.originalId)) throw "can't be cloned"
        // add the llm clone
        await global.plugin.textGenerator.addLLMCloneInRegistry({
            id: newId,
            name: name + " " + llmList.filter(l => l.startsWith(name)).length,
            extends: isDefaultProvider ? selectedLLMId : selectedLLM?.originalId as any,
            extendsDataFrom: selectedLLMId
        })

        llmList = global.plugin.textGenerator.LLMRegestry.getList();

        setSelectedLLMId(newId);
        updateLLm(newId);
    }

    const del = async () => {
        if (!await Confirm(`Are you sure you want to delete ${selectedLLMId}`, "Delete Confirmation")) return;
        const parentId = selectedLLM?.originalId;
        if (!selectedLLMId) return;
        // delete the llm clone
        await global.plugin.textGenerator.deleteLLMCloneFromRegistry(selectedLLMId)

        llmList = global.plugin.textGenerator.LLMRegestry.getList();

        setSelectedLLMId(parentId);
        updateLLm(parentId);
    }

    useEffect(() => updateLLm(selectedLLMId), []);


    const selectLLM = (selectedLLMId: string) => {
        setSelectedLLMId(selectedLLMId);
        updateLLm(selectedLLMId);
        global.plugin.saveSettings();
        global.triggerReload();
        props.triggerResize();
    }

    return <>
        <SettingItem
            name={`LLM Provider`}
            description={selectedLLM?.cloned ? `${selectedLLM.originalId}` : selectedLLMId?.split("(")?.[1]?.split(")")?.[0] || ""}
            register={props.register}
            sectionId={sectionId}
        >
            {/* {global.plugin.settings.experiment ?
                <DropdownSearch
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
                : */}
            <Dropdown
                value={selectedLLMId}
                setValue={selectLLM}
                aliases={global.plugin.textGenerator.LLMRegestry.UnProviderNames}
                values={llmList}
            />
            {/* } */}

            <div className="plug-tg-flex plug-tg-gap-1 plug-tg-flex-col">

                <button
                    onClick={clone}
                    className="plug-tg-btn plug-tg-btn-xs"
                >
                    <IconPlus size={11} />
                </button>
                <button
                    onClick={!isDefaultProvider ? del : undefined}
                    disabled={isDefaultProvider}
                    className={clsx("plug-tg-btn plug-tg-btn-xs", {
                        "plug-tg-btn-disabled": isDefaultProvider
                    })}
                >
                    <IconTrash size={11} />
                </button>
            </div>
        </SettingItem>

        {!props.mini &&
            selectedLLM && selectedLLMId && <>
                <div className="plug-tg-flex plug-tg-h-full plug-tg-w-full plug-tg-flex-col plug-tg-gap-2">
                    <selectedLLM.RenderSettings
                        key={selectedLLMId}
                        register={props.register}
                        self={selectedLLM}
                        sectionId={sectionId}
                    />
                </div>
                {
                    isDefaultProvider ? "" :
                        <SettingItem
                            name="Name"
                            description="Change name of the profile"
                            register={props.register}
                            className=""
                            sectionId={sectionId}>
                            <Input
                                className="plug-tg-input-sm"
                                placeholder={global.plugin.textGenerator.LLMRegestry.UnProviderNames[selectedLLMId]}
                                value={global.plugin.textGenerator.LLMRegestry.UnProviderNames[selectedLLMId]}
                                setValue={async (val) => {
                                    global.plugin.textGenerator.LLMRegestry.UnProviderNames[selectedLLMId] = val as any;
                                    global.plugin.settings.LLMProviderProfiles[selectedLLMId].name = val;

                                    await global.plugin.saveSettings();
                                    global.triggerReload();
                                }}
                            />
                        </SettingItem>
                }
                <ExportImportHandler
                    // defaultConfig={default_values}
                    id="llm"
                    getConfig={() => {
                        return {
                            id: selectedLLMId,
                            profile: global.plugin.settings.LLMProviderProfiles[selectedLLMId],
                            config: global.plugin.settings.LLMProviderOptions[selectedLLMId]
                        }
                    }}
                    onImport={async (data) => {
                        const d = await profileFileSchema.parseAsync(data);

                        let id = d.id;

                        if (!id) {
                            id = selectedLLM?.id + " " + llmList.filter(l => l.startsWith(d.profile.extends)).length;
                        }

                        global.plugin.settings.LLMProviderProfiles[id] = d.profile;
                        global.plugin.settings.LLMProviderOptions[id] = d.config;
                        selectLLM(id)
                    }}
                />

            </>
        }
    </>
}
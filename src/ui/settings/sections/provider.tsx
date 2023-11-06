import React, { useEffect, useId, useState } from "react";
import Dropdown from "../components/dropdown";
import useGlobal from "../../context/global";
import LLMProviderInterface from "src/LLMProviders/interface";
import { LLMProviderRegistery } from "src/LLMProviders";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import type { Register } from ".";
import { useToggle } from "usehooks-ts";

export default function ProviderSetting(props: { register: Register }) {
  const llmList = LLMProviderRegistery.getList();
  const global = useGlobal();
  const sectionId = useId();
  const [selectedLLM, setSelectedLLM] = useState<
    LLMProviderInterface | undefined
  >();

  const [resized, triggerResize] = useToggle();

  const [selectedLLMName, setSelectedLLMName] = useState<string | undefined>(
    global.plugin.settings.selectedProvider || llmList[0]
  );

  const updateLLm = (selectedLLMName: string | undefined) => {
    if (!selectedLLMName) return;

    const llm = LLMProviderRegistery.get(selectedLLMName);
    if (llm) {
      global.plugin.settings.selectedProvider = selectedLLMName as any;
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

  return (
    <>
      <SettingsSection
        title="LLM Settings"
        className="flex w-full flex-col"
        register={props.register}
        id={sectionId}
        triggerResize={resized}
        alwaysOpen
      >
        <SettingItem
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
              triggerResize();
            }}
            values={llmList}
          />
        </SettingItem>

        {selectedLLM && (
          <div className="flex h-full w-full flex-col gap-2">
            <selectedLLM.RenderSettings
              register={props.register}
              self={selectedLLM}
              sectionId={sectionId}
            />
          </div>
        )}
      </SettingsSection>
    </>
  );
}

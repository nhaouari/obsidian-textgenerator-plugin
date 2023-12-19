import React, { useId } from "react";
import LLMProviderController from "../components/llmProviderController";
import SettingsSection from "../components/section";
import type { Register } from ".";
import { useToggle } from "usehooks-ts";
import useGlobal from "#/ui/context/global";
import SettingItem from "../components/item";

export default function ProviderSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();
  const [resized, triggerResize] = useToggle();
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
        <LLMProviderController
          register={props.register}
          getSelectedProvider={() => global.plugin.settings.selectedProvider || ""}
          setSelectedProvider={(newVal) => global.plugin.settings.selectedProvider = newVal as any || ""}
          triggerResize={triggerResize}
        />
      </SettingsSection>
    </>
  );
}

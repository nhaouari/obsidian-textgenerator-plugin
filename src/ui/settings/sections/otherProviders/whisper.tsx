import React, { useId } from "react";
import useGlobal from "../../../context/global";
import SettingItem from "../../components/item";
import SettingsSection from "../../components/section";
import type { Register } from "..";
import Input from "../../components/input";

export const WhisperProviderName = "whisper";

const default_values = {
  base_path: "https://api.openai.com/v1",
};

export default function WhisperProviderSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();

  const config = (global.plugin.settings.LLMProviderOptions[
    WhisperProviderName
  ] ??= {
    ...default_values,
  });

  return (
    <>
      <SettingsSection
        title="Whisper Settings"
        className="flex w-full flex-col"
        collapsed={!props.register.searchTerm.length}
        hidden={!props.register.activeSections[sectionId]}
      >
        <SettingItem
          name="BasePath"
          description="default to openai"
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            value={config.basePath || default_values.base_path}
            setValue={async (val) => {
              config.basePath = val;
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
      </SettingsSection>
    </>
  );
}

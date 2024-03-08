import React, { useId } from "react";
import useGlobal from "../../../context/global";
import SettingItem from "../../components/item";
import SettingsSection from "../../components/section";
import type { Register } from "..";
import Input from "../../components/input";
import DropdownSearch from "../../components/dropdownSearch";

export const WhisperProviderName = "whisper";

export const default_values = {
  base_path: "https://api.openai.com/v1",
  model: "whisper-1",
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
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
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

        <SettingItem
          name="Model"
          description="default to whisper-1"
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            value={config.model || default_values.model}
            setValue={async (val) => {
              config.model = val;
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Language"
          description="default to (none)"
          register={props.register}
          sectionId={sectionId}
        >
          <DropdownSearch
            values={languages}
            value={config.language}
            // placeholder="(none)"
            setValue={async (val) => {
              config.language = val;
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
      </SettingsSection>
    </>
  );
}

const languages = [
  "Afrikaans",
  "Arabic",
  "Armenian",
  "Azerbaijani",
  "Belarusian",
  "Bosnian",
  "Bulgarian",
  "Catalan",
  "Chinese",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Estonian",
  "Finnish",
  "French",
  "Galician",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Italian",
  "Japanese",
  "Kannada",
  "Kazakh",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Malay",
  "Marathi",
  "Maori",
  "Nepali",
  "Norwegian",
  "Persian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Russian",
  "Serbian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog",
  "Tamil",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
  "Welsh",
];

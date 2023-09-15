import React, { useEffect, useId, useMemo } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
export default function AutoSuggestSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();

  useEffect(() => {
    global.plugin.settings.autoSuggestOptions = {
      ...global.plugin.defaultSettings.autoSuggestOptions,
      ...global.plugin.settings.autoSuggestOptions,
    };
  }, []);

  return (
    <SettingsSection
      title="Auto-Suggest Options"
      className="flex w-full flex-col"
      collapsed={!props.register.searchTerm.length}
      hidden={!props.register.activeSections[sectionId]}
    >
      <SettingItem
        name="Enable/Disable"
        description="Enable or disable auto-suggest."
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.autoSuggestOptions.isEnabled}
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.isEnabled = val == "true";
            global.plugin.AutoSuggestStatusBar();
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Trigger Phrase"
        description="Trigger Phrase"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          placeholder="Trigger Phrase"
          value={global.plugin.settings.autoSuggestOptions.triggerPhrase}
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.triggerPhrase = val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
      <SettingItem
        name="Delay milliseconds for trigger"
        register={props.register}
        sectionId={sectionId}
      >
        <input
          type="range"
          className="dz-tooltip"
          min={0}
          max={2000}
          data-tip={global.plugin.settings.autoSuggestOptions.delay + "ms"}
          value={global.plugin.settings.autoSuggestOptions.delay}
          onChange={async (e) => {
            global.plugin.settings.autoSuggestOptions.delay = parseInt(
              e.target.value
            );
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Number of Suggestions"
        description="Enter the number of suggestions to generate. Please note that increasing this value may significantly increase the cost of usage with GPT-3."
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={
            "" + global.plugin.settings.autoSuggestOptions.numberOfSuggestions
          }
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.numberOfSuggestions =
              parseInt(val);
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Stop Phrase"
        description="Enter the stop phrase to use for generating auto-suggestions. The generation will stop when the stop phrase is found. (Use a space for words, a period for sentences, and a newline for paragraphs.)"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          placeholder="Stop Phrase"
          value={global.plugin.settings.autoSuggestOptions.stop}
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.stop = val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Show/Hide Auto-suggest status in Status Bar"
        description=""
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.autoSuggestOptions.showStatus}
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.showStatus =
              val == "true";
            global.plugin.AutoSuggestStatusBar();
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
    </SettingsSection>
  );
}

import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
import Confirm from "#/ui/package-manager/components/confirm";
export default function AdvancedSetting(props: { register: Register }) {
  const global = useGlobal();

  const sectionId = useId();

  const reloadPlugin = async () => {
    // @ts-ignore
    await app.plugins.disablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    await app.plugins.enablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    app.setting.openTabById("obsidian-textgenerator-plugin").display();
  };

  const resetSettings = async () => {
    if (
      !(await Confirm(
        "Are you sure, you want to Reset all your settings,\n this action will delete all your configuration to their default state"
      ))
    )
      return;

    await global.plugin.resetSettingsToDefault();
    await reloadPlugin();
  };
  return (
    <SettingsSection
      title="Advanced Settings"
      className="flex w-full flex-col"
      register={props.register}
      id={sectionId}
    >
      <SettingItem
        name="Display errors in the editor"
        description="If you want to see the errors in the editor"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.displayErrorInEditor}
          setValue={async (val) => {
            global.plugin.settings.displayErrorInEditor = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Show Status in StatusBar"
        description="Show information in the Status Bar"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.showStatusBar}
          setValue={async (val) => {
            global.plugin.settings.showStatusBar = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Output generated text to blockquote"
        description="Distinguish between AI generated text and typed text using a blockquote"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.outputToBlockQuote}
          setValue={async (val) => {
            global.plugin.settings.outputToBlockQuote = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Free cursor on streaming"
        description="Note that it might result in weird bugs, the auto-scrolling might not work"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.freeCursorOnStreaming}
          setValue={async (val) => {
            global.plugin.settings.freeCursorOnStreaming = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
      <SettingItem
        name="Prompts Templates Path"
        description="Path of Prompts Templates"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={global.plugin.settings.promptsPath}
          setValue={async (val) => {
            global.plugin.settings.promptsPath = val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Reload the plugin"
        description="Some changes might require you to reload the plugins"
        register={props.register}
        sectionId={sectionId}
      >
        <button onClick={reloadPlugin}>Reload</button>
      </SettingItem>

      <SettingItem
        name="Resets all settings to default"
        description="It will delete all your configurations"
        register={props.register}
        sectionId={sectionId}
      >
        <button className="dz-btn-danger" onClick={resetSettings}>
          Reset
        </button>
      </SettingItem>
    </SettingsSection>
  );
}

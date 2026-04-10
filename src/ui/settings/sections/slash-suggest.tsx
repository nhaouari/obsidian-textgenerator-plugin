import React, { useEffect, useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
import { useToggle } from "usehooks-ts";
import { useReloder } from "../components/reloadPlugin";

export default function SlashSuggestSetting(props: { register: Register }) {
  const [setReloader] = useReloder();

  const global = useGlobal();
  const sectionId = useId();
  const [resized, triggerResize] = useToggle();

  useEffect(() => {
    global.plugin.settings.slashSuggestOptions = {
      ...global.plugin.defaultSettings.slashSuggestOptions,
      ...global.plugin.settings.slashSuggestOptions,
    };
  }, []);

  return (
    <SettingsSection
      title="斜杠建议选项"
      className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
      register={props.register}
      triggerResize={resized}
      id={sectionId}
    >
      <SettingItem
        name="启用/禁用"
        description="启用或禁用斜杠建议功能"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.slashSuggestOptions.isEnabled}
          setValue={async (val) => {
            global.plugin.settings.slashSuggestOptions.isEnabled =
              val == "true";
            global.plugin.autoSuggest?.renderStatusBar();
            setReloader(true);
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
      {!!global.plugin.settings.slashSuggestOptions.isEnabled && (
        <>
          <SettingItem
            name="触发词"
            description="触发词（默认：/）"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              placeholder="触发词"
              value={global.plugin.settings.slashSuggestOptions.triggerPhrase}
              setValue={async (val) => {
                global.plugin.settings.slashSuggestOptions.triggerPhrase = val;
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>
        </>
      )}
    </SettingsSection>
  );
}

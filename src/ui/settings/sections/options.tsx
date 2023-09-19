import React, { useEffect, useId, useMemo, useRef } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import { useLocalStorage, useToggle } from "usehooks-ts";
import type { Register } from ".";
// object storing custom name/description of items
const extendedInfo: Record<
  string,
  {
    description?: string;
    name?: string;
  }
> = {};

export default function OptionsSetting(props: { register: Register }) {
  const ref = useRef<HTMLDivElement>();
  const [didChangeAnything, setDidChangeAnything] = useLocalStorage(
    "did-change",
    false
  );

  const global = useGlobal();
  const sectionId = useId();
  const ops = useMemo(
    () =>
      Object.keys({
        ...global.plugin.defaultSettings.options,
        ...global.plugin.settings.options,
      }),
    []
  );

  useEffect(() => {
    // if (!ref.current || !didChangeAnything) return;

    return () => {
      console.log("exiting settings");
      (async () => {})();
    };
  }, [ref, didChangeAnything]);

  const reloadPlugin = async () => {
    setDidChangeAnything(false);

    // @ts-ignore
    await app.plugins.disablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    await app.plugins.enablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    app.setting.openTabById("obsidian-textgenerator-plugin").display();
  };

  return (
    <>
      {didChangeAnything && (
        <div className="absolute bottom-0 right-0 z-20 p-3">
          <div className="flex items-center gap-2 overflow-hidden rounded-md bg-[var(--interactive-accent)] p-3 font-bold">
            <div>YOU NEED TO RELOAD THE PLUGIN</div>
            <button onClick={reloadPlugin}>Reload</button>
          </div>
        </div>
      )}
      <SettingsSection
        title="Activate options section"
        className="flex w-full flex-col"
        collapsed={!props.register.searchTerm.length}
        hidden={!props.register.activeSections[sectionId]}
      >
        <SettingItem
          name="Keys encryption"
          description="Enable encrypting keys, this could cause incompatibility with mobile devices"
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            type="checkbox"
            value={"" + global.plugin.settings.encrypt_keys}
            setValue={async (val) => {
              global.plugin.settings.encrypt_keys = val == "true";
              await global.plugin.loadApikeys();
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
        {ops.map((key) => {
          const moreData = extendedInfo[key];

          return (
            <SettingItem
              key={key}
              name={moreData?.name || key}
              description={
                moreData?.description ||
                global.plugin.commands?.find(
                  (c) =>
                    c.id == `obsidian-textgenerator-plugin:${key}` ||
                    c.id === key
                )?.name ||
                key
              }
              register={props.register}
              sectionId={sectionId}
            >
              <Input
                type="checkbox"
                value={
                  "" +
                  global.plugin.settings.options[
                    key as keyof typeof global.plugin.settings.options
                  ]
                }
                setValue={async (val) => {
                  global.plugin.settings.options[
                    key as keyof typeof global.plugin.settings.options
                  ] = val == "true";

                  // new Notice(
                  //   `${key} is ${
                  //     global.plugin.settings.options[
                  //       key as keyof typeof global.plugin.settings.options
                  //     ]
                  //       ? "enabled"
                  //       : "disabled"
                  //   }.`
                  // );

                  document.querySelector(".tg-opts")?.scrollIntoView();
                  setDidChangeAnything(true);
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
              />
            </SettingItem>
          );
        })}
      </SettingsSection>
    </>
  );
}

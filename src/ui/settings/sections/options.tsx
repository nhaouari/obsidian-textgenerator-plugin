import React, { useId, useMemo } from "react";
import useGlobal from "../../context/global";
import { useReloder } from "../components/reloadPlugin";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
// object storing custom name/description of items
const extendedInfo: Record<
  string,
  {
    description?: string;
    name?: string;
  }
> = {
  "modal-suggest": {
    name: "Slash suggestions",
    description: "modal-suggest",
  },
  "set-llm": {
    name: "Choose LLM",
    description: "Choose which LLM provider Text Generator uses for requests.",
  },
  "set-model": {
    name: "Choose model",
    description:
      "Choose the model for the selected provider (e.g. GPT-4.1, Claude, etc.).",
  },
  "packageManager": {
    name: "Template Packages Manager",
    description: "Enable the Template Packages Manager command and ribbon icon.",
  },
  "open-playground": {
    name: "Open Template Playground",
    description:
      "Enable the Template Playground command (test templates and preview/run output).",
  },
  "get-title": {
    name: "Generate title",
    description: "Enable the command that generates and replaces the current document title.",
  },
  "disable-ribbon-icons": {
    name: "Disable ribbon icons",
    description:
      "Remove Text Generator icons from the Obsidian ribbon (left sidebar on desktop; Ribbon Actions on mobile).",
  },
  "overlay-toolbar": {
    name: "Overlay toolbar",
    description:
      'Show a small overlay toolbar when you highlight text in the editor (includes a quick "Generate" action).',
  },
  "show-modal-From-template": {
    name: "Templates: show modal",
    description:
      "Enable the command that opens a template in a modal (instead of running it immediately).",
  },
  "open-template-as-tool": {
    name: "Open template as tool",
    description:
      "Enable the command that opens a template in the Tool view (run repeatedly in a dedicated panel).",
  },
  "text-extractor-tool": {
    name: "Text extractor tool",
    description:
      "Enable the Text Extractor tool (extract text from PDFs, web pages, images, audio, etc. depending on enabled extractors).",
  },
  "custom-instruct": {
    name: "Custom instruct",
    description:
      "Enable your custom instruction block that is injected into the context sent to the model.",
  },
  "generate-in-right-click-menu": {
    name: "Editor right‑click: Generate",
    description:
      'Add a "Generate" action to the editor right‑click menu for quick access.',
  },
  "batch-generate-in-right-click-files-menu": {
    name: "File right‑click: Batch generate",
    description:
      "Add batch generation actions to the file explorer right‑click menu.",
  },
  "tg-block-processor": {
    name: "TG code block processor",
    description:
      'Enable rendering and actions for ```tg code blocks (preview + a "Generate Text" button) inside notes.',
  },
  "log-slowest-operations": {
    name: "Log slow operations",
    description:
      "Log performance timing information to the console to help debug slow startup/operations.",
  },
};

export default function OptionsSetting(props: { register: Register }) {
  const [setReloader] = useReloder();

  const global = useGlobal();
  const sectionId = useId();
  const ops = useMemo(
    () =>
      Object.keys({
        ...global.plugin.defaultSettings.options,
        // ...global.plugin.settings.options,
      }),
    []
  );

  return (
    <>
      <SettingsSection
        title="Text Generator Options"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
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
              try {
                global.plugin.settings.encrypt_keys = val == "true";
                await global.plugin.encryptAllKeys();
                await global.plugin.saveSettings();
                global.triggerReload();
              } catch (err: any) {
                global.plugin.handelError(err);
              }
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
                global.plugin.commands?.commands.find(
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
                  setReloader(true);
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

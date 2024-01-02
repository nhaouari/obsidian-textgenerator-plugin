import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import { useMemo } from "react";
import type { Register } from ".";
import { Context } from "#/types";
import AvailableVars from "#/ui/components/availableVars";
import { contextVariablesObj } from "#/scope/context-manager";

const extendedInfo: Record<
  string,
  {
    description: string;
    name?: string;
  }
> = {
  includeTitle: {
    description:
      "Include the title of the active document in the considered context.",
  },
  starredBlocks: {
    description: "Include starred blocks in the considered context.",
  },

  includeFrontmatter: {
    description: "Include frontmatter",
  },

  includeHeadings: {
    description: "Include headings with their content.",
  },

  includeChildren: {
    description: "Include the content of internal md links on the page.",
  },

  includeMentions: {
    description: "Include paragraphs from mentions (linked, unliked).",
  },

  includeHighlights: {
    description: "Include Obsidian Highlights.",
  },

  includeExtractions: {
    description: "Include Extracted Information",
  },

  includeClipboard: {
    description: "Make clipboard available for templates",
  },
};

export default function ConsideredContextSetting(props: {
  register: Register;
}) {
  const global = useGlobal();
  const sectionId = useId();

  return (
    <>
      <SettingsSection
        title="Custom Instructions"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name="Custom default generation prompt"
          description={"You can customize {{context}} variable"}
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            type="checkbox"
            value={"" + global.plugin.settings.context.customInstructEnabled}
            setValue={async (val) => {
              global.plugin.settings.context.customInstructEnabled =
                val == "true";
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
        {global.plugin.settings.context.customInstructEnabled && (
          <>
            <SettingItem
              name=""
              description=""
              register={props.register}
              sectionId={sectionId}
              textArea
            >
              <textarea
                placeholder="Textarea will autosize to fit the content"
                className="plug-tg-resize-y plug-tg-input plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-outline-none plug-tg-h-fit plug-tg-w-full"
                value={
                  global.plugin.settings.context.customInstruct ||
                  global.plugin.defaultSettings.context.customInstruct
                }
                onChange={async (e) => {
                  global.plugin.settings.context.customInstruct =
                    e.target.value;
                  global.triggerReload();
                  await global.plugin.saveSettings();
                }}
                spellCheck={false}
                rows={10}
              />
            </SettingItem>
            <AvailableVars vars={contextVariablesObj} />
          </>
        )}


        <SettingItem
          name="Enable generate title instruct"
          description={"You can customize generate title prompt"}
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            type="checkbox"
            value={"" + global.plugin.settings.advancedOptions?.generateTitleInstructEnabled}
            setValue={async (val) => {
              if (!global.plugin.settings.advancedOptions) global.plugin.settings.advancedOptions = {
                generateTitleInstructEnabled: val == "true",
              }

              global.plugin.settings.advancedOptions.generateTitleInstructEnabled =
                val == "true";
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
        {global.plugin.settings.advancedOptions?.generateTitleInstructEnabled && (
          <>
            <SettingItem
              name=""
              description=""
              register={props.register}
              sectionId={sectionId}
              textArea
            >
              <textarea
                placeholder="Textarea will autosize to fit the content"
                className="plug-tg-resize-y plug-tg-input plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-outline-none plug-tg-h-fit plug-tg-w-full"
                value={
                  global.plugin.settings.advancedOptions?.generateTitleInstruct ||
                  global.plugin.defaultSettings.advancedOptions?.generateTitleInstruct
                }
                onChange={async (e) => {
                  if (!global.plugin.settings.advancedOptions) global.plugin.settings.advancedOptions = {
                    generateTitleInstructEnabled: true,
                    generateTitleInstruct: e.target.value
                  }

                  global.plugin.settings.advancedOptions.generateTitleInstruct =
                    e.target.value;

                  global.triggerReload();
                  await global.plugin.saveSettings();
                }}
                spellCheck={false}
                rows={10}
              />
            </SettingItem>
            <AvailableVars
              vars={{
                ...contextVariablesObj,
                query: {
                  example: "{{content255}}",
                  hint: "first 255 letters of trimmed content of the note"
                }
              }}
            />
          </>
        )}


        <SettingItem
          name="TG Selection Limiter(regex)"
          description="tg_selection stopping character. Empty means disabled. Default: ^\*\*\*"
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            value={global.plugin.settings.tgSelectionLimiter}
            setValue={async (val) => {
              global.plugin.settings.tgSelectionLimiter = val;
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Template Settings"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name="{{Context}} Template"
          description="Template for {{context}} variable"
          register={props.register}
          sectionId={sectionId}
          textArea
        >
          <textarea
            placeholder="Textarea will autosize to fit the content"
            className="plug-tg-resize-y plug-tg-input plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-outline-none plug-tg-h-fit plug-tg-w-full"
            value={
              global.plugin.settings.context.contextTemplate ||
              global.plugin.defaultSettings.context.contextTemplate
            }
            onChange={async (e) => {
              global.plugin.settings.context.contextTemplate = e.target.value;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
            spellCheck={false}
            rows={10}
          />
        </SettingItem>
        <AvailableVars vars={contextVariablesObj} />

        {(["includeClipboard"] as (keyof Context)[])
          //   .filter((d) => !contextNotForTemplate.contains(d as any))
          .map((key) => {
            const moreData = extendedInfo[key];
            return (
              <SettingItem
                key={moreData?.name || key}
                name={moreData?.name || key}
                description={
                  moreData?.description ||
                  `Include ${key} in the considered context.`
                }
                register={props.register}
                sectionId={sectionId}
              >
                <Input
                  type="checkbox"
                  value={
                    "" +
                    global.plugin.settings.context[
                    key as keyof typeof global.plugin.settings.context
                    ]
                  }
                  setValue={async (val) => {
                    (global.plugin.settings.context[
                      key as keyof typeof global.plugin.settings.context
                    ] as any) = val == "true";
                    await global.plugin.saveSettings();
                    global.triggerReload();
                  }}
                />
              </SettingItem>
            );
          })}

        <SettingItem
          name="Allow scripts"
          description="Only enable this if you trust the authors of the templates, or know what you're doing."
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            type="checkbox"
            value={"" + global.plugin.settings.allowJavascriptRun}
            setValue={async (val) => {
              global.plugin.settings.allowJavascriptRun = val == "true";
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
      </SettingsSection>
    </>
  );
}

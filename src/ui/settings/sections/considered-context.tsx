import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import { useMemo } from "react";
import type { Register } from ".";
import { Context } from "#/types";

const contextVariables: string[] = [
  "title",
  "content",
  "selection",
  "staredBlocks",
];

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

  const listOfContexts = useMemo(() => contextVariables, []);

  return (
    <>
      <SettingsSection
        title="Custom Instructions"
        className="flex w-full flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name=""
          description={"You can customize generate text prompt"}
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
              name="Context Template"
              description="Default template for {{context}} variable"
              register={props.register}
              sectionId={sectionId}
              textArea
            >
              <textarea
                placeholder="Textarea will autosize to fit the content"
                className="resize-y"
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
            <span className="text-sm opacity-50">Available Variables:</span>
            <div className="flex flex-wrap gap-2">
              {
                listOfContexts.map((v) => {
                  v = `{{${v}}}`;
                  return (
                    <span key={v} className="select-all">
                      {v}
                    </span>
                  );
                })
                //   .map((key) => {
                //     const moreData = extendedInfo[key];
                //     return (
                //       <SettingItem
                //         key={moreData?.name || key}
                //         name={moreData?.name || key}
                //         description={
                //           moreData?.description ||
                //           `Include ${key} in the considered context.`
                //         }
                //         register={props.register}
                //         sectionId={sectionId}
                //       >
                //         <Input
                //           type="checkbox"
                //           value={
                //             "" +
                //             global.plugin.settings.context[
                //               key as keyof typeof global.plugin.settings.context
                //             ]
                //           }
                //           setValue={async (val) => {
                //             global.plugin.settings.context[
                //               key as keyof typeof global.plugin.settings.context
                //             ] = val == "true";
                //             await global.plugin.saveSettings();
                //             global.triggerReload();
                //           }}
                //         />
                //       </SettingItem>
                //     );
                //   })
              }
            </div>
          </>
        )}
      </SettingsSection>
      <SettingsSection
        title="Considered Context For Templates"
        className="flex w-full flex-col"
        register={props.register}
        id={sectionId}
      >
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
          name="{{Context}} Template"
          description="Template for {{context}} variable"
          register={props.register}
          sectionId={sectionId}
          textArea
        >
          <textarea
            placeholder="Textarea will autosize to fit the content"
            className="resize-y"
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
        <span className="text-sm opacity-50">Available Variables:</span>
        <div className="flex flex-wrap gap-2">
          {
            listOfContexts.map((v) => {
              v = `{{${v}}}`;
              return (
                <span key={v} className="select-all">
                  {v}
                </span>
              );
            })
            //   .map((key) => {
            //     const moreData = extendedInfo[key];
            //     return (
            //       <SettingItem
            //         key={moreData?.name || key}
            //         name={moreData?.name || key}
            //         description={
            //           moreData?.description ||
            //           `Include ${key} in the considered context.`
            //         }
            //         register={props.register}
            //         sectionId={sectionId}
            //       >
            //         <Input
            //           type="checkbox"
            //           value={
            //             "" +
            //             global.plugin.settings.context[
            //               key as keyof typeof global.plugin.settings.context
            //             ]
            //           }
            //           setValue={async (val) => {
            //             global.plugin.settings.context[
            //               key as keyof typeof global.plugin.settings.context
            //             ] = val == "true";
            //             await global.plugin.saveSettings();
            //             global.triggerReload();
            //           }}
            //         />
            //       </SettingItem>
            //     );
            //   })
          }
        </div>
      </SettingsSection>
    </>
  );
}

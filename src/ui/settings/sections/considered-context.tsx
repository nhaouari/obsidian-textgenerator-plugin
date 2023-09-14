import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import { useMemo } from "react";
import { useToggle } from "usehooks-ts";
import type { Register } from ".";

const contextNotForTemplate = ["includeTitle", "includeStaredBlocks"];

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
    description: "Include clipboard content",
  },
};

export default function ConsideredContextSetting(props: {
  register: Register;
}) {
  const global = useGlobal();
  const sectionId = useId();

  const listOfContexts = useMemo(
    () => Object.keys(global.plugin.defaultSettings.context),
    []
  );

  return (
    <>
      <SettingsSection
        title="Considered Context"
        className="flex w-full flex-col"
        collapsed={!props.register.searchTerm.length}
        hidden={!props.register.activeSections[sectionId]}
      >
        {listOfContexts
          .filter((d) => contextNotForTemplate.contains(d))
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
                    global.plugin.settings.context[
                      key as keyof typeof global.plugin.settings.context
                    ] = val == "true";
                    await global.plugin.saveSettings();
                    global.triggerReload();
                  }}
                />
              </SettingItem>
            );
          })}
      </SettingsSection>
      <SettingsSection
        title="Considered Context For Templates"
        className="flex w-full flex-col"
        collapsed={!props.register.searchTerm.length}
        hidden={!props.register.activeSections[sectionId]}
      >
        {listOfContexts
          .filter((d) => !contextNotForTemplate.contains(d))
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
                    global.plugin.settings.context[
                      key as keyof typeof global.plugin.settings.context
                    ] = val == "true";
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

import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import SettingsTextarea from "../components/textarea";
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
      "在上下文中包含当前文档的标题",
  },
  starredBlocks: {
    description: "在上下文中包含星标段落",
  },

  includeFrontmatter: {
    description: "包含 Frontmatter",
  },

  includeHeadings: {
    description: "包含标题及其内容",
  },

  includeChildren: {
    description: "包含页面中内部 Markdown 链接的内容",
  },

  includeMentions: {
    description: "包含提及（已链接和未链接）中的段落",
  },

  includeHighlights: {
    description: "包含 Obsidian 高亮内容",
  },

  includeExtractions: {
    description: "包含提取的信息",
  },

  includeClipboard: {
    description: "使剪贴板内容可用于模板",
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
        title="自定义指令"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name="自定义默认生成 Prompt"
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
              <SettingsTextarea
                  value={
                    global.plugin.settings.context.customInstruct ||
                    global.plugin.defaultSettings.context.customInstruct
                  }
                  setValue={async (val) => {
                    global.plugin.settings.context.customInstruct = val;
                    global.triggerReload();
                    await global.plugin.saveSettings();
                  }}
                />
            </SettingItem>
            <AvailableVars vars={contextVariablesObj} />
          </>
        )}

        <SettingItem
          name="启用自定义标题生成指令"
          description={"自定义标题生成的 Prompt"}
          register={props.register}
          sectionId={sectionId}
        >
          <Input
            type="checkbox"
            value={
              "" +
              global.plugin.settings.advancedOptions
                ?.generateTitleInstructEnabled
            }
            setValue={async (val) => {
              if (!global.plugin.settings.advancedOptions)
                global.plugin.settings.advancedOptions = {
                  generateTitleInstructEnabled: val == "true",
                };

              global.plugin.settings.advancedOptions.generateTitleInstructEnabled =
                val == "true";
              await global.plugin.saveSettings();
              global.triggerReload();
            }}
          />
        </SettingItem>
        {global.plugin.settings.advancedOptions
          ?.generateTitleInstructEnabled && (
            <>
              <SettingItem
                name=""
                description=""
                register={props.register}
                sectionId={sectionId}
                textArea
              >
                <SettingsTextarea
                  value={
                    global.plugin.settings.advancedOptions
                      ?.generateTitleInstruct ||
                    global.plugin.defaultSettings.advancedOptions
                      ?.generateTitleInstruct ||
                    ""
                  }
                  setValue={async (val) => {
                    if (!global.plugin.settings.advancedOptions)
                      global.plugin.settings.advancedOptions = {
                        generateTitleInstructEnabled: true,
                        generateTitleInstruct: val,
                      };

                    global.plugin.settings.advancedOptions.generateTitleInstruct = val;
                    global.triggerReload();
                    await global.plugin.saveSettings();
                  }}
                />
              </SettingItem>
              <AvailableVars
                vars={{
                  ...contextVariablesObj,
                  query: {
                    example: "{{content255}}",
                    hint: "first 255 letters of trimmed content of the note",
                  },
                }}
              />
            </>
          )}

        <SettingItem
          name="TG 选区限制符（正则）"
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
        title="模板设置"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name="{{context}} 变量模板"
          description="{{context}} 变量的模板"
          register={props.register}
          sectionId={sectionId}
          textArea
        >
          <SettingsTextarea
            value={
              global.plugin.settings.context.contextTemplate ||
              global.plugin.defaultSettings.context.contextTemplate ||
              ""
            }
            setValue={async (val) => {
              global.plugin.settings.context.contextTemplate = val;
              global.triggerReload();
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        <AvailableVars vars={contextVariablesObj} />

        {(["includeClipboard"] as (keyof Context)[])
          //   .filter((d) => !contextNotForTemplate.contains(d as any))
          .map((key: any) => {
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
          name="允许脚本"
          description="仅在你信任模板作者或清楚风险的情况下启用"
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

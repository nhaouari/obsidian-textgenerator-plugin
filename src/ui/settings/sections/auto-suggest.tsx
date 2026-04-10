import React, { useEffect, useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import SettingsTextarea from "../components/textarea";
import type { Register } from ".";
import LLMProviderController from "../components/llmProviderController";
import { useToggle } from "usehooks-ts";
import AvailableVars from "#/ui/components/availableVars";
import { contextVariablesObj } from "#/scope/context-manager";
import { useReloder } from "../components/reloadPlugin";

export default function AutoSuggestSetting(props: { register: Register }) {
  const [setReloader] = useReloder();

  const global = useGlobal();
  const sectionId = useId();
  const [resized, triggerResize] = useToggle();
  useEffect(() => {
    global.plugin.settings.autoSuggestOptions = {
      ...global.plugin.defaultSettings.autoSuggestOptions,
      ...global.plugin.settings.autoSuggestOptions,
    };
  }, []);

  return (
    <SettingsSection
      title="自动建议选项"
      className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
      register={props.register}
      triggerResize={resized}
      id={sectionId}
    >
      <SettingItem
        name="启用/禁用"
        description="启用或禁用自动建议功能"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.autoSuggestOptions.isEnabled}
          setValue={async (val) => {
            global.plugin.settings.autoSuggestOptions.isEnabled = val == "true";
            global.plugin.autoSuggest?.renderStatusBar();
            setReloader(true);
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      {!!global.plugin.settings.autoSuggestOptions.isEnabled && (
        <>
          <SettingItem
            name="行内建议"
            description="在编辑器中直接显示建议文本（实验功能）"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              type="checkbox"
              value={
                "" + global.plugin.settings.autoSuggestOptions.inlineSuggestions
              }
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.inlineSuggestions =
                  val == "true";
                setReloader(true);
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          {!!global.plugin.settings.autoSuggestOptions.inlineSuggestions && (
            <SettingItem
              name="以 Markdown 显示"
              description="将建议文本渲染为 Markdown，可能在首尾出现多余空格（实验功能）"
              register={props.register}
              sectionId={sectionId}
            >
              <Input
                type="checkbox"
                value={
                  "" + global.plugin.settings.autoSuggestOptions.showInMarkdown
                }
                setValue={async (val) => {
                  global.plugin.settings.autoSuggestOptions.showInMarkdown =
                    val == "true";
                  setReloader(true);
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
              />
            </SettingItem>
          )}

          <SettingItem
            name="触发词"
            description="触发词（默认：双空格）"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              placeholder="触发词"
              value={global.plugin.settings.autoSuggestOptions.triggerPhrase}
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.triggerPhrase = val;
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          <SettingItem
            name="覆盖触发词"
            description="接受建议时替换的触发词（默认：单空格）"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              value={
                "" + global.plugin.settings.autoSuggestOptions.overrideTrigger
              }
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.overrideTrigger = val;
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          <SettingItem
            name="触发延迟（毫秒）"
            register={props.register}
            sectionId={sectionId}
          >
            <input
              type="range"
              className="plug-tg-tooltip"
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
            name="建议数量"
            description="生成的建议条数。增加此值可能会显著增加 API 用量。"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              value={
                "" +
                global.plugin.settings.autoSuggestOptions.numberOfSuggestions
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
            name="停止词"
            description="自动建议的停止词，生成到该词时停止。（空格=词级，句号=句级，换行=段级）"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              placeholder="停止词"
              value={global.plugin.settings.autoSuggestOptions.stop}
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.stop = val;
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          <SettingItem
            name="允许在新行触发建议"
            description="允许在新行开头触发自动建议"
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              type="checkbox"
              value={
                "" + global.plugin.settings.autoSuggestOptions.allowInNewLine
              }
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.allowInNewLine =
                  val == "true";
                global.plugin.autoSuggest?.renderStatusBar();
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>
          <SettingItem
            name="在状态栏显示自动建议状态"
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
                global.plugin.autoSuggest?.renderStatusBar();
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          <SettingItem
            name="自定义自动建议 Prompt"
            description={"自定义自动建议的 Prompt 模板"}
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              type="checkbox"
              placeholder="自定义自动建议 Prompt"
              value={
                "" +
                global.plugin.settings.autoSuggestOptions.customInstructEnabled
              }
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.customInstructEnabled =
                  val == "true";
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>
          {global.plugin.settings.autoSuggestOptions.customInstructEnabled && (
            <>
              <SettingItem
                name="自定义自动建议 Prompt"
                register={props.register}
                sectionId={sectionId}
                textArea
              >
                <SettingsTextarea
                  placeholder="自定义自动建议 Prompt"
                  value={
                    global.plugin.settings.autoSuggestOptions.customInstruct ||
                    global.plugin.defaultSettings.autoSuggestOptions
                      .customInstruct ||
                    ""
                  }
                  setValue={async (val) => {
                    global.plugin.settings.autoSuggestOptions.customInstruct = val;
                    global.triggerReload();
                    await global.plugin.saveSettings();
                  }}
                />
              </SettingItem>
              <AvailableVars
                vars={{
                  ...contextVariablesObj,
                  query: {
                    example: "{{query}}",
                    hint: "query text that triggered auto-suggest",
                  },
                }}
              />
            </>
          )}

          {global.plugin.settings.autoSuggestOptions.customInstructEnabled && (
            <>
              <SettingItem
                name="自定义自动建议 System Prompt"
                register={props.register}
                sectionId={sectionId}
                textArea
              >
                <SettingsTextarea
                  placeholder="System Prompt"
                  value={
                    global.plugin.settings.autoSuggestOptions.systemPrompt ||
                    global.plugin.defaultSettings.autoSuggestOptions
                      .systemPrompt ||
                    ""
                  }
                  setValue={async (val) => {
                    global.plugin.settings.autoSuggestOptions.systemPrompt = val;
                    global.triggerReload();
                    await global.plugin.saveSettings();
                  }}
                />
              </SettingItem>
              <AvailableVars
                vars={{
                  ...contextVariablesObj,
                  query: {
                    example: "{{query}}",
                    hint: "query text that triggered auto-suggest",
                  },
                }}
              />
            </>
          )}


          <SettingItem
            name="自定义 Provider"
            description={"使用与主生成不同的 LLM Provider。\n使用前请先在 LLM 设置中配置好对应的 Provider。"}
            register={props.register}
            sectionId={sectionId}
          >
            <Input
              type="checkbox"
              value={
                "" + global.plugin.settings.autoSuggestOptions.customProvider
              }
              setValue={async (val) => {
                global.plugin.settings.autoSuggestOptions.customProvider =
                  val == "true";
                global.plugin.autoSuggest?.renderStatusBar();
                await global.plugin.saveSettings();
                global.triggerReload();
              }}
            />
          </SettingItem>

          {!!global.plugin.settings.autoSuggestOptions.customProvider && (
            <LLMProviderController
              register={props.register}
              getSelectedProvider={() =>
                global.plugin.settings.autoSuggestOptions.selectedProvider || ""
              }
              setSelectedProvider={(newVal) =>
              (global.plugin.settings.autoSuggestOptions.selectedProvider =
                (newVal as any) || "")
              }
              triggerResize={triggerResize}
              mini
            />
          )}
        </>
      )}
    </SettingsSection>
  );
}

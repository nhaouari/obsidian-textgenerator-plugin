import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import Confirm from "#/ui/components/confirm";
import type { Register } from ".";
export default function AdvancedSetting(props: { register: Register }) {
  const global = useGlobal();

  const sectionId = useId();

  const reloadPlugin = () => global.plugin.reload();

  const resetSettings = async () => {
    if (
      !(await Confirm(
        "确定要重置所有设置吗？\n此操作将把所有配置恢复为默认值"
      ))
    )
      return;

    await global.plugin.resetSettingsToDefault();
    await reloadPlugin();
  };

  return (
    <SettingsSection
      title="高级设置"
      className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
      register={props.register}
      id={sectionId}
    >
      <SettingItem
        name="流式输出"
        description="启用流式输出（需 Provider 支持）"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={
            "" +
            (global.plugin.textGenerator.LLMProvider.streamable &&
              global.plugin.settings.stream)
          }
          setValue={async (val) => {
            global.plugin.settings.stream = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
      <SettingItem
        name="在编辑器中显示错误"
        description="将错误信息直接显示在编辑器中"
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
        name="在状态栏显示信息"
        description="在底部状态栏显示当前状态"
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
        name="将生成文本输出为引用块"
        description="使用引用块区分 AI 生成文本和手动输入文本"
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
        name="流式输出时释放光标"
        description="注意：可能导致异常，自动滚动可能失效"
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
        name="实验性功能"
        description="启用实验性功能，可能不够稳定"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.experiment}
          setValue={async (val) => {
            global.plugin.settings.experiment = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="包含附件"
        description="实验功能：在请求中包含引用的图片，可能消耗大量 Token"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.advancedOptions?.includeAttachmentsInRequest}
          setValue={async (val) => {
            if (!global.plugin.settings.advancedOptions) global.plugin.settings.advancedOptions = {};

            global.plugin.settings.advancedOptions.includeAttachmentsInRequest = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>


      <SettingItem
        name="模板路径"
        description="模板文件夹的路径"
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
        name="TextGenerator 路径"
        description="Text Generator 存放备份、生成内容等文件的路径"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={global.plugin.settings.textGenPath}
          setValue={async (val) => {
            global.plugin.settings.textGenPath = val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="重载插件"
        description="某些更改需要重载插件才能生效"
        register={props.register}
        sectionId={sectionId}
      >
        <button onClick={reloadPlugin}>重载</button>
      </SettingItem>

      <SettingItem
        name="重置所有设置"
        description="将删除所有自定义配置并恢复默认值"
        register={props.register}
        sectionId={sectionId}
      >
        <button className="plug-tg-btn-danger" onClick={resetSettings}>
          重置
        </button>
      </SettingItem>
    </SettingsSection>
  );
}

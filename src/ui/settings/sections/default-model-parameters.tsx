import React, { useEffect, useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
import { z } from "zod";
import { useDebounceValue } from "usehooks-ts";

const MaxTokensSchema = z.number().min(0);
const TemperatureSchema = z.number().min(0).max(2);
const FrequencySchema = z.number().min(-2).max(2);
const TimeoutSchema = z.number().min(0);

export default function DMPSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();

  const [debouncedMaxTokens] = useDebounceValue(
    global.plugin.settings.max_tokens,
    400
  );

  useEffect(() => {
    global.plugin.updateStatusBar("");
  }, [debouncedMaxTokens]);

  return (
    <SettingsSection
      title="默认模型参数"
      className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
      register={props.register}
      id={sectionId}
    >
      <h5>你可以在 Frontmatter YAML 中指定更多参数</h5>
      <a
        className="text-xs"
        href="https://beta.openai.com/docs/api-reference/completions"
      >
        API 文档
      </a>

      <SettingItem
        name="Max tokens（最大 Token 数）"
        description="对话补全中生成的最大 Token 数。输入和生成的 Token 总数受模型上下文长度限制。（1000 Token ≈ 750 个英文单词）"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="number"
          value={global.plugin.settings.max_tokens}
          placeholder="max_tokens"
          validator={MaxTokensSchema}
          setValue={async (val) => {
            // @ts-ignore
            global.plugin.settings.max_tokens = parseInt(val) || val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Temperature（温度）"
        description="采样温度，范围 0 到 2。值越高（如 0.8）输出越随机，值越低（如 0.2）输出越集中和确定。"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="number"
          value={global.plugin.settings.temperature}
          placeholder="temperature"
          validator={TemperatureSchema}
          setValue={async (val) => {
            // @ts-ignore
            global.plugin.settings.temperature = parseFloat(val) || val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Frequency Penalty（频率惩罚）"
        description="范围 -2.0 到 2.0。正值会根据文本中已出现的 Token 进行惩罚，促使模型谈论新话题。"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="number"
          value={global.plugin.settings.frequency_penalty}
          placeholder="frequency_penalty"
          validator={FrequencySchema}
          setValue={async (val) => {
            // @ts-ignore
            global.plugin.settings.frequency_penalty = parseFloat(val) || val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Timeout（超时）"
        description="请求超时时间（毫秒）。超时后请求将被中止。（默认：5000ms）"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="number"
          placeholder="Timeout"
          value={global.plugin.settings.requestTimeout}
          validator={TimeoutSchema}
          setValue={async (val) => {
            // @ts-ignore
            global.plugin.settings.requestTimeout = parseInt(val) || val;
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Prefix（前缀）"
        description="在生成内容前添加的前缀（默认：'\\n\\n'）"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={
            "" +
            global.plugin.settings.prefix?.replaceAll(
              `
`,
              "\\n"
            )
          }
          placeholder="Prefix"
          setValue={async (val) => {
            global.plugin.settings.prefix = val.replaceAll(
              "\\n",
              `
`
            );
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
    </SettingsSection>
  );
}

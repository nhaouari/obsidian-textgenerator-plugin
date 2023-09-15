import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import type { Register } from ".";
import { z } from "zod";

const TemperatureSchema = z.number().min(0).max(1);
const FrequencySchema = z.number().min(-20).max(20);
const TimeoutSchema = z.number().min(0);

export default function DMPSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();

  return (
    <SettingsSection
      title="Default model parameters"
      className="flex w-full flex-col"
      collapsed={!props.register.searchTerm.length}
      hidden={!props.register.activeSections[sectionId]}
    >
      <h5>You can specify more parameters in the Frontmatter YAML</h5>
      <a
        className="linkMoreInfo"
        href="https://beta.openai.com/docs/api-reference/completions"
      >
        API documentation
      </a>

      <SettingItem
        name="Max tokens"
        description="The maximum number of tokens to generate in the chat completion. The total length of input tokens and generated tokens is limited by the model's context length. (1000 tokens ~ 750 words)"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={"" + global.plugin.settings.max_tokens}
          placeholder="max_tokens"
          setValue={async (val) => {
            global.plugin.settings.max_tokens = parseInt(val);
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>

      <SettingItem
        name="Temperature"
        description="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic."
        register={props.register}
        sectionId={sectionId}
      >
        <Input
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
        name="Frequency Penalty"
        description="Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics."
        register={props.register}
        sectionId={sectionId}
      >
        <Input
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
        name="Timeout"
        description="Timeout in milliseconds. If the request takes longer than the timeout, the request will be aborted. (default: 5000ms)"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
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
        name="Prefix"
        description="Prefix to add to the beginning of the completion (default: '\n\n')"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          value={"" + global.plugin.settings.prefix?.replaceAll("\n", "\\n")}
          placeholder="Prefix"
          setValue={async (val) => {
            global.plugin.settings.prefix = val.replaceAll("\\n", "\n");
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
      <SettingItem
        name="Streaming"
        description="Enable streaming for commands Generate Text and Generate Text(with metadata)"
        register={props.register}
        sectionId={sectionId}
      >
        <Input
          type="checkbox"
          value={"" + global.plugin.settings.stream}
          setValue={async (val) => {
            global.plugin.settings.stream = val == "true";
            await global.plugin.saveSettings();
            global.triggerReload();
          }}
        />
      </SettingItem>
    </SettingsSection>
  );
}

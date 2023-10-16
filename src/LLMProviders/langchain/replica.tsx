import LangchainBase from "./base";
import { Replicate, ReplicateInput } from "langchain/llms/replicate";
import React from "react";
import LLMProviderInterface, { LLMConfig } from "../interface";
import SettingItem from "#/ui/settings/components/item";
import useGlobal from "#/ui/context/global";
import { IconExternalLink } from "@tabler/icons-react";
import { useToggle } from "usehooks-ts";
import Input from "#/ui/settings/components/input";
import { BaseLLMParams } from "langchain/dist/llms/base";
import debug from "debug";

const logger = debug("textgenerator:llmProvider:replicated");

const id = "Replica (Langchain)" as const;
export default class LangchainReplicaProvider
  extends LangchainBase
  implements LLMProviderInterface
{
  id = id;
  static id = id;
  streamable = false;
  llmPredict = true;
  provider = "Langchain";
  static provider = "Langchain";
  static slug = "replica";

  getConfig(options: LLMConfig): Partial<ReplicateInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      apiKey: options.api_key,

      // ------------Necessary stuff--------------
      model: options.engine as any,
      maxRetries: 3,
    });
  }

  getLLM(options: LLMConfig) {
    return new Replicate({
      ...this.getConfig(options),
    } as any);
  }

  RenderSettings(props: Parameters<LLMProviderInterface["RenderSettings"]>[0]) {
    const global = useGlobal();

    const config = (global.plugin.settings.LLMProviderOptions[id] ??= {});
    return (
      <>
        <SettingItem
          name="API Key"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            type="password"
            value={config.api_key || ""}
            setValue={async (value) => {
              config.api_key = value;
              global.plugin.encryptAllKeys();
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>

        <SettingItem
          name="Model"
          register={props.register}
          sectionId={props.sectionId}
        >
          <Input
            value={config.engine}
            setValue={async (value) => {
              config.engine = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        {/* <ModelsHandler /> */}
        <div className="flex flex-col gap-2">
          <div className="text-lg opacity-70">Useful links</div>
          <a href="https://beta.openai.com/signup/">
            <SettingItem
              name="Create account OpenAI"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/api-reference/introduction">
            <SettingItem
              name="API documentation"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/models/overview">
            <SettingItem
              name="more information"
              className="text-xs opacity-50 hover:opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
        </div>
      </>
    );
  }
}

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
  static provider = "Langchain";
  static id = id;
  static slug = "replica" as const;
  static displayName: string = "Replica";

  streamable = false;
  llmPredict = true;

  id = LangchainReplicaProvider.id;
  provider = LangchainReplicaProvider.provider;
  originalId = LangchainReplicaProvider.id;
  getConfig(options: LLMConfig): Partial<ReplicateInput & BaseLLMParams> {
    console.log(options);
    return this.cleanConfig({
      apiKey: options.api_key,

      // ------------Necessary stuff--------------
      model: options.model as any,
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

    const id = props.self.id;
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
            value={config.model}
            setValue={async (value) => {
              config.model = value;
              global.triggerReload();
              // TODO: it could use a debounce here
              await global.plugin.saveSettings();
            }}
          />
        </SettingItem>
        {/* <ModelsHandler /> */}
        <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
          <div className="plug-tg-text-lg plug-tg-opacity-70">Useful links</div>
          <a href="https://beta.openai.com/signup/">
            <SettingItem
              name="Create account OpenAI"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/api-reference/introduction">
            <SettingItem
              name="API documentation"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
              register={props.register}
              sectionId={props.sectionId}
            >
              <IconExternalLink />
            </SettingItem>
          </a>
          <a href="https://beta.openai.com/docs/models/overview">
            <SettingItem
              name="more information"
              className="plug-tg-text-xs plug-tg-opacity-50 hover:plug-tg-opacity-100"
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

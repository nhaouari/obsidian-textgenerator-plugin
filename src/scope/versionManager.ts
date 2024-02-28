import set from "lodash.set";
import TextGeneratorPlugin from "../main";
import { Version } from "../types";
import { default_values as anthropicLegacyDefaultValues } from "#/LLMProviders/custom/anthropic";
import { default_values as CUSTOMDefaultValues } from "#/LLMProviders/custom/custom";
export default class VersionManager {
  plugin: TextGeneratorPlugin;
  currentVersion: Version;

  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;
  }

  async load() {
    const version = this.plugin.manifest.version;

    // check if the version compatible with the format
    if (!/\d+\.\d+\.\d+(-beta)?/.test(version))
      return console.warn("version", version, "is not valid");

    this.currentVersion = version as Version;

    if (!this.isOldVersion(this.plugin.settings.version)) return;

    // check if settings's version is older or equal to 0.3.0
    if (this.compare(this.plugin.settings.version, "0.3.999-beta") <= 0) {
      await this.updateFromV0_3To0_4();
    }

    // check if settings's version is older or equal to 0.5.26
    if (this.compare(this.plugin.settings.version, "0.5.26-beta") <= 0) {
      await this.updateFromV5_27To5_28();
    }

    if (this.compare(this.plugin.settings.version, "0.6.13-beta") <= 0) {
      await this.updateFromV6_13To6_14();
    }

    if (this.compare(this.plugin.settings.version, "0.6.14-beta") <= 0) {
      await this.updateFromV6_14To7();
    }

    if (this.compare(this.plugin.settings.version, "0.7.1-beta") <= 0) {
      await this.updateFromV7_1To7_2();
    }



    this.plugin.settings.version = this.currentVersion;
    await this.plugin.saveSettings();
  }

  async updateFromV0_3To0_4() {
    this.plugin.settings.version = "0.4.0";
    if (this.plugin.settings.endpoint) {
      if (this.plugin.settings.endpoint == "https://api.openai.com") {
        this.plugin.settings.endpoint = this.plugin.defaultSettings.endpoint;

        // @ts-ignore
        set(this.plugin.settings, `LLMProviderOptions["OpenAI Chat (Langchain)"].basePath`, this.plugin.settings.endpoint)
        // @ts-ignore
        set(this.plugin.settings, `LLMProviderOptions["OpenAI Instruct (Langchain)"].basePath`, this.plugin.settings.endpoint)
      }
    }

    // @ts-ignore
    if (this.plugin.settings.engine) {
      // @ts-ignore
      set(this.plugin.settings, `LLMProviderOptions["OpenAI Chat (Langchain)"].model`, this.plugin.settings.engine)
      // @ts-ignore
      set(this.plugin.settings, `LLMProviderOptions["OpenAI Instruct (Langchain)"].model`, this.plugin.settings.engine)
    }

    if (this.plugin.settings.api_key) {
      set(this.plugin.settings, `LLMProviderOptions["OpenAI Chat (Langchain)"].api_key`, this.plugin.settings.api_key)
      set(this.plugin.settings, `LLMProviderOptions["OpenAI Instruct (Langchain)"].api_key`, this.plugin.settings.api_key)

      this.plugin.encryptAllKeys();
    }


    await this.plugin.saveSettings();
  }

  async updateFromV5_27To5_28() {
    this.plugin.settings.version = "0.5.28";
    this.plugin.settings.options["batch-generate-in-right-click-files-menu"] = this.plugin.defaultSettings.options["batch-generate-in-right-click-files-menu"]
    this.plugin.settings.options["tg-block-processor"] = this.plugin.defaultSettings.options["tg-block-processor"]
  }

  async updateFromV6_13To6_14() {
    this.plugin.settings.version = "0.6.14";
    // change custom provider variables handlebars_headers_in handlebars_body_in 
    // to custom_header, custom_body
    const customConfig = this.plugin.settings.LLMProviderOptions[`Default (Custom)`]
    if (customConfig) {
      if (customConfig.handlebars_headers_in && !customConfig.custom_header) {
        customConfig.custom_header = customConfig.handlebars_headers_in;
        delete customConfig.handlebars_headers_in;
      }

      if (customConfig.handlebars_body_in && !customConfig.custom_body) {
        customConfig.custom_body = customConfig.handlebars_body_in;
        delete customConfig.handlebars_body_in;
      }

      if (customConfig.path_to_choices ?? customConfig.path_to_message_content ?? customConfig.path_to_error_message ?? true) {
        customConfig.sanatization_response = `async (data, res)=>{
          // catch error
          if (res.status >= 300) {
            const err = data?.${customConfig.path_to_error_message} || JSON.stringify(data);
            throw err;
          }
        
          // get choices
          const choices =  data.${customConfig.path_to_choices}.map(c=>({
            role:"assistant", 
            content: c.${customConfig.path_to_message_content}
          }));
        
          // the return object should be in the format of 
          // { content: string }[] 
          // if there's only one response, put it in the array of choices.
          return choices;
        }`

      }
    }

    // same thing in anthropic legacy
    const anthropicConfig = this.plugin.settings.LLMProviderOptions[`Anthropic Legacy (Custom)`]
    if (anthropicConfig) {
      if (anthropicConfig.handlebars_headers_in && !anthropicConfig.custom_header) {
        anthropicConfig.custom_header = anthropicConfig.handlebars_headers_in;
        delete anthropicConfig.handlebars_headers_in;
      }

      if (anthropicConfig.handlebars_body_in && !anthropicConfig.custom_body) {
        anthropicConfig.custom_body = anthropicConfig.handlebars_body_in;
        delete anthropicConfig.handlebars_body_in;
      }
    }
  }

  async updateFromV6_14To7() {
    this.plugin.settings.version = "0.7.0";

    const chat1 = this.plugin.settings.LLMProviderOptions[`OpenAI Chat 1 (Langchain)`]
    if (chat1) {
      this.plugin.settings.LLMProviderProfiles ??= {};
      this.plugin.settings.LLMProviderProfiles["OpenAI Chat 1 (Langchain)"] = {
        extends: "OpenAI Chat (Langchain)",
        name: "OpenAI Chat 1"
      };
    }

    const chat2 = this.plugin.settings.LLMProviderOptions[`OpenAI Chat 2 (Langchain)`]
    if (chat2) {
      this.plugin.settings.LLMProviderProfiles ??= {};
      this.plugin.settings.LLMProviderProfiles["OpenAI Chat 2 (Langchain)"] = {
        extends: "OpenAI Chat (Langchain)",
        name: "OpenAI Chat 2"
      };
    }
  }

  async updateFromV7_1To7_2() {
    this.plugin.settings.version = "0.7.2";

    const anthropicLegacy = this.plugin.settings.LLMProviderOptions[
      "Anthropic Legacy (Custom)"
    ]
    if (anthropicLegacy) {
      this.plugin.settings.LLMProviderOptions[
        "Anthropic Legacy (Custom)"
      ] = {
        ...anthropicLegacy,
        ...anthropicLegacyDefaultValues,
        sanatization_response: anthropicLegacyDefaultValues.sanatization_response,
        endpoint: anthropicLegacy.replace("v1/complete", "v1/messages")
      }
    }
  }

  isOldVersion(version: Version) {
    return this.compare(version, this.currentVersion) < 0;
  }

  // positive if version1 is newer than version2
  compare(version1: Version, version2: Version) {
    const [v1, b1] = (version1 || "0.0.0").split("-");
    const [v2, b2] = (version2 || "0.0.0").split("-");

    const version1Parts = v1.split(".").map(Number);
    const version2Parts = v2.split(".").map(Number);

    for (
      let i = 0;
      i < Math.max(version1Parts.length, version2Parts.length);
      i++
    ) {
      const part1 = version1Parts[i] || 0;
      const part2 = version2Parts[i] || 0;

      if (part1 > part2) {
        return 1;
      } else if (part1 < part2) {
        return -1;
      }
    }

    // If one version is stable and the other is beta, consider the beta as newer
    if (b1 && !b2) {
      return 1;
    } else if (!b1 && b2) {
      return -1;
    }

    // Compare beta versions
    if (b1 && b2) {
      if (b1 > b2) {
        return 1;
      } else if (b1 < b2) {
        return -1;
      }
    }

    return 0;
  }
}

import set from "lodash.set";
import TextGeneratorPlugin from "../main";
import { Version } from "../types";
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
  }

  async updateFromV0_3To0_4() {
    this.plugin.settings.version = this.currentVersion;
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
    this.plugin.settings.version = this.currentVersion;
    this.plugin.settings.options["batch-generate-in-right-click-files-menu"] = this.plugin.defaultSettings.options["batch-generate-in-right-click-files-menu"]
    this.plugin.settings.options["tg-block-processor"] = this.plugin.defaultSettings.options["tg-block-processor"]
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

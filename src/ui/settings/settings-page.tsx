import { App, PluginSettingTab } from "obsidian";
import TextGeneratorPlugin from "src/main";
import packageJson from "package.json";

import { createRoot } from "react-dom/client";
import React from "react";
import { GlobalProvider } from "../context/global";

import SectionsMain from "./sections";
import ReloadPluginPopup from "./components/reloadPlugin";

export default class TextGeneratorSettingTab extends PluginSettingTab {
  plugin: TextGeneratorPlugin;
  app: App;
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.app = app;
    let models = new Map();
    if (this.plugin.settings.models?.size > 0) {
      models = this.plugin.settings.models;
    } else {
      [
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-3.5-turbo-16k",
        "gpt-3.5-turbo-16k-0613",
        "gpt-3.5-turbo-0613",
        "gpt-4-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
        "text-davinci-003",
        "text-davinci-002",
        "text-davinci-001",
        "text-curie-001",
        "text-babbage-001",
        "text-ada-001",
      ].forEach((e) => models.set(e, ""));
      this.plugin.settings.models = models;
      this.plugin.saveSettings();
    }
  }

  async reloadPlugin() {
    // @ts-ignore
    await this.app.plugins.disablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    await this.app.plugins.enablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    this.app.setting.openTabById("obsidian-textgenerator-plugin").display();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const div = containerEl.createDiv("div")
    const sections = createRoot(div);

    sections.render(
      <GlobalProvider plugin={this.plugin}>
        <ReloadPluginPopup />
        <SectionsMain />
      </GlobalProvider>
    );
  }
}

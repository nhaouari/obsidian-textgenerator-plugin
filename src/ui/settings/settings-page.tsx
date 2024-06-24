import { App, PluginSettingTab } from "obsidian";
import TextGeneratorPlugin from "#/main";

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
    const div = containerEl.createDiv("div");
    const sections = createRoot(div);

    sections.render(
      <GlobalProvider plugin={this.plugin}>
        <ReloadPluginPopup />
        <SectionsMain />
      </GlobalProvider>
    );
  }
}

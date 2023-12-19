import { App, PluginSettingTab } from "obsidian";
import TextGeneratorPlugin from "src/main";
import packageJson from "package.json";

import { createRoot } from "react-dom/client";
import React from "react";
import { GlobalProvider } from "../context/global";

import SectionsMain from "./sections";

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
    containerEl.addClass("gapper");

    // title
    containerEl.createEl("h1", {
      text: "Text Generator",
    });

    // tags
    containerEl
      .createDiv("el", (el) => {
        el.addClass("tags");
        el.createEl("a", {
          text: `Version ${packageJson.version}`,
          cls: "tag",
        });
        el.createEl("a", {
          text: "Discord \u{1F44B}",
          href: "https://bit.ly/Tg-discord",
          cls: "tag",
        });
        el.createEl("a", {
          text: " Documentation \u{1F4D6}",
          href: "https://bit.ly/tg_docs",
          cls: "tag",
        });
        el.createEl("a", {
          text: " Twitter \u{1F426}",
          href: "https://bit.ly/tg-twitter2",
          cls: "tag",
        });
        el.createEl("a", {
          text: " YouTube \u{1F3A5}",
          href: "https://bit.ly/tg-youtube2",
          cls: "tag",
        });
      })
      .addClass("pb-4");

    const el = containerEl.createDiv("div");

    const sections = createRoot(el);

    sections.render(
      <GlobalProvider plugin={this.plugin}>
        <SectionsMain />
      </GlobalProvider>
    );
  }
}

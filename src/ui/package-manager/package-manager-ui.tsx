import { App, Modal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import * as React from "react";
import { PackageManagerView } from "./package-manager-view";
import { createRoot } from "react-dom/client";
import { GlobalProvider } from "../context/global";

export class PackageManagerUI extends Modal {
  result: string | undefined;
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;
  root: any;

  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    onSubmit: (result: string) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
    this.modalEl.addClasses(["mod-settings", "mod-sidebar-layout"]);
  }

  async onOpen() {
    // this.containerEl.createEl("div", { cls: "plug-tg-packageManager" });
    this.root = createRoot(this.containerEl);
    this.root.render(
      <React.StrictMode>
        <GlobalProvider plugin={this.plugin}>
          <PackageManagerView parent={this} />,
        </GlobalProvider>
      </React.StrictMode>
    );
  }

  onClose() {
    this.root.unmount();
  }
}

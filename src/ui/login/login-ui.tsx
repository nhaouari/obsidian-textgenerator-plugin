import { App, Modal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import * as React from "react";
import { LoginView } from "./login-view";
import { createRoot } from "react-dom/client";
import { GlobalProvider } from "../context/global";

export class LoginUI extends Modal {
  result: string;
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;
  onReject: (error: any) => void;
  root: any;
  isClosed = false;

  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    onSubmit: (result: string) => void,
    onReject: (error: any) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
    this.onReject = onReject;
    this.modalEl.addClasses(["mod-settings", "mod-sidebar-layout"]);
  }

  async onOpen() {
    this.containerEl.createEl("div", { cls: "PackageManager" });
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <React.StrictMode>
        <GlobalProvider plugin={this.plugin}>
          <LoginView parent={this} />,
        </GlobalProvider>
      </React.StrictMode>
    );
  }

  onClose() {
    this.isClosed = true;
    this.root.unmount();
  }
}

import { App, Modal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import * as React from "react";
import GratitudeView from "./view";
import { createRoot } from "react-dom/client";
import { GlobalProvider } from "#/ui/context/global";

export default class GratitudeUI extends Modal {
  result: string = "";
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;
  onReject: (error: any) => void;
  root: any;
  isClosed = false;
  data: Record<string, string>;

  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    data: Record<string, string>,
    onSubmit: (result: string) => void,
    onReject: (error: any) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
    this.onReject = onReject;
    this.modalEl.addClasses(["mod-settings", "mod-sidebar-layout"]);
    this.data = data;
  }

  async onOpen() {
    this.root = createRoot(this.containerEl);
    this.root.render(
      <React.StrictMode>
        <GlobalProvider plugin={this.plugin}>
          <GratitudeView parent={this} data={this.data} />
        </GlobalProvider>
      </React.StrictMode>
    );
  }

  onClose() {
    this.isClosed = true;
    this.root.unmount();
  }
}

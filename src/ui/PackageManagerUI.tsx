import { App, Modal} from "obsidian";
import TextGeneratorPlugin from "src/main";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PackageManagerView } from "./PackageManagerView";
import { createRoot } from "react-dom/client";

export class PackageManagerUI extends Modal {
  result: string;
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;

  constructor(app: App, plugin:TextGeneratorPlugin,result:string, onSubmit: (result: string) => void) {
    super(app);
    this.plugin=plugin
    this.result=result;
    this.onSubmit = onSubmit;
    this.modalEl.addClasses(["mod-settings","mod-sidebar-layout"]);
  }

  async onOpen() {

      this.containerEl.createEl("div", {cls:"PackageManager"})
      const root = createRoot(this.containerEl.children[1]);
      
      root.render(
        <React.StrictMode>
          <PackageManagerView parent={this}/>,
        </React.StrictMode>
      );
  }

  onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
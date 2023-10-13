import { ItemView, Menu, ViewStateResult, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import Tool from "./tool";
import { Root, createRoot } from "react-dom/client";
import TextGeneratorPlugin from "../../main";
import Contexts from "../context";
import { trimBy } from "../../utils";
export const VIEW_TOOL_ID = "tool-view";

export class ToolView extends ItemView {
  root: Root;
  plugin: TextGeneratorPlugin;
  title: string;
  constructor(leaf: WorkspaceLeaf, plugin: TextGeneratorPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TOOL_ID;
  }

  getDisplayText() {
    return this.title || this.getState()?.title || "Tool view";
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    const self = this;
    this.root.render(
      <React.StrictMode>
        <Contexts plugin={this.plugin}>
          <Tool
            plugin={this.plugin}
            view={this}
            onEvent={(cb: (name: string) => void) => {
              self.onEvent = (name: string) => {
                cb(name);
              };
            }}
            setCommands={async (commands) => {
              console.log(this.plugin.commands?.commands, commands);
              this.plugin.commands.commands = trimBy(
                [...this.plugin.commands?.commands, ...commands],
                "id"
              );
              console.log(this.plugin.commands?.commands, commands);
              await this.plugin.packageManager.load();
            }}
          />
        </Contexts>
      </React.StrictMode>
    );
  }

  onPaneMenu(menu: Menu, source: any) {
    super.onPaneMenu(menu, source);
    menu
      .addSeparator()
      .addItem((item) =>
        item
          .setTitle("Pin")
          .setIcon("pin")
          .onClick(() => {
            this.onEvent("pin");
          })
      )
      .addItem((item) =>
        item
          .setTitle(
            this.isAlwaysOnTop() ? "Disable Always on top" : "Always On Top"
          )
          .setIcon("arrow-up-right")
          .onClick(() => {
            this.onEvent("OnTop");
          })
      )
      .addItem((item) =>
        item
          .setTitle("Popout")
          .setIcon("arrow-up-right")
          .onClick(() => {
            this.onEvent("popout");
          })
      )
      .addItem((item) =>
        item
          .setTitle("Source Template")
          .setIcon("file")
          .onClick(() => {
            this.onEvent("source");
          })
      );
  }

  // this is just a placeholder for the, do not put code here. edit the tool.tsx file to add more events
  onEvent(name: string) {}

  id?: string;
  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.setTemp(state, state.id);
    this.title = state.title || this.title;
    await super.setState(state, result);
  }

  getState(): any {
    const gotState = super.getState();

    const state = {
      ...this.getTemp(gotState.id),
      ...gotState,
    };

    this.title = state.title || this.title;

    return state;
  }

  getTemp(id?: string) {
    this.id = id || this.id;
    return this.plugin.temp[this.id ? `tool_${this.id}` : "tool"] || {};
  }

  setTemp(newdata: any, id?: string) {
    this.id = id || this.id;
    this.plugin.temp[this.id ? `tool_${this.id}` : "tool"] = newdata;
  }

  toggleAlwaysOnTop(bool?: boolean) {
    const win = require("electron").remote.BrowserWindow.getFocusedWindow();
    win.setAlwaysOnTop(bool ?? !win.isAlwaysOnTop());
    return win.isAlwaysOnTop();
  }

  isAlwaysOnTop() {
    const win = require("electron").remote.BrowserWindow.getFocusedWindow();
    return win.isAlwaysOnTop();
  }

  async onClose() {
    this.root.unmount();
  }
}

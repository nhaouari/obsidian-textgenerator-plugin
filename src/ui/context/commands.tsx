import TextGeneratorPlugin from "../../main";
import { Command, Editor } from "obsidian";
import { useEffect } from "react";
import { VIEW_TOOL_ID } from "../tool";

const k = (command: Command) =>
  ({
    async editorCallback(editor: Editor, ctx) {
      const self: TextGeneratorPlugin = this.plugin;
      try {
        if (!ctx.app.workspace.getLeavesOfType(VIEW_TOOL_ID).length) {
          console.log("reloading happening");
          self.activateView(VIEW_TOOL_ID);
          await new Promise((s) => setTimeout(s, 1000));
        }

        window.dispatchEvent(new Event(command.id || ""));
      } catch (error) {
        self.handelError(error);
      }
    },
    ...command,
  }) as Command;

export default function useCommandsHandler(cb: (command: cmd) => void) {
  useEffect(() => {
    const events = Object.keys(commands) as cmd[];

    const listeners = events.map((event) => {
      const cb2 = () => {
        cb(event);
      };

      return {
        add: () => {
          window.addEventListener(event, cb2);
        },
        remove: () => {
          window.removeEventListener(event, cb2);
        },
      };
    });

    listeners.forEach((event) => {
      event.add();
    });

    return () => {
      listeners.forEach((event) => {
        event.remove();
      });
    };
  }, []);
}

export const commands = {
  "open-tool": k({
    id: "open-tool",
    name: "Open tool",
    icon: "GENERATE_ICON",
    // hotkeys: [{ modifiers: ["Mod"], key: "j" }],
  }),
} as const;

export const chatCommands = Object.values(commands);

export type cmd = keyof typeof commands;

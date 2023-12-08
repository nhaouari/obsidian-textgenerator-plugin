import type { View } from "obsidian";
import MarkdownManager from "./md"
import ExcalidrawManager from "./ea"
import CanvasManager from "./canvas"
import { ContentManager, Options } from "./types";
import TextGeneratorPlugin from "#/main";
export default class ContentManagerCls {
    static compile(view: View, plugin: TextGeneratorPlugin): ContentManager {
        const type = view.getViewType();

        const options: Options = {
            wrapInBlockQuote: plugin.settings.outputToBlockQuote
        }

        switch (type) {
            case "markdown":
                const editor = view.app.workspace.activeEditor?.editor;
                if (!editor) throw "couldn't find the editor fsr";
                return new MarkdownManager(editor, view, options);

            case "excalidraw":
                // @ts-ignore
                const ea = view.app.plugins?.plugins["obsidian-excalidraw-plugin"]?.ea;
                if (!ea) throw "couldn't find the Escalidraw plugin fsr";
                ea.setView(view);
                ea.clear();
                return new ExcalidrawManager(ea, view);
            case "canvas":
                // @ts-ignore
                if (!view.canvas) throw "couldn't find the canvas plugin fsr";
                // @ts-ignore
                return new CanvasManager(view.canvas, view);
            default:
                throw `The content ${type} is not supported`;
        }
    }
}
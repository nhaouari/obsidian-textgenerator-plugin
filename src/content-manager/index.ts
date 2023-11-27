import type { View } from "obsidian";
import MarkdownManager from "./md"
import ExcalidrawManager from "./ea"
import CanvasManager from "./canvas"
import { ContentManager } from "./types";
export default class ContentManagerCls {
    static compile(view: View): ContentManager {
        const type = view.getViewType();


        switch (type) {
            case "markdown":
                const editor = view.app.workspace.activeEditor?.editor;
                if (!editor) throw "couldn't find the editor fsr";
                return new MarkdownManager(editor);

            case "excalidraw":
                // @ts-ignore
                const ea = view.app.plugins?.plugins["obsidian-excalidraw-plugin"]?.ea;
                if (!ea) throw "couldn't find the Escalidraw plugin fsr";
                ea.setView(view);
                ea.clear();
                return new ExcalidrawManager(ea);
            case "canvas":
                // @ts-ignore
                if (!view.canvas) throw "couldn't find the canvas plugin fsr";
                // @ts-ignore
                return new CanvasManager(view.canvas);
            default:
                throw `The content ${type} is not supported`;
        }
    }
}
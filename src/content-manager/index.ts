import type { View } from "obsidian";
import MarkdownManager from "./md"
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
                // TODO: do it later
                throw "Not implemented (excalidraw viewType)";
            case "canvas":
                // TODO: do it later
                throw "Not implemented (canvas viewType)";
            default:
                throw `The provided("${type}") content is not supported`;
        }
    }
}
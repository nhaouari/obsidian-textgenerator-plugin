import { Editor } from "obsidian";
import MarkdownManager from "./md"
import { ContentManager } from "./types";
export default class ContentManagerCls {
    static compile(props: {
        filePath?: string;
        editor?: Editor;
    }): ContentManager {
        switch (true) {
            case !!props.editor:
                return new MarkdownManager(props.editor as any);

            default:
                throw Error("contentManager couldn't detect the provided content")
        }
    }
}
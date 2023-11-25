import { Editor, EditorPosition } from "obsidian";
import { ContentManager, Mode } from "./types";

export default class MarkdownManager implements ContentManager {
    editor: Editor;

    constructor(editor: Editor) {
        this.editor = editor;
    }

    listSelections(): { anchor: { ch: number; line: number; }; head: { ch: number; line: number; }; }[] {
        return this.editor.listSelections();
    }

    getValue(): string {
        return this.editor.getValue();
    }

    getCursor(pos?: "from" | "to" | undefined): { ch: number; line: number; } {
        return this.editor.getCursor(pos);
    }

    getCursor2(mode?: Mode) {
        return this.editor.getCursor(mode == "replace" ? "from" : "to")
    }

    getLine(line: number): string {
        return this.editor.getLine(line);
    }

    getRange(from: { ch: number; line: number; }, to: { ch: number; line: number; }): string {
        return this.editor.getRange(from, to)
    }

    getSelection(): string {
        return this.editor.getSelection();
    }


    setSelections(poses: { anchor: { ch: number; line: number; }; head: { ch: number; line: number; }; }[]): void {
        return this.editor.setSelections(poses);
    }

    protected replaceRange(str: string, startingPos: { ch: number; line: number; }, endPos?: { ch: number; line: number; } | undefined): void {
        return this.editor.replaceRange(str, startingPos, endPos);

    }

    protected replaceSelection(str: string): void {
        return this.editor.replaceSelection(str);
    }

    setCursor(pos: { ch: number; line: number; }): void {
        return this.editor.setCursor(pos);
    }


    insertText(text: string, cur: EditorPosition, mode?: Mode) {
        let cursor = cur || this.getCursor2(mode);

        // if (mode !== "stream") {
        // 	 text = this.plugin.settings.prefix.replace(/\\n/g, "\n") + text;
        // }

        if (this.listSelections().length > 0) {
            const anchor = this.listSelections()[0].anchor;
            const head = this.listSelections()[0].head;
            if (
                anchor.line > head.line ||
                (anchor.line === head.line && anchor.ch > head.ch)
            ) {
                cursor = this.listSelections()[0].anchor;
            }
        }

        switch (mode) {
            case "replace":
                this.replaceSelection(text);
                break;

            case "insert":
            case "stream":
            default:
                this.replaceRange(text,
                    {
                        ch: cursor.ch,
                        line: cursor.line
                    }
                );
                break;
        }
    }

    insertStream(pos: { ch: number; line: number; }, mode?: "insert" | "replace"): {
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    } {
        const startingCursor = pos || this.getCursor2(mode);

        const cursor: typeof startingCursor = {
            ch: startingCursor.ch,
            line: startingCursor.line,
        };

        let postingContent = "";
        let stillPlaying = true;
        let firstTime = true;

        const writerTimer: any = setInterval(() => {
            if (!stillPlaying) return clearInterval(writerTimer);
            const posting = postingContent;
            if (!posting) return;

            if (firstTime) this.insertText(posting, cursor, mode);
            else this.insertText(posting, cursor, "stream");

            postingContent = postingContent.substring(posting.length);
            firstTime = false;

            cursor.ch += posting.length;

            // if (!this.plugin.settings.freeCursorOnStreaming)
            //     this.setCursor(cursor);
        }, 400);

        return {
            insert(newInsertData: string) {
                postingContent += newInsertData
            },
            end() {
                stillPlaying = false;
            },

            replaceAllWith: async (allText) => {
                this.replaceRange(
                    mode == "replace" ? allText : "",
                    startingCursor,
                    cursor
                );

                if (mode !== "replace")
                    this.insertText(allText, startingCursor, mode);

                console.log("replacing starting cursor")
                const nc = {
                    ch: startingCursor.ch + allText.length,
                    line: startingCursor.line,
                };

                this.replaceRange("", startingCursor, nc);

                await new Promise((s) => setTimeout(s, 500));

                this.insertText(allText, startingCursor, "insert");

                console.log(allText)

                // here we can do some selecting magic
                // editor.setSelection(startingCursor, cursor)

                this.setCursor(nc);
            }
        }
    }
}
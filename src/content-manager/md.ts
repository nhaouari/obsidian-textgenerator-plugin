import { Editor, EditorPosition, TFile, View } from "obsidian";
import { ContentManager, Mode } from "./types";
import { minPos, maxPos } from "./utils"
import { removeYAML } from "../utils";
export default class MarkdownManager implements ContentManager {
    editor: Editor;
    view: View;

    constructor(editor: Editor, view: View) {
        this.editor = editor;
        this.view = view;
    }

    async getSelections(): Promise<string[]> {
        return this.editor.listSelections().map((r) => this.editor.getRange(minPos(r.anchor, r.head), maxPos(r.anchor, r.head)))
            .filter((text) => text.length > 0)
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

    async getSelection(): Promise<string> {
        return this.editor.getSelection();
    }

    protected setSelections(poses: { anchor: { ch: number; line: number; }; head: { ch: number; line: number; }; }[]): void {
        return this.editor.setSelections(poses);
    }

    protected replaceRange(str: string, startingPos: { ch: number; line: number; }, endPos?: { ch: number; line: number; } | undefined): void {
        return this.editor.replaceRange(str, startingPos, endPos);
    }

    protected replaceSelection(str: string): void {
        return this.editor.replaceSelection(str);
    }

    protected getTgSelectionRange(tgSelectionLimiter?: string) {
        const fromTo = {
            from: this.editor.getCursor("from"),
            to: this.editor.getCursor("to"),
        };

        const selectedText = this.editor.getSelection().trimStart();

        if (selectedText.length !== 0) return fromTo;

        const lineNumber = this.editor.getCursor().line;
        const line = this.editor.getLine(lineNumber).trimStart();

        if (line.length === 0) {
            fromTo.from = {
                ch: 0,
                line: 0,
            };
            fromTo.to = this.editor.getCursor("from");
        } else {
            fromTo.from = {
                ch: 0,
                line: lineNumber,
            };

            fromTo.to = this.editor.getCursor("to");
        }


        if (!tgSelectionLimiter) return fromTo;

        const reg = new RegExp(tgSelectionLimiter, "i")
        const lastLimiterIndex = this.editor.getRange(fromTo.from, fromTo.to).split("\n").findLastIndex(d => reg.test(d))

        if (lastLimiterIndex != -1) {
            fromTo.from = {
                ch: 0,
                line: fromTo.from.line > lastLimiterIndex + 1 ? fromTo.from.line : lastLimiterIndex + 1
            }
        }

        return fromTo;
    }

    // DO NOT TURN THIS INTO AN ASYNC FUNCTION, it will break auto suggest
    getTgSelection(tgSelectionLimiter?: string) {
        const range = this.getTgSelectionRange(tgSelectionLimiter);
        let selectedText = this.editor.getRange(range.from, range.to);
        return removeYAML(selectedText);
    }

    selectTgSelection(tgSelectionLimiter?: string) {
        const selectedRange = this.getTgSelectionRange(tgSelectionLimiter);
        const currentSelections = this.editor.listSelections();

        this.editor.setSelections(
            currentSelections.length > 1
                ? currentSelections
                : [
                    {
                        anchor: selectedRange.from,
                        head: selectedRange.to,
                    },
                ]
        );
    }

    getLastLetterBeforeCursor(): string {
        // incase of simple generation
        const startingCursor = this.editor.getCursor("from")

        return this.editor.getRange(
            {
                ch: startingCursor.ch - 1,
                line: startingCursor.line,
            },
            startingCursor
        );
    }


    setCursor(pos: { ch: number; line: number; }): void {
        return this.editor.setCursor(pos);
    }

    async insertText(text: string, cur: EditorPosition, mode?: Mode) {
        let cursor = cur || this.getCursor2(mode);

        // if (mode !== "stream") {
        // 	 text = this.plugin.settings.prefix.replace(/\\n/g, "\n") + text;
        // }

        if (this.editor.listSelections().length > 0) {
            const anchor = this.editor.listSelections()[0].anchor;
            const head = this.editor.listSelections()[0].head;
            if (
                anchor.line > head.line ||
                (anchor.line === head.line && anchor.ch > head.ch)
            ) {
                cursor = this.editor.listSelections()[0].anchor;
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

    async insertStream(pos: { ch: number; line: number; }, mode?: "insert" | "replace"): Promise<{
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    }> {
        const startingCursor = pos || this.getCursor2(mode);

        const cursor: typeof startingCursor = {
            ch: startingCursor.ch,
            line: startingCursor.line,
        };

        let postingContent = "";
        let stillPlaying = true;
        let firstTime = true;

        const writerTimer: any = setInterval(async () => {
            if (!stillPlaying) return clearInterval(writerTimer);
            const posting = postingContent;
            if (!posting) return;

            if (firstTime) await this.insertText(posting, cursor, mode);
            else await this.insertText(posting, cursor, "stream");

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
                    await this.insertText(allText, startingCursor, mode);

                const nc = {
                    ch: startingCursor.ch + allText.length,
                    line: startingCursor.line,
                };

                this.replaceRange("", startingCursor, nc);

                await new Promise((s) => setTimeout(s, 500));

                await this.insertText(allText, startingCursor, "insert");

                console.log(allText)

                // here we can do some selecting magic
                // editor.setSelection(startingCursor, cursor)

                this.setCursor(nc);
            }
        }
    }

    getActiveFile(): TFile {
        return this.view.app.workspace.activeEditor?.file as TFile;
    }
}



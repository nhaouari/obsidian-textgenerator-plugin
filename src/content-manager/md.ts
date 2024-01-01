import { Editor, EditorPosition, TFile, View } from "obsidian";
import { ContentManager, Mode, Options } from "./types";
import { minPos, maxPos } from "./utils"
import { removeYAML } from "../utils";
export default class MarkdownManager implements ContentManager {
    editor: Editor;
    view: View;
    options: Options;

    constructor(editor: Editor, view: View, options: Options) {
        this.editor = editor;
        this.view = view;
        this.options = options;
    }

    getCurrentLine(): string {
        return this.editor.getLine(this.editor.getCursor("from").line)
    }

    async getRange(from?: any, to?: any) {
        let TO = to;

        if (!TO) {
            const lastLine = this.editor.lastLine()
            TO = {
                ch: this.editor.getLine(lastLine).length,
                line: lastLine
            }
        }

        return this.editor.getRange(from || {
            ch: 0,
            line: 0
        }, TO)
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

    protected wrapInBlockQuote(text: string) {
        let lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "" && line !== ">");

        lines = lines
            .map((line, index) => {
                if (line.includes("[!ai]+ AI")) {
                    return ">";
                }

                return line.startsWith(">") ? line : "> " + line;
            })
            .filter((line) => line !== "");

        return "\n> [!ai]+ AI\n>\n" + lines.join("\n").trim() + "\n\n";
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

        if (line.trim().length <= 5
            || line.trim() == "-"
            || line.trim() == "- [ ]"
        ) {
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
        const selectedText = this.editor.getRange(range.from, range.to);
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
                console.log({
                    cursor
                })
                if (this.options.wrapInBlockQuote)
                    text = this.wrapInBlockQuote(text)

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
                if (this.options.wrapInBlockQuote)
                    allText = this.wrapInBlockQuote(allText)


                this.replaceRange(
                    "",
                    startingCursor,
                    cursor
                );

                const nc = {
                    ch: startingCursor.ch + allText.length,
                    line: startingCursor.line + allText.split("\n").length,
                };


                await this.insertText(allText, startingCursor, mode);

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



import { TFile } from "obsidian";

export type Mode = "insert" | "stream" | "replace"

export type EditorPosition = {
    ch: number;
    line: number;
}

export interface ContentManager {
    getValue(): Promise<string> | string;

    getSelection(): Promise<string>;
    getSelections(): Promise<string[]>

    getLastLetterBeforeCursor(): string;

    getTgSelection(tgSelectionLimiter?: string): Promise<string> | string;

    selectTgSelection(tgSelectionLimiter?: string): void;

    getCursor(pos?: "from" | "to"): any;

    setCursor(pos: any): void;

    getActiveFile(): Promise<TFile> | TFile | undefined;

    // replaceRange(str: string, startingPos: EditorPosition, endPos?: EditorPosition): void;

    // replaceSelection(str: string): void;

    insertText(data: string, pos: any, mode?: Mode): Promise<any>;

    insertStream(pos: any, mode?: Mode): Promise<{
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    }>;
}

export type Mode = "insert" | "stream" | "replace"

export type EditorPosition = {
    ch: number;
    line: number;
}

export interface ContentManager {
    getValue(): string;
    getSelection(): string;

    getSelections(): string[]

    getLastLetterBeforeCursor(): string;

    getTgSelection(tgSelectionLimiter?: string): string

    selectTgSelection(tgSelectionLimiter?: string): void;

    getCursor(pos?: "from" | "to"): EditorPosition;

    setCursor(pos: EditorPosition): void;

    // replaceRange(str: string, startingPos: EditorPosition, endPos?: EditorPosition): void;

    // replaceSelection(str: string): void;

    insertText(data: string, pos: EditorPosition, mode?: Mode): void;

    insertStream(pos: EditorPosition): {
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    };
}
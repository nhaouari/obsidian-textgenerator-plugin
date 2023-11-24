
export type Mode = "insert" | "stream" | "replace"

type EditorPosition = {
    ch: number;
    line: number;
}

type EditorPositionAnchorHead = {
    anchor: EditorPosition;
    head: EditorPosition;
}

export interface ContentManager {
    getValue(): string;
    getSelection(): string;
    setSelections(poses: EditorPositionAnchorHead[]): void;
    listSelections(): EditorPositionAnchorHead[];

    getLine(line: number): string;

    getRange(from: EditorPosition, to: EditorPosition): string;

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
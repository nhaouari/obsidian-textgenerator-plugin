
import type { EditorPosition } from "./types";

export function minPos(...pos: EditorPosition[]) {
    const sortedPositions = sortMinPos(...pos);
    return sortedPositions[0];
}

export function maxPos(...pos: EditorPosition[]) {
    const sortedPositions = sortMinPos(...pos);
    return sortedPositions[sortedPositions.length - 1];
}

export function sortMinPos(...pos: EditorPosition[]) {
    return pos.sort((p1, p2) => {
        if (p1.line !== p2.line) {
            return p1.line - p2.line;
        } else {
            return p1.ch - p2.ch;
        }
    });
}
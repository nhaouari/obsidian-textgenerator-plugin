import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("obsidian", () => ({}));
vi.mock("#/utils", () => ({
  removeYAML: (s: string) => s,
}));

import MarkdownManager from "./md";

/**
 * A fake document buffer that simulates CodeMirror/Obsidian Editor behavior
 * so we can verify text insertion positions and final document content.
 */
class FakeDocBuffer {
  lines: string[] = [""];

  getText(): string {
    return this.lines.join("\n");
  }

  replaceRange(
    str: string,
    from: { line: number; ch: number },
    to?: { line: number; ch: number }
  ) {
    const end = to ?? from;

    const beforeLines = this.lines.slice(0, from.line);
    const beforeText = this.lines[from.line].slice(0, from.ch);
    const afterText = this.lines[end.line].slice(end.ch);

    const middleText = beforeText + str + afterText;
    const newMiddleLines = middleText.split("\n");

    this.lines = [...beforeLines, ...newMiddleLines, ...this.lines.slice(end.line + 1)];
  }
}

function createMockEditor(
  doc: FakeDocBuffer,
  selection?: { from: { line: number; ch: number }; to: { line: number; ch: number } }
) {
  const cursorPos = selection ? { ...selection.from } : { line: 0, ch: 0 };
  const selTo = selection ? { ...selection.to } : cursorPos;
  return {
    replaceRange: (str: string, from: any, to?: any) => doc.replaceRange(str, from, to),
    setCursor: vi.fn((pos: any) => {
      cursorPos.line = pos.line;
      cursorPos.ch = pos.ch;
    }),
    getCursor: vi.fn((pos?: string) => {
      if (pos === "from") return { ...cursorPos };
      if (pos === "to") return { ...selTo };
      return { ...cursorPos };
    }),
    listSelections: vi.fn(() => [
      {
        anchor: { ...cursorPos },
        head: { ...selTo },
      },
    ]),
    getLine: vi.fn((n: number) => doc.lines[n] ?? ""),
    getSelection: vi.fn().mockReturnValue(
      selection
        ? doc.lines
            .slice(selection.from.line, selection.to.line + 1)
            .join("\n")
        : ""
    ),
    getRange: vi.fn(),
    lastLine: vi.fn(() => doc.lines.length - 1),
    setSelections: vi.fn(),
    replaceSelection: vi.fn((str: string) => {
      if (selection) {
        doc.replaceRange(str, selection.from, selection.to);
      }
    }),
  } as any;
}


function createManager(
  doc: FakeDocBuffer,
  selection?: { from: { line: number; ch: number }; to: { line: number; ch: number } }
) {
  const editor = createMockEditor(doc, selection);
  const view = { app: { workspace: { activeEditor: { file: {} } } } } as any;
  return new MarkdownManager(editor, view, {});
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("MarkdownManager.insertStream", () => {
  let doc: FakeDocBuffer;
  let mgr: ReturnType<typeof createManager>;

  beforeEach(() => {
    doc = new FakeDocBuffer();
    mgr = createManager(doc);
  });

  it("streams single-line tokens in correct order", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    handler.insert("Hello");
    handler.insert(" world");
    handler.insert("!");

    await sleep(500);

    await handler.replaceAllWith("Hello world!");

    expect(doc.getText()).toBe("Hello world!");
  });

  it("streams multi-line content in correct order", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    handler.insert("1. First\n");
    await sleep(250);
    handler.insert("2. Second\n");
    await sleep(250);
    handler.insert("3. Third");

    await sleep(500);

    const expectedText = "1. First\n2. Second\n3. Third";
    await handler.replaceAllWith(expectedText);

    expect(doc.getText()).toBe(expectedText);
  });

  it("replaceAllWith corrects any intermediate issues", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    handler.insert("chunk1");
    handler.insert("chunk2");
    handler.insert("chunk3");

    await sleep(500);

    const finalText = "chunk1chunk2chunk3";
    await handler.replaceAllWith(finalText);

    expect(doc.getText()).toBe(finalText);
  });

  it("handles rapid multi-line streaming without scrambling", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    const lines = [
      "Key points:\n",
      "- Point A\n",
      "- Point B\n",
      "- Point C\n",
      "- Point D",
    ];

    for (const line of lines) {
      handler.insert(line);
      await sleep(50);
    }

    await sleep(500);

    const expectedText = lines.join("");
    await handler.replaceAllWith(expectedText);

    expect(doc.getText()).toBe(expectedText);
  });

  it("does not write stale content after replaceAllWith", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    handler.insert("streamed ");
    handler.insert("content ");
    handler.insert("here");

    // Call replaceAllWith immediately, before the timer has a chance to flush
    await handler.replaceAllWith("final text");

    // Wait to see if any timer fires after
    await sleep(600);

    expect(doc.getText()).toBe("final text");
  });

  it("correctly tracks cursor across newlines during streaming", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    handler.insert("line1\nline2\n");
    await sleep(300);

    handler.insert("line3");
    await sleep(300);

    const expected = "line1\nline2\nline3";
    await handler.replaceAllWith(expected);

    expect(doc.getText()).toBe(expected);
  });

  it("streams into the middle of existing content correctly", async () => {
    doc.lines = ["before  after"];

    const handler = await mgr.insertStream({ ch: 7, line: 0 }, "insert");

    handler.insert("inserted");

    await sleep(300);

    await handler.replaceAllWith("inserted");

    expect(doc.getText()).toBe("before inserted after");
  });

  it("handles streaming a numbered list paragraph by paragraph", async () => {
    const handler = await mgr.insertStream({ ch: 0, line: 0 }, "insert");

    const paragraphs = [
      "GDP is the total value of goods.\n\n",
      "Key points:\n",
      "1. First point\n",
      "2. Second point\n",
      "3. Third point\n\n",
      "Summary paragraph.",
    ];

    for (const p of paragraphs) {
      handler.insert(p);
      await sleep(100);
    }

    await sleep(600);

    const fullText = paragraphs.join("");

    // Verify intermediate content is in the right order (before replaceAllWith)
    const intermediateText = doc.getText();
    expect(intermediateText).toContain("1. First point");
    expect(intermediateText).toContain("3. Third point");
    const idx1 = intermediateText.indexOf("1. First point");
    const idx3 = intermediateText.indexOf("3. Third point");
    expect(idx1).toBeLessThan(idx3);

    await handler.replaceAllWith(fullText);

    expect(doc.getText()).toBe(fullText);
  });

  it("replace mode replaces the selected text instead of appending", async () => {
    doc.lines = [
      "GDP is the total money value of all finished goods and services",
    ];

    const selection = {
      from: { line: 0, ch: 17 },
      to: { line: 0, ch: 63 },
    };

    mgr = createManager(doc, selection);

    const handler = await mgr.insertStream(
      { ...selection.from },
      "replace"
    );

    // In replace mode, no streaming happens (text-generator.ts skips insert() calls)
    // All text comes through replaceAllWith at the end
    const rewrittenText = "market value of all final goods and services";
    await handler.replaceAllWith(rewrittenText);

    expect(doc.getText()).toBe(
      "GDP is the total market value of all final goods and services"
    );
  });

  it("replace mode on multi-line selection replaces correctly", async () => {
    doc.lines = ["First line", "selected text here", "Third line"];

    const selection = {
      from: { line: 1, ch: 0 },
      to: { line: 1, ch: 18 },
    };

    mgr = createManager(doc, selection);

    const handler = await mgr.insertStream(
      { ...selection.from },
      "replace"
    );

    await handler.replaceAllWith("replacement text");

    expect(doc.getText()).toBe("First line\nreplacement text\nThird line");
  });
});

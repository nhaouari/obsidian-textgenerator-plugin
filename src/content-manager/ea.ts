import { TFile, View } from "obsidian";
import { ContentManager, Mode } from "./types";

type Item = any;
export default class ExcalidrawManager implements ContentManager {
    ea: any;
    view: View;

    constructor(ea: any, view: View) {
        this.ea = ea;
        this.view = view;
    }

    protected async getTextSelectedItems(): Promise<Item[]> {
        return this.ea.getViewSelectedElements().sort((a: any, b: any) => a.y + a.height - b.y + b.height).filter((e: Item) => !e.isDeleted && !!e.rawText);
    }

    protected getElement(id: string): Item {
        const items = [...this.ea.getViewElements(), ...this.ea.getElements()];
        return items.find((e: Item) => e.id == id);
    }

    async getSelections(): Promise<string[]> {
        return (await this.getTextSelectedItems()).map(e => e.rawText);
    }

    getValue(): string {
        return this.ea.getViewElements().map((e: Item) => e.rawText).filter(Boolean).join("\n");
    }

    async getSelection(): Promise<string> {
        return (await this.getSelections())[0]
    }

    async getTgSelection(tgSelectionLimiter?: string) {
        return (await this.getSelections()).join("\n");
    }

    selectTgSelection(tgSelectionLimiter?: string) {
        let txt = this.ea.getViewSelectedElements().map((e: Item) => e.rawText).filter(Boolean).join("\n").trim();

        if (!txt?.length) {
            txt = this.ea.getValue();
        }

        return txt;
    }

    getLastLetterBeforeCursor(): string {
        return ""
    }

    async getCursor(dir?: "from" | "to" | undefined): Promise<Item> {
        // get first or last item
        const items = await this.getTextSelectedItems();
        return items[dir == "from" ? 0 : items.length - 1];
    }

    setCursor(pos: Item | Item[]): void {
        let arr = [];

        if (pos)
            if (Array.isArray(pos))
                arr = pos;
            else
                arr.push(pos);

        this.ea.selectElementsInView(arr)
        return;
    }

    async insertText(text: string, pos: Item, mode?: Mode): Promise<Item> {
        const items = await this.getTextSelectedItems();
        let selectedItem = pos || this.getCursor();
        let itemId = selectedItem?.id;

        switch (mode) {
            case "replace":
                // remove selected items(text)
                this.ea.deleteViewElements([...items, selectedItem])

                // add item
                selectedItem = itemId = undefined;
                break;

            case "insert":
                // add item
                selectedItem = itemId = undefined;
                break;
        }

        let item = this.getElement(itemId) || selectedItem;

        if (pos) {
            if (pos.strokeColor)
                this.ea.style.strokeColor = pos.strokeColor;
            if (pos.fontSize)
                this.ea.style.fontSize = pos.fontSize;
            if (pos.fontFamily)
                this.ea.style.fontFamily = pos.fontFamily;
        }

        if (!item) {
            const textSize: { width: number, height: number } = this.ea.measureText(text);

            itemId = this.ea.addText(
                pos.x,
                pos.y,
                text,
                {
                    wrapAt: 5,
                    ...pos,
                    id: undefined,
                    box: pos?.type
                        ? {
                            width: Math.min(textSize.width + 2, Math.max((this.ea.style.fontSize) * 20, 200)),
                            boxPadding: 0
                        }
                        : { boxPadding: 2 }
                }
            );


            await this.ea.addElementsToView(false, false);
            // this.ea.clear();

            item = this.getElement(itemId);

            // console.log(item, this.ea.refreshTextElementSize(itemId))

            // await this.ea.addElementsToView(false, false);
            // this.ea.clear();
        }

        if (item) {
            if (item.strokeColor)
                this.ea.style.strokeColor = item.strokeColor;
            if (item.fontSize)
                this.ea.style.fontSize = item.fontSize;
            if (item.fontFamily)
                this.ea.style.fontFamily = item.fontFamily;
        }


        let elements = [item];

        let textSize: { width: number, height: number }
            = this.ea.measureText((elements[0]?.text || "") + text);

        elements.forEach((el) => {
            el.text = el.rawText = (el?.text || "") + text;
            if (pos) {
                el.x = pos.x;
                el.width = Math.min(textSize.width + 10, Math.max((this.ea.style.fontSize) * 20, 200));
                el.height = textSize.height;
            } else {
                el.width = textSize.width;
            }
        });

        await this.ea.addElementsToView(false, false);
        await this.ea.targetView?.forceSave(true);
        this.ea.clear();

        elements[0] = this.getElement(itemId);

        textSize = this.ea.measureText((elements[0]?.text || "") + text);

        elements.forEach((el) => {
            if (pos)
                el.y = (pos.y + pos.height + textSize.height) || el.y;
        });

        elements[0] = this.getElement(itemId);

        await this.ea.copyViewElementsToEAforEditing(elements);
        await this.ea.addElementsToView(false, false);
        await this.ea.targetView?.forceSave(true);
        this.ea.clear();

        return item;
    }

    async insertStream(pos: Item, mode?: "insert" | "replace"): Promise<{
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    }> {
        const items = await this.getTextSelectedItems();
        let selectedItem = (
            items.length ?
                items
                : this.ea.getViewElements().map((e: Item) => e.rawText).filter(Boolean)
        )[items.length - 1]

        // if (!selectedItem) throw "no selected items";

        // create a new item
        const startingCursor = pos;

        let cursor: any;


        let postingContent = "";
        let stillPlaying = true;

        // const testData = [
        //     `Excalidraw is known for its hand-drawn feel and ease of use when creating diagrams or sketches that can be shared digitally or included in various documents.`,
        //     `If you need assistance with something specific regarding an Excalidraw file, such as understanding how to open it, share it, or if you have questions about using the tool itself, feel free to ask!`,
        //     `And then you ended with "hello world," which is often used as a test phrase in computing—one of the simplest programs one can write when learning programming outputs this message to ensure everything's set up correctly.d`,
        //     `test`,
        //     `If this was not what you intended to inquire about though and I've misunderstood your query somehow, please provide some more details so I can assist appropriately!`
        // ]

        // let lastPos = selectedItem;
        // let arr = [];
        // for (const section of testData) {
        //     const item = await this.insertText(section, lastPos, mode)
        //     await new Promise((s) => setTimeout(s, 500));
        //     lastPos = item;
        //     arr.push(item)
        // }

        // await new Promise((s) => setTimeout(s, 500));


        // this.ea.deleteViewElements(arr)

        // this.ea.addElementsToView(false, false);

        // await this.ea.targetView?.forceSave(true);

        // throw "testing";



        // const writerTimer: any = setInterval(() => {
        //     if (!stillPlaying) return clearInterval(writerTimer);
        //     const posting = postingContent;
        //     if (!posting) return;

        //     console.log({
        //         firstTime, mode, pos, posting, cursor
        //     })
        //     if (firstTime) cursor = await this.insertText(posting, pos, mode) || cursor;
        //     else cursor = await this.insertText(posting, cursor, "stream");

        //     postingContent = postingContent.substring(posting.length);
        //     firstTime = false;

        //     cursor.ch += posting.length;

        //     // if (!this.plugin.settings.freeCursorOnStreaming)
        //     //     this.setCursor(cursor);
        // }, 1000);

        return {
            insert(newInsertData: string) {
                postingContent += newInsertData
            },
            end() {
                stillPlaying = false;
            },

            replaceAllWith: async (allText) => {
                const sections = allText.split("\n").filter(t => t.trim());
                let lastPos = pos || this.getCursor("to");
                let arr: Item[] = []
                for (const section of sections) {
                    const item = await this.insertText(section, lastPos, mode)

                    if (item) {
                        lastPos = item;
                    }

                    await new Promise((s) => setTimeout(s, 300))

                    // this.insertText(allText, startingCursor, "replace");
                }
                this.setCursor(arr);
            }
        }
    }

    getActiveFile(): TFile {
        return this.ea.targetView.file;
    }
}



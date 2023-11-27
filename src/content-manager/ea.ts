import { ContentManager, Mode } from "./types";

type Item = any;
export default class ExcalidrawManager implements ContentManager {
    ea: any;

    constructor(ea: any) {
        this.ea = ea;
    }

    protected async getTextSelectedItems(): Promise<Item[]> {
        return this.ea.getViewSelectedElements().sort((a: any, b: any) => a.y - b.y).filter((e: Item) => !e.isDeleted && !!e.rawText);
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
        return;
    }

    getLastLetterBeforeCursor(): string {
        return ""
    }

    async getCursor(dir?: "from" | "to" | undefined): Promise<Item> {
        // get first or last item
        const items = await this.getTextSelectedItems();
        return items[dir == "from" ? 0 : items.length - 1];
    }

    setCursor(pos: Item): void {
        // this.ea.viewZoomToElements([pos], [pos])
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

        let item = this.ea.getElement(itemId) || selectedItem;

        if (!item) {
            console.log("called create new item", { itemId, selectedItem, item });

            if (pos) {
                this.ea.style.strokeColor = pos.strokeColor;
                this.ea.style.fontSize = pos.fontSize;
                this.ea.style.fontFamily = pos.fontFamily;
            }

            const textSize: { width: number, height: number } = this.ea.measureText(text);

            itemId = this.ea.addText(
                item?.x - textSize.width / 2 - 2,
                item?.y - textSize.height,
                text,
                {
                    wrapAt: 5,
                    ...item,
                    id: undefined,
                    box: pos?.type
                        ? { width: Math.min(textSize.width, pos.width * 2), boxPadding: 0 }
                        : { boxPadding: 2 }
                }
            );
            item = this.ea.getElement(itemId);
            if (pos) {
                item.x = pos.x;
                item.y = pos.y + pos.height;
            }
        }

        const elements = [item];
        const textSize: { width: number, height: number } = this.ea.measureText(text);

        elements.forEach((el) => {
            el.text = el.rawText = el?.text + text;
            if (pos)
                el.width = Math.min(textSize.width, pos.fontSize * 16);
            el.height = textSize.height;
        });

        this.ea.copyViewElementsToEAforEditing(elements);
        this.ea.addElementsToView(false, false);

        this.ea.clear();

        return item;
    }

    async insertStream(pos: Item, mode?: "insert" | "replace"): Promise<{
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    }> {
        const items = await this.getTextSelectedItems();
        let selectedItem = items[items.length - 1]

        // create a new item
        const startingCursor = pos;

        let cursor: any;


        let postingContent = "";
        let stillPlaying = true;
        let firstTime = true;

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
                const item = await this.insertText(allText, pos, mode)
                this.setCursor(item);
                // this.insertText(allText, startingCursor, "replace");
            }
        }
    }
}



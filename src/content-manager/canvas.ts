import { ContentManager, Mode } from "./types";




type Item = CanvasNode & { rawText?: string } | undefined;
export default class CanvasManager implements ContentManager {
    canvas: Canvas;
    view: View;

    constructor(canvas: Canvas, view: View) {
        this.canvas = canvas;
        this.view = view;
    }

    protected async updateNode(id: string, nodeData?: Partial<AllCanvasNodeData>) {
        await this.canvas.requestFrame()
        const node = this.canvas.nodes.get(id);

        if (!node) return;

        for (const prop in nodeData) {
            if (Object.prototype.hasOwnProperty.call(nodeData, prop)) {
                // @ts-ignore
                node[prop] = nodeData[prop] as any;
            }
        }
        await this.canvas.requestFrame()
        await this.canvas.requestSave()
    }


    protected createNewNode(parentNode: CanvasNode | undefined, nodeOptions: CreateNodeOptions, nodeData?: Partial<AllCanvasNodeData>) {
        if (!parentNode) throw new Error('parentNode wasn\'t detected');

        const { text, size } = nodeOptions;
        const width = size?.width || Math.max(MIN_WIDTH, parentNode.width);
        const height = size?.height || Math.max(MIN_HEIGHT, parentNode && calculateNoteHeight({ text, width: parentNode.width, parentHeight: parentNode.height }));

        const siblings = parentNode && this.canvas.getEdgesForNode(parentNode).filter((n) => n.from.node.id === parentNode.id).map((e) => e.to.node);

        const farLeft = parentNode.y - parentNode.width * 5;
        const siblingsRight = siblings?.reduce((right, sib) => Math.max(right, sib.x + sib.width), farLeft);
        const priorSibling = siblings?.[siblings.length - 1];

        const x = siblingsRight != null ? siblingsRight + NEW_NOTE_MARGIN : parentNode.x;
        const y = (priorSibling ? priorSibling.y : parentNode.y + parentNode.height + NEW_NOTE_MARGIN) + height * 0.5;

        const newNode = this.canvas.createTextNode({
            pos: { x, y },
            position: 'left',
            size: { height, width },
            text,
            focus: false,
        });

        if (nodeData) newNode.setData(nodeData);

        this.canvas.deselectAll();
        this.canvas.addNode(newNode);

        this.addConnection(generateRandomHexString(16), { fromOrTo: 'from', side: 'bottom', node: parentNode }, { fromOrTo: 'to', side: 'top', node: newNode });

        return newNode;
    }

    protected addConnection(connectionID: string, fromConnection: CanvasEdgeIntermediate, toConnection: CanvasEdgeIntermediate) {
        const data = this.canvas.getData();
        if (!data) return;

        this.canvas.importData({
            edges: [...data.edges, { id: connectionID, fromNode: fromConnection.node.id, fromSide: fromConnection.side, toNode: toConnection.node.id, toSide: toConnection.side }],
            nodes: data.nodes,
        });

        this.canvas.requestFrame();
    }

    protected async getTextSelectedItems(): Promise<Item[]> {
        const extractedText = Array.from(this.canvas.selection.values())
            .map(async (element: any) => {
                if (element.file)
                    element.rawText = await app.vault.cachedRead(element.file)
                else element.rawText = element.text
                return element;
            });

        return Promise.all(extractedText);
    }

    protected getParentOfNode(id: string) {

    }

    async getSelections(): Promise<string[]> {
        // @ts-ignore
        return (await this.getTextSelectedItems()).map(e => e?.rawText).filter(Boolean) || [];
    }

    async getValue(): Promise<string> {
        return (await Promise.all(Array.from(this.canvas.nodes).map(async (element: any) => {
            if (element.file)
                element.rawText = await app.vault.cachedRead(element.file)
            else element.rawText = element.text
            return element;
        }))).join("\n")
    }

    async getSelection(): Promise<string> {
        let txt = (await this.getSelections())[0];

        if (!txt?.length) {
            txt = await this.getValue();
        }

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

    async insertText(text: string, parent?: Item, mode?: Mode): Promise<Item> {
        const items = await this.getTextSelectedItems();
        let selectedItem = parent || await this.getCursor();

        await this.canvas.requestFrame();

        switch (mode) {
            case "replace":
                if (!selectedItem) throw "no item to replace";
                // remove selected items(text)
                for (const item of [...items.filter(i => i?.id != selectedItem?.id)]) {
                    if (item)
                        this.canvas.removeNode(item)
                }

                await this.canvas.requestFrame();
                await selectedItem.setText(text);

                break;

            case "insert":
                selectedItem = this.createNewNode(parent, {
                    text,
                    position: "bottom"
                },
                    {
                        color: "6",
                        chat_role: 'assistant'
                    }
                )

                if (parent)
                    selectedItem.moveAndResize({
                        height: calculateNoteHeight({
                            parentHeight: parent.height,
                            width: selectedItem.width,
                            text
                        }),
                        width: selectedItem.width,
                        x: parent.x,
                        y: parent.y + parent.height + NEW_NOTE_MARGIN
                    })
                break;

            case "stream":
                if (!selectedItem?.id) throw "no item to update";
                await this.canvas.requestFrame();
                await selectedItem.setText(selectedItem.getData().text + text);

                selectedItem.moveAndResize({
                    height: selectedItem?.height ? calculateNoteHeight({
                        parentHeight: selectedItem?.height,
                        width: selectedItem.width,
                        text
                    }) : undefined,
                    width: selectedItem.width,
                    x: selectedItem.x,
                    y: selectedItem.y
                })

                break;
        }
        return selectedItem
    }

    async insertStream(pos: Item, mode?: "insert" | "replace"): Promise<{
        insert(data: string): void,
        end(): void,
        replaceAllWith(newData: string): void
    }> {
        const items = await this.getTextSelectedItems();
        let selectedItem = items[items.length - 1]
        let cursor: any;

        let postingContent = "";
        let stillPlaying = true;
        let firstTime = true;
        let previewsLevel = -1;

        const writerTimer: any = setInterval(async () => {
            if (!stillPlaying) return clearInterval(writerTimer);
            const posting = postingContent;
            if (!posting) return;

            const postinglines = posting.split("\n");

            for (const postingLine of postinglines) {
                if (firstTime) cursor = await this.insertText(postingLine, pos, mode) || cursor;
                else cursor = await this.insertText(postingLine, cursor, "stream");

                postingContent = postingContent.substring(postingLine.length);
                firstTime = false;
            }

            // if (!this.plugin.settings.freeCursorOnStreaming)
            //     this.setCursor(cursor);
        }, 200);

        return {
            insert(newInsertData: string) {
                postingContent += newInsertData
            },
            end() {
                stillPlaying = false;
            },

            replaceAllWith: async (allText) => {
                await this.insertText(allText, cursor || selectedItem, "replace");
            }
        }
    }

    getActiveFile(): TFile {
        // @ts-ignore
        return this.view.file;
    }
}

import type { Canvas, CanvasNode, CreateNodeOptions, AllCanvasNodeData, CanvasEdgeIntermediate } from "./canvas.d";
import { TFile, View } from "obsidian";

const MIN_WIDTH = 200;
const PX_PER_CHAR = 8;
const PX_PER_LINE = 100;
const TEXT_PADDING_HEIGHT = 20;
const NEW_NOTE_MARGIN = 60;
const MIN_HEIGHT = 60;

const calculateNoteHeight = ({ parentHeight, text, width }: { parentHeight: number; width?: number; text: string }) => Math.max(parentHeight, Math.round(TEXT_PADDING_HEIGHT + (PX_PER_LINE * text.length) / ((width || MIN_WIDTH) / PX_PER_CHAR)));

const generateRandomHexString = (len: number) => Array.from({ length: len }, () => ((16 * Math.random()) | 0).toString(16)).join('');

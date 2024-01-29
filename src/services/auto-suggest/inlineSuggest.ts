import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    keymap,
} from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { AutoSuggest } from ".";
import TextGeneratorPlugin from "#/main";
import { Scope, App, EditorSuggestTriggerInfo, Editor, TFile, MarkdownView } from "obsidian";
import debug from "debug";
import { debounce } from "#/utils";
const logger = debug("textgenerator:AutoSuggest");


export class InlineSuggest {
    plugin: TextGeneratorPlugin;
    autoSuggest: AutoSuggest;
    delay = 0;
    currentSuggestions: string[] = [];
    viewedSuggestion: number = 0;
    getSuggestionsDebounced: () => void;
    scope: Scope & {
        keys: {
            key: string;
            func: any;
        }[];
    };
    isOpen: boolean;
    static delay: number = 200;
    static getSuggestionsDebounced: any;

    constructor(app: App, plugin: TextGeneratorPlugin, autoSuggest: AutoSuggest) {
        logger("AutoSuggest", app, plugin);
        this.plugin = plugin;
        this.autoSuggest = autoSuggest;

    }

    onSelect() {
        this.selectSuggestion(this.currentSuggestions[this.viewedSuggestion])
        this.clear();
    }

    public selectSuggestion(
        replacementValue: string,
    ): void {
        logger("selectSuggestion");
        const overrideTrigger = this.plugin.settings.autoSuggestOptions.overrideTrigger ?? this.plugin.defaultSettings.autoSuggestOptions.overrideTrigger;
        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView || !replacementValue?.length) {
            return;
        }

        const currentCursorPos = activeView.editor.getCursor();

        replacementValue = (overrideTrigger ? overrideTrigger : "") + replacementValue


        const newCursorPos = {
            ch: currentCursorPos.ch - (this.plugin.settings.autoSuggestOptions.triggerPhrase + "").length + replacementValue?.length,
            line: currentCursorPos.line,
        };

        try {
            activeView.editor.replaceRange(
                replacementValue,
                {
                    ch: currentCursorPos.ch - (this.plugin.settings.autoSuggestOptions.triggerPhrase + "").length,
                    line: currentCursorPos.line
                },
                currentCursorPos
            );


            activeView.editor.setCursor(newCursorPos);
        } catch (err: any) {
            console.warn(err)
        }
    }

    async predict(k: EditorSuggestTriggerInfo, editor: Editor, file: TFile) {
        this.clear();

        const completions = await this.autoSuggest.getGPTSuggestions({
            editor,
            file,
            ...k
        })

        await this.setSuggestions(completions.map(c => c.value) || []);
        // this.currentSuggestions = [
        //     "testing 1234",
        //     "testing 1234",
        //     "testing 1234",
        // ]
    }

    async clear() {
        await this.setSuggestions([]);
        this.viewedSuggestion = 0;
    }

    async setSuggestions(newSuggestions: string[]) {
        this.currentSuggestions = newSuggestions;

        this.plugin.app.workspace.activeEditor?.editor?.blur();
        this.plugin.app.workspace.activeEditor?.editor?.focus();
    }

    static setup(app: App, plugin: TextGeneratorPlugin, autoSuggest: AutoSuggest) {
        const self = new InlineSuggest(app, plugin, autoSuggest);


        self.delay = plugin.settings.autoSuggestOptions.delay;
        self.getSuggestionsDebounced = debounce(
            async () => {
                self.clear();
                const editor = app.workspace.activeEditor?.editor;
                const file = app.workspace.activeEditor?.file;
                if (!editor || !file) return false;


                const cursor = editor.getCursor();
                const t = autoSuggest.onTrigger(cursor, editor, file)
                if (!t) return false;

                await self.predict(t, editor, file);
            },
            this.delay
        );

        plugin.registerEditorExtension([
            Prec.highest(
                keymap.of([
                    {
                        key: "Tab",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            self.onSelect();
                            return d
                        },
                    },
                    {
                        key: "Enter",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            self.onSelect();
                            return d
                        },
                    },
                    {
                        key: "ArrowRight",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            self.onSelect();
                            return d;
                        },
                    },
                    {
                        key: "ArrowDown",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            if (!self.currentSuggestions[self.viewedSuggestion + 1]) self.viewedSuggestion = -1;
                            self.viewedSuggestion++;
                            self.setSuggestions(self.currentSuggestions)
                            return d;
                        },
                    },
                    {
                        key: "ArrowUp",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            if (!self.currentSuggestions[self.viewedSuggestion - 1]) self.viewedSuggestion = self.currentSuggestions.length;
                            self.viewedSuggestion--;
                            self.setSuggestions(self.currentSuggestions)
                            return d;
                        },
                    },
                    {
                        key: "Escape",
                        run: () => {
                            const d = !!self.currentSuggestions?.length;
                            self.clear();
                            return d;
                        },
                    },
                    {
                        any: (view, evt) => {
                            const d = !!self.currentSuggestions?.length;
                            // ignore keys
                            // ["Backspace", "Tab", "ArrowRight", "Escape"].includes(evt.key) ...etc
                            if (evt.key.length > 1 || evt.ctrlKey || self.plugin.processing) {
                                if (d) self.setSuggestions([]);
                                return false;
                            }

                            (async () => {
                                await new Promise(s => setTimeout(s, 200));
                                await self.getSuggestionsDebounced();
                            })()

                            return false;
                        },
                    },
                ])
            ),
            self.getInlineSuggestionsExtension(self,
                () => self.onSelect(),
                () => self.clear()
            )
        ])
        return self;
    }

    getInlineSuggestionsExtension(autoSuggest: InlineSuggest, onSelect: Function, onExit: Function,) {
        return Prec.lowest(
            // must be lowest else you get infinite loop with state changes by our plugin
            ViewPlugin.fromClass(
                class RenderPlugin {
                    decorations: DecorationSet;

                    constructor(view: EditorView) {
                        this.decorations = Decoration.none;

                    }

                    async update(update: ViewUpdate) {
                        this.decorations = this.inlineSuggestionDecoration(
                            update.view
                        );
                    }

                    inlineSuggestionDecoration(
                        view: EditorView,
                    ) {
                        const post = view.state.selection.main.head;
                        if (!autoSuggest.currentSuggestions?.length) {
                            return Decoration.none;
                        }

                        try {
                            const widget = new InlineSuggestionsWidget(
                                autoSuggest,
                                onSelect,
                                onExit,
                                view
                            );

                            const decoration = Decoration.widget({
                                widget,
                                side: 1,
                            });

                            return Decoration.set([decoration.range(post)]);
                        } catch (e) {
                            return Decoration.none;
                        }

                    }
                },
                {
                    decorations: (v) => v.decorations,
                }
            )
        );
    }
}




class InlineSuggestionsWidget extends WidgetType {
    onSelect: Function;
    onExit: Function;
    autoSuggest: InlineSuggest;
    renderedSuggestion: string;
    exitHandler: Function;
    constructor(autoSuggest: InlineSuggest, onSelect: Function, onExit: Function, readonly view: EditorView) {
        super();
        this.autoSuggest = autoSuggest;
        this.onSelect = onSelect;
        this.onExit = onExit;
        this.view = view;
    }

    eq(widget: WidgetType): boolean {
        return this.renderedSuggestion == this.autoSuggest.currentSuggestions[this.autoSuggest.viewedSuggestion];
    }

    toDOM() {
        const spanMAM = document.createElement("span");
        const span = spanMAM.createEl("span");

        document.addEventListener("click", this.exitHandler = () => {
            document.removeEventListener("click", this.exitHandler as any);
            span.style.display = "hidden";
            this.onExit();
        })


        span.textContent = this.autoSuggest.currentSuggestions[this.autoSuggest.viewedSuggestion] + ` (${this.autoSuggest.viewedSuggestion + 1}/${this.autoSuggest.currentSuggestions.length})`;
        this.renderedSuggestion = span.textContent;

        span.addClass("plug-tg-opacity-40")

        span.onclick = () => {
            span.style.display = "hidden";
            this.onSelect();
            this.onExit();
        }

        span.onselect = () => {
            span.style.display = "hidden";
            this.onSelect();
            this.onExit();
        }

        return span;
    }

    destroy(dom: HTMLElement) {
        document.removeEventListener("click", this.exitHandler as any);
        super.destroy(dom);
    }
}
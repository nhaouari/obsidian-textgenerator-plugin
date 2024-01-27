import TextGeneratorPlugin from "src/main";
import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    MarkdownView,
    Notice,
    Scope,
    TFile,
    getIcon,
} from "obsidian";

import debug from "debug";
import ContentManagerCls from "../../content-manager";
import { debounce } from "#/utils";
import { AutoSuggest, Completion } from ".";
const logger = debug("textgenerator:AutoSuggest");



export class ListSuggest extends EditorSuggest<Completion> {
    plugin: TextGeneratorPlugin;
    autoSuggest: AutoSuggest;
    process = true;
    delay = 0;
    currentSuggestions: string[] = [];
    getSuggestionsDebounced: (
        context: EditorSuggestContext
    ) => Promise<Completion[]>;
    scope: Scope & {
        keys: {
            key: string;
            func: any;
        }[];
    };
    isOpen: boolean;
    constructor(app: App, plugin: TextGeneratorPlugin, autoSuggest: AutoSuggest) {
        logger("AutoSuggest", app, plugin);
        super(app);
        this.plugin = plugin;
        this.autoSuggest = autoSuggest;
        this.scope.register(
            [],
            "Tab",
            this.scope.keys.find((k) => k.key === "ArrowDown")?.func
        );
        this.scope.register(
            ["Shift"],
            "Tab",
            this.scope.keys.find((k) => k.key === "ArrowUp")?.func
        );
    }

    public updateSettings() {
        logger("updateSettings");
        const plugin = this.plugin;
        if (
            this.delay !== plugin.settings.autoSuggestOptions.delay ||
            this.getSuggestionsDebounced === undefined
        ) {
            this.delay = plugin.settings.autoSuggestOptions.delay;
            this.getSuggestionsDebounced = debounce(
                async (context: EditorSuggestContext): Promise<Completion[]> => {
                    logger("updateSettings", { delay: this.delay, context });
                    if (!this.process) return [{ label: context.query, value: context.query }];

                    const trimmedQuery = context.query.trim();

                    if (
                        // if its at the begining of a line
                        (!plugin.settings.autoSuggestOptions.allowInNewLine && (
                            !context.start.ch
                            || trimmedQuery.endsWith("-")
                            || trimmedQuery.endsWith("- [ ]")
                        ))
                        // if there are no context
                        || trimmedQuery.length <= 5
                    )
                        return [];


                    const suggestions = await this.autoSuggest.getGPTSuggestions(context);
                    return suggestions?.length
                        ? suggestions
                        : [
                            {
                                label: context.query,
                                value: context.query,
                            },
                        ];
                },
                this.delay
            );
        }
    }

    public onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile
    ): EditorSuggestTriggerInfo | null {
        logger("onTrigger", cursor, editor, file);
        if (
            this.isOpen ||
            !this.plugin.settings?.autoSuggestOptions?.isEnabled ||
            !this.plugin.settings.autoSuggestOptions.triggerPhrase ||
            // @ts-ignore
            (this.app.workspace.activeEditor?.editor?.cm?.state?.vim?.mode &&
                // @ts-ignore
                this.app.workspace.activeEditor.editor.cm.state.vim.mode !==
                "insert")
        ) {
            this.process = false;
            return null;
        }

        const triggerPhrase = this.plugin.settings.autoSuggestOptions.triggerPhrase;

        const line = editor.getLine(cursor.line).substring(0, cursor.ch);

        if ((!this.plugin.settings.autoSuggestOptions.allowInNewLine && line == triggerPhrase) || !line.endsWith(triggerPhrase)) {
            this.process = false;
            return null;
        }

        this.process = true;

        // @ts-ignore
        const CM = ContentManagerCls.compile(this.plugin.app.workspace.activeLeaf?.view, this.plugin)

        const selection = this.plugin.contextManager.getTGSelection(CM) as unknown as string
        const lastOccurrenceIndex = selection.lastIndexOf(triggerPhrase);
        const currentPart =
            selection.substring(0, lastOccurrenceIndex) +
            selection.substring(lastOccurrenceIndex).replace(triggerPhrase, "");

        const currentStart = line.lastIndexOf(triggerPhrase);

        if (!selection.trim().length) {
            this.process = false;
            return null;
        }

        const result = {
            start: {
                ch: currentStart,
                line: cursor.line,
            },
            end: cursor,
            query: currentPart,
        };

        logger("onTrigger", result);
        return result;
    }

    public async getSuggestions(context: EditorSuggestContext): Promise<Completion[]> {
        logger("getSuggestions", context);

        this.updateSettings();

        const suggestions = await this.getSuggestionsDebounced(context);
        logger("getSuggestions", suggestions);


        if (this.plugin.settings.autoSuggestOptions.inlineSuggestions) {
            this.currentSuggestions = suggestions?.map(s => s.value) || [];
        }

        return suggestions;
    }

    public renderSuggestion(value: Completion, el: HTMLElement): void {
        //logger("renderSuggestion",value,el);
        el.setAttribute("dir", "auto");
        el.addClass("cursor-pointer");
        el.setText(value.label);
    }

    public selectSuggestion(
        value: Completion,
        evt: MouseEvent | KeyboardEvent
    ): void {
        logger("selectSuggestion", value, evt);
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView || !this.context) {
            return;
        }

        const currentCursorPos = activeView.editor.getCursor();
        let replacementValue = value.value;
        const prevChar = activeView.editor.getRange(
            { line: this.context.start.line, ch: this.context.start.ch - 1 },
            this.context.start
        );

        if (
            prevChar &&
            prevChar.trim() !== "" &&
            replacementValue.charAt(0) !== " "
        ) {
            replacementValue = " " + replacementValue;
        }

        const newCursorPos = {
            ch: this.context.start.ch + replacementValue.length,
            line: currentCursorPos.line,
        };

        activeView.editor.replaceRange(
            replacementValue,
            {
                ch: this.context.start.ch,
                line: this.context.start.line,
            },
            this.context.end
        );

        activeView.editor.setCursor(newCursorPos);
    }


    close(): void {
        this.currentSuggestions = [];
        super.close();
    }

    autoSuggestItem: HTMLElement;
    renderStatusBar() {
        this.autoSuggestItem.innerHTML = "";
        if (!this.plugin.settings.autoSuggestOptions.showStatus) return;

        const languageIcon = this.plugin.settings.autoSuggestOptions.isEnabled
            ? getIcon("zap")
            : getIcon("zap-off");

        if (languageIcon) this.autoSuggestItem.append(languageIcon);

        this.autoSuggestItem.title =
            "Text Generator Enable or disable Auto-suggest";

        this.autoSuggestItem.addClass("mod-clickable");
    }

    AddStatusBar() {
        this.autoSuggestItem = this.plugin.addStatusBarItem();

        this.renderStatusBar();

        this.autoSuggestItem.addEventListener("click", (event) => {
            this.plugin.settings.autoSuggestOptions.isEnabled =
                !this.plugin.settings.autoSuggestOptions.isEnabled;
            this.plugin.saveSettings();
            this.renderStatusBar();
            if (this.plugin.settings.autoSuggestOptions.isEnabled) {
                new Notice(`Auto Suggestion is on!`);
            } else {
                new Notice(`Auto Suggestion is off!`);
            }
        });
    }

    open(): void {
        if (this.plugin.settings.autoSuggestOptions.inlineSuggestions) {
            return super.close();
        }

        return super.open();
    }


    static setup(app: App, plugin: TextGeneratorPlugin, autoSuggest: AutoSuggest) {
        const suggest = new ListSuggest(app, plugin, autoSuggest);
        plugin.registerEditorSuggest(suggest);
        return suggest;
    }
}



import TextGeneratorPlugin from "src/main";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  MarkdownView,
  Scope,
  TFile,
} from "obsidian";

import debug from "debug";
const logger = debug("textgenerator:AutoSuggest");

function debounce<T extends unknown[], R>(
  func: (...args: T) => Promise<R>,
  wait: number
): (...args: T) => Promise<R> {
  let timeout: NodeJS.Timeout | null;

  logger("debounce", func, wait);
  return function debouncedFunction(...args: T): Promise<R> {
    const context = this;

    return new Promise((resolve, reject) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        logger("debouncedFunction", args);
        func
          .apply(context, args)
          .then((result: any) => resolve(result))
          .catch((error: any) => reject(error));
      }, wait);
    });
  };
}

interface Completion {
  label: string;
  value: string;
}

export class AutoSuggest extends EditorSuggest<Completion> {
  plugin: TextGeneratorPlugin;
  process = true;
  delay = 0;
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
  constructor(app: App, plugin: TextGeneratorPlugin) {
    logger("AutoSuggest", app, plugin);
    super(app);
    this.plugin = plugin;
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
    if (
      this.delay !== this.plugin.settings.autoSuggestOptions.delay ||
      this.getSuggestionsDebounced === undefined
    ) {
      this.delay = this.plugin.settings.autoSuggestOptions.delay;
      this.getSuggestionsDebounced = debounce(
        async (context: EditorSuggestContext): Promise<Completion[]> => {
          logger("updateSettings", { delay: this.delay, context });
          if (this.process) {
            const suggestions = await this.getGPTSuggestions(context);
            return suggestions?.length
              ? suggestions
              : [
                  {
                    label: context.query,
                    value: context.query,
                  },
                ];
          } else {
            return [{ label: context.query, value: context.query }];
          }
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
      !this.plugin.settings?.autoSuggestOptions?.isEnabled ||
      // @ts-ignore
      (this.app.workspace.activeEditor?.editor?.cm?.state?.vim?.mode &&
        // @ts-ignore
        this.app.workspace.activeEditor.editor.cm.state.vim.mode !==
          "insert") ||
      this.isOpen
    ) {
      this.process = false;
      return null;
    }

    const triggerPhrase = this.plugin.settings.autoSuggestOptions.triggerPhrase;

    const line = editor.getLine(cursor.line).substring(0, cursor.ch);

    if (!line.endsWith(triggerPhrase)) {
      this.process = false;
      return null;
    }

    this.process = true;

    const selection =
      this.plugin.textGenerator.contextManager.getSelection(editor);
    const lastOccurrenceIndex = selection.lastIndexOf(triggerPhrase);
    const currentPart =
      selection.substring(0, lastOccurrenceIndex) +
      selection.substring(lastOccurrenceIndex).replace(triggerPhrase, "");

    const currentStart = line.lastIndexOf(triggerPhrase);

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

  public getSuggestions(context: EditorSuggestContext): Promise<Completion[]> {
    logger("getSuggestions", context);
    this.updateSettings();
    return new Promise((resolve, reject) => {
      this.getSuggestionsDebounced(context)
        .then((suggestions) => {
          logger("getSuggestions", suggestions);
          resolve(suggestions);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public renderSuggestion(value: Completion, el: HTMLElement): void {
    //logger("renderSuggestion",value,el);
    el.setAttribute("dir", "auto");
    el.addClass("cursor-pointer");
    el.setText(value.label);
  }

  public checkLastSubstring(str: string, substring: string): boolean {
    const size = substring.length;
    const lastSubstring = str.slice(-size);
    return lastSubstring === substring;
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

  private async getGPTSuggestions(
    context: EditorSuggestContext
  ): Promise<Completion[] | []> {
    logger("getGPTSuggestions", context);
    try {
      const prompt = `continue the follwing text :
            ${context.query}
            `;

      this.plugin.startProcessing(false);

      const re = await this.plugin.textGenerator.LLMProvider.generateMultiple(
        [{ role: "user", content: prompt }],
        {
          stream: false,
          n: parseInt(
            "" + this.plugin.settings.autoSuggestOptions.numberOfSuggestions
          ),
          stop: [this.plugin.settings.autoSuggestOptions.stop],
        }
      );

      this.plugin.endProcessing(false);

      // let suggestions: string[] = [];
      // const chatModels = [
      // 	"gpt-3.5-turbo",
      // 	"gpt-3.5-turbo-0301",
      // 	"gpt-4",
      // 	"gpt-4-0314",
      // 	"gpt-4-32k",
      // 	"gpt-4-32k-0314",
      // ];
      // if (chatModels.includes(this.plugin.settings.engine)) {
      // 	suggestions = re.map((r) => r.message.content);
      // } else {
      // 	suggestions = re.map((r) => r.text);
      // }
      const suggestions = [...new Set(re)];
      return suggestions.map((r) => {
        let label = r.trim();
        if (
          !this.checkLastSubstring(
            label,
            this.plugin.settings.autoSuggestOptions.stop
          )
        ) {
          label += this.plugin.settings.autoSuggestOptions.stop;
        }

        const suggestionsObj = {
          label: label,
          value: label.toLowerCase().startsWith(context.query.toLowerCase())
            ? label.substring(context.query.length).trim()
            : label.trim(),
        };
        logger("getGPTSuggestions", suggestionsObj);
        return suggestionsObj;
      });
    } catch (error) {
      logger("getGPTSuggestions error", error);
      this.plugin.handelError(error);
    }
    return [];
  }
}

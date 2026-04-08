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
import {
  Scope,
  App,
  EditorSuggestTriggerInfo,
  Editor,
  TFile,
  MarkdownView,
  MarkdownRenderer,
  Platform,
} from "obsidian";
import debug from "debug";
import { debounce } from "#/utils";
const logger = debug("textgenerator:AutoSuggest");

export class InlineSuggest {
  plugin: TextGeneratorPlugin;
  autoSuggest: AutoSuggest;
  delay = 0;
  currentSuggestions: string[] = [];
  viewedSuggestion = 0;
  getSuggestionsDebounced: (() => void) | undefined;
  scope:
    | (Scope & {
      keys: {
        key: string;
        func: any;
      }[];
    })
    | undefined;
  isOpen = false;
  static delay = 200;
  static getSuggestionsDebounced: any;

  constructor(app: App, plugin: TextGeneratorPlugin, autoSuggest: AutoSuggest) {
    logger("AutoSuggest", app, plugin);
    this.plugin = plugin;
    this.autoSuggest = autoSuggest;
  }

  onSelect(all?: boolean) {
    if (all) this.selectSuggestion(this.currentSuggestions.join("\n"));
    else this.selectSuggestion(this.currentSuggestions[this.viewedSuggestion]);
    this.clear();
  }

  public selectSuggestion(replacementValue: string): void {
    logger("selectSuggestion");
    const overrideTrigger =
      this.plugin.settings.autoSuggestOptions.overrideTrigger ??
      this.plugin.defaultSettings.autoSuggestOptions.overrideTrigger;
    const activeView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView || !replacementValue?.length) {
      return;
    }

    const currentCursorPos = activeView.editor.getCursor();

    replacementValue =
      (overrideTrigger ? overrideTrigger : "") + replacementValue;

    const newCursorPos = {
      ch:
        currentCursorPos.ch -
        (this.plugin.settings.autoSuggestOptions.triggerPhrase + "").length +
        replacementValue?.length,
      line: currentCursorPos.line,
    };

    try {
      activeView.editor.replaceRange(
        replacementValue,
        {
          ch:
            currentCursorPos.ch -
            (this.plugin.settings.autoSuggestOptions.triggerPhrase + "").length,
          line: currentCursorPos.line,
        },
        currentCursorPos
      );

      activeView.editor.setCursor(newCursorPos);
    } catch (err: any) {
      console.warn(err);
    }
  }

  async predict(k: EditorSuggestTriggerInfo, editor: Editor, file: TFile) {
    this.clear();

    const completions = await this.autoSuggest.getGPTSuggestions({
      editor,
      file,
      ...k,
    });

    await this.setSuggestions(completions.map((c) => c.value) || []);
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

  static setup(
    app: App,
    plugin: TextGeneratorPlugin,
    autoSuggest: AutoSuggest
  ) {
    const self = new InlineSuggest(app, plugin, autoSuggest);

    self.delay = plugin.settings.autoSuggestOptions.delay;
    self.getSuggestionsDebounced = debounce(async () => {
      self.clear();
      const editor = app.workspace.activeEditor?.editor;
      const file = app.workspace.activeEditor?.file;
      if (!editor || !file) return false;

      const cursor = editor.getCursor();
      const t = autoSuggest.onTrigger(cursor, editor, file);
      if (!t) return false;

      await self.predict(t, editor, file);
    }, this.delay);

    plugin.registerEditorExtension([
      Prec.highest(
        keymap.of([
          {
            key: "Tab",
            run: () => {
              const d = !!self.currentSuggestions?.length;
              if (!d) return false;

              self.onSelect();
              return true;
            },
          },
          {
            key: "Enter",
            run: () => {
              const d = !!self.currentSuggestions?.length;
              if (!d) return false;

              self.onSelect();
              return true;
            },
          },
          {
            key: "ArrowDown",
            run: () => {
              const d = !!self.currentSuggestions?.length;
              if (!d) return false;

              if (!self.currentSuggestions[self.viewedSuggestion + 1])
                self.viewedSuggestion = -1;
              self.viewedSuggestion++;
              self.setSuggestions(self.currentSuggestions);

              return true;
            },
          },
          {
            key: "ArrowUp",
            run: () => {
              const d = !!self.currentSuggestions?.length;
              if (!d) return false;

              if (!self.currentSuggestions[self.viewedSuggestion - 1])
                self.viewedSuggestion = self.currentSuggestions.length;
              self.viewedSuggestion--;
              self.setSuggestions(self.currentSuggestions);
              return true;
            },
          },
          {
            key: "Escape",
            run: () => {
              const d = !!self.currentSuggestions?.length;
              if (!d) return false;

              self.clear();
              return true;
            },
          },
          {
            any: (view, evt) => {
              if (evt.key == "Control") return false;
              const d = !!self.currentSuggestions?.length;

              if (d && evt.key == "ArrowRight") {
                self.onSelect(evt.ctrlKey);
                return true;
              }

              // ignore keys
              // ["Backspace", "Tab", "ArrowRight", "Escape"].includes(evt.key) ...etc
              const lastletterOfTrigger =
                self.plugin.settings.autoSuggestOptions.triggerPhrase[
                self.plugin.settings.autoSuggestOptions.triggerPhrase.length -
                1
                ];
              if (
                evt.key.length > 1 ||
                evt.ctrlKey ||
                self.plugin.processing ||
                evt.key !== lastletterOfTrigger
              ) {
                if (d) self.setSuggestions([]);
                return false;
              }

              self.getSuggestionsDebounced?.();

              return false;
            },
          },
        ])
      ),
      self.getInlineSuggestionsExtension(self, {
        onSelect: (e) => self.onSelect(e),
        onExit: () => self.clear(),
        onNext: () => {
          if (!self.currentSuggestions[self.viewedSuggestion + 1])
            self.viewedSuggestion = -1;
          self.viewedSuggestion++;
          self.setSuggestions(self.currentSuggestions);
        },
        onPrev: () => {
          if (!self.currentSuggestions[self.viewedSuggestion - 1])
            self.viewedSuggestion = self.currentSuggestions.length;
          self.viewedSuggestion--;
          self.setSuggestions(self.currentSuggestions);
        },
      }),
    ]);
    return self;
  }

  getInlineSuggestionsExtension(
    autoSuggest: InlineSuggest,
    controls: SuggestionControls,
  ) {
    return Prec.lowest(
      // must be lowest else you get infinite loop with state changes by our plugin
      ViewPlugin.fromClass(
        class RenderPlugin {
          decorations: DecorationSet;

          constructor(view: EditorView) {
            this.decorations = Decoration.none;
          }

          async update(update: ViewUpdate) {
            this.decorations = this.inlineSuggestionDecoration(update.view);
          }

          inlineSuggestionDecoration(view: EditorView) {
            const post = view.state.selection.main.head;
            if (!autoSuggest.currentSuggestions?.length) {
              return Decoration.none;
            }

            try {
              const widget = new InlineSuggestionsWidget(
                autoSuggest,
                controls,
                view
              );

              const decoration = Decoration.widget({
                widget: widget as any,
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

interface SuggestionControls {
  onSelect: (all?: boolean) => void;
  onExit: () => void;
  onNext: () => void;
  onPrev: () => void;
}

class InlineSuggestionsWidget extends WidgetType {
  controls: SuggestionControls;
  autoSuggest: InlineSuggest;
  renderedSuggestion?: string;
  exitHandler?: () => void;
  constructor(
    autoSuggest: InlineSuggest,
    controls: SuggestionControls,
    readonly view: EditorView
  ) {
    super();
    this.autoSuggest = autoSuggest;
    this.controls = controls;
    this.view = view;
  }

  eq(widget: WidgetType): boolean {
    return (
      this.renderedSuggestion ==
      this.autoSuggest.currentSuggestions[this.autoSuggest.viewedSuggestion]
    );
  }

  toDOM() {
    const wrapper = document.createElement("span");
    const span = wrapper.createEl("span");

    document.addEventListener(
      "click",
      (this.exitHandler = () => {
        document.removeEventListener("click", this.exitHandler as any);
        span.style.display = "hidden";
        this.controls.onExit();
      })
    );

    const content =
      this.autoSuggest.currentSuggestions[this.autoSuggest.viewedSuggestion];

    this.renderedSuggestion = content;

    wrapper.addClass("plug-tg-opacity-40");

    span.onselect = span.onclick = () => {
      span.style.display = "hidden";
      this.controls.onSelect();
      this.controls.onExit();
    };

    if (this.autoSuggest.plugin.settings.autoSuggestOptions.showInMarkdown)
      MarkdownRenderer.render(this.autoSuggest.plugin.app, content, span, "", this.autoSuggest.plugin);
    else span.textContent = content;

    const span2 = wrapper.createEl("span");
    span2.textContent = ` (${this.autoSuggest.viewedSuggestion + 1}/${this.autoSuggest.currentSuggestions.length
      })`;
    span2.onselect = span2.onclick = () => {
      span.style.display = "hidden";
      this.controls.onSelect(true);
      this.controls.onExit();
    };

    if (Platform.isMobile) {
      this.buildMobileToolbar(wrapper, span);
    }

    return wrapper;
  }

  private buildMobileToolbar(wrapper: HTMLElement, contentSpan: HTMLElement) {
    const toolbar = wrapper.createEl("span", {
      cls: "tg-suggest-toolbar",
    });

    const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    const hasManyOptions = this.autoSuggest.currentSuggestions.length > 1;

    if (hasManyOptions) {
      const prevBtn = toolbar.createEl("button", {
        cls: "tg-suggest-btn",
        attr: { "aria-label": "Previous suggestion" },
      });
      prevBtn.innerHTML = "&#8593;";
      prevBtn.addEventListener("pointerdown", (e) => {
        stop(e);
        this.controls.onPrev();
      });

      const nextBtn = toolbar.createEl("button", {
        cls: "tg-suggest-btn",
        attr: { "aria-label": "Next suggestion" },
      });
      nextBtn.innerHTML = "&#8595;";
      nextBtn.addEventListener("pointerdown", (e) => {
        stop(e);
        this.controls.onNext();
      });
    }

    const acceptBtn = toolbar.createEl("button", {
      cls: "tg-suggest-btn tg-suggest-btn-accept",
      attr: { "aria-label": "Accept suggestion" },
    });
    acceptBtn.innerHTML = "&#10003;";
    acceptBtn.addEventListener("pointerdown", (e) => {
      stop(e);
      contentSpan.style.display = "hidden";
      this.controls.onSelect();
      this.controls.onExit();
    });

    const dismissBtn = toolbar.createEl("button", {
      cls: "tg-suggest-btn tg-suggest-btn-dismiss",
      attr: { "aria-label": "Dismiss suggestion" },
    });
    dismissBtn.innerHTML = "&#10005;";
    dismissBtn.addEventListener("pointerdown", (e) => {
      stop(e);
      contentSpan.style.display = "hidden";
      this.controls.onExit();
    });
  }

  destroy(dom: HTMLElement) {
    document.removeEventListener("click", this.exitHandler as any);
    super.destroy(dom);
  }
}

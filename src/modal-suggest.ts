import { PromptTemplate } from "./types";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  MarkdownView,
  Scope,
} from "obsidian";
import TextGeneratorPlugin from "./main";
import { ExampleModal } from "./models/model";

export class ModelSuggest extends EditorSuggest<PromptTemplate> {
  private app: App;
  private plugin: TextGeneratorPlugin;
  scope: Scope;
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app);
    this.app = app;
    this.plugin = plugin;
    this.scope.register([], "Tab", () => {
      this.close();
    });
  }

  public onTrigger(cursor: EditorPosition, editor: Editor) {
    const line: string = editor.getLine(cursor.line).substring(0, cursor.ch);
    if (!line.startsWith("/")) return null;
    const currentPart = line.substring(1, cursor.ch);
    const currentStart = currentPart.lastIndexOf("/");
    return {
      start: { ch: 0, line: cursor.line },
      end: cursor,
      query: currentPart,
    };
  }

  public async getSuggestions(context: PromptTemplate["context"]) {
    const { query } = context;

    const modal = new ExampleModal(
      this.app,
      this.plugin,
      async (result) => {},
      "Choose a template"
    );
    const suggestions = modal.getSuggestions(query);
    return suggestions.map((s) => ({
      ...s.item,
      context,
    })) as PromptTemplate[];
  }

  renderSuggestion(template: PromptTemplate, el: HTMLElement) {
    el.createEl("h5", { text: template.name });
    el.createEl("small", {
      text: template.description?.substring(0, 150),
      cls: "desc",
    });
    el.createEl("div", {});
    el.createEl("small", { text: template.path, cls: "path" });
  }

  async selectSuggestion(
    value: PromptTemplate,
    evt: MouseEvent | KeyboardEvent
  ) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) return console.warn("couldn't find activeView");

    const editor: Editor = activeView.editor;

    editor.replaceRange("", value.context.start, value.context.end);
    await this.plugin.textGenerator.tempalteToModal({}, value.path, editor);

    this.close();
  }
}

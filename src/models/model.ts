import { App, Notice, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import TextGeneratorPlugin from "src/main";
import { PromptTemplate } from "src/types";
import debug from "debug";

const logger = debug("textgenerator:model");

export class ExampleModal extends FuzzySuggestModal<PromptTemplate> {
  plugin: TextGeneratorPlugin;
  title: string;
  onChoose: (result: PromptTemplate) => void;
  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    onChoose: (result: PromptTemplate) => void,
    title = ""
  ) {
    super(app);
    this.onChoose = onChoose;
    this.plugin = plugin;
    this.title = title;
    this.modalEl.insertBefore(
      createEl("div", { text: title, cls: "modelTitle" }),
      this.modalEl.children[0]
    );
  }

  getItems() {
    return this.plugin.textGenerator.getTemplates() as any;
  }

  // Renders each suggestion item.
  renderSuggestion(template: FuzzyMatch<PromptTemplate>, el: HTMLElement) {
    logger("renderSuggestion", template);
    el.createEl("div", { text: template.item.name });
    el.createEl("small", {
      text: template.item.description?.substring(0, 150),
      cls: "desc",
    });
    el.createEl("div", {});
    el.createEl("small", { text: template.item.path, cls: "path" });
    logger("renderSuggestion end", template);
  }

  getItemText(template: PromptTemplate): string {
    return (
      (template.name || "") +
      (template.description || "") +
      template.author +
      template.tags +
      template.path
    );
  }

  onChooseItem(template: PromptTemplate, evt: MouseEvent | KeyboardEvent) {
    logger("onChooseItem", template);
    new Notice(`Selected ${template.name}`);
    this.onChoose(template);
  }
}

import { App, Notice, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import TextGeneratorPlugin from "src/main";
import { PromptTemplate } from "src/types";
import debug from "debug";

const logger = debug("textgenerator:model");

export class ExampleModal extends FuzzySuggestModal<PromptTemplate & { id: string }> {
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
      createEl("div", { text: title, cls: "plug-tg-text-center plug-tg-text-xl plug-tg-font-bold" }),
      this.modalEl.children[0]
    );
  }

  getItems() {
    const viewType = this.plugin.app.workspace.activeLeaf?.view.getViewType();
    return this.plugin.textGenerator.getTemplates().filter(t => !viewType || !t.viewTypes || t.viewTypes?.includes(viewType)) as any;
  }

  // Renders each suggestion item.
  renderSuggestion(template: FuzzyMatch<PromptTemplate>, el: HTMLElement) {
    logger("renderSuggestion", template);
    el.createEl("div", { text: template.item.name });
    el.createEl("small", {
      text: template.item.description?.substring(0, 150),
      cls: "plug-tg-text-sm plug-tg-ml-6",
    });
    el.createEl("div", {});
    el.createEl("small", { text: template.item.path, cls: "path" });
    logger("renderSuggestion end", template);
  }

  // getSuggestions(query: string): FuzzyMatch<PromptTemplate & { id: string; }>[] {
  //   const items = this.getItems() as (PromptTemplate & { id: string; })[];
  //   const queryString = query.toLowerCase();

  //   const itms = items
  //     .map((item) => ({
  //       item: { ...item, id: item.path + item.promptId },
  //       match: this.calculateMatchScore(item, queryString),
  //     }))
  //     .sort((a, b) => b.match - a.match); // Sort by match score in descending order

  //   console.log({ query, first: itms[0]?.item?.name });

  //   return itms as any;
  // }

  calculateMatchScore(item: PromptTemplate & { id: string; }, queryString: string): number {
    const itemText = this.getItemText(item).toLowerCase();

    // Calculate match score based on various factors
    const index = itemText.indexOf(queryString);
    const startsWithQuery = index === 0;
    const containsQuery = index !== -1;

    let matchScore = 0;

    // Assign higher match scores for better matches
    if (startsWithQuery) {
      matchScore += 2;
    } else if (containsQuery) {
      matchScore += 1;
    }

    // You can add more factors to influence the match score based on your requirements

    return matchScore;
  }

  getItemText(template: PromptTemplate): string {
    return (
      template.tags +
      ((!template.name || !template.promptId) ? template.path || "" : "") +
      (template.name || "") +
      this.getItemPackageId(template) +
      template.author +
      (template.promptId || "") +
      (template.description || "")
    );
  }

  getItemPackageId(template: PromptTemplate): string {
    return template.path?.split("/").reverse()[1] || template.promptId
  }

  onChooseItem(template: PromptTemplate, evt: MouseEvent | KeyboardEvent) {
    logger("onChooseItem", template);
    new Notice(`Selected ${template.name}`);
    this.onChoose(template);
  }
}
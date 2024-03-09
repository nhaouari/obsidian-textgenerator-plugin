import { App, Notice, FuzzySuggestModal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import debug from "debug";
const logger = debug("textgenerator:setModel");

interface LLM {
  id: string;
  name: string;
}

export class SetLLM extends FuzzySuggestModal<LLM> {
  plugin: TextGeneratorPlugin;
  title: string;
  onChoose: (result: string) => void;
  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    onChoose: (result: string) => void,
    title = ""
  ) {
    super(app);
    this.onChoose = onChoose;
    this.plugin = plugin;
    this.title = title;
    this.modalEl.insertBefore(
      createEl("div", {
        text: title,
        cls: "plug-tg-text-center plug-tg-text-xl plug-tg-font-bold",
      }),
      this.modalEl.children[0]
    );
  }

  getItems() {
    logger("getItems");
    const llmList = this.plugin.textGenerator.LLMRegestry.getList().map(
      (l) => ({
        id: l,
        name:
          this.plugin.textGenerator.LLMRegestry.UnProviderNames[
            l as keyof typeof this.plugin.textGenerator.LLMRegestry.ProviderSlugs
          ] || "",
      })
    );
    return llmList;
  }

  getItemText(llm: LLM) {
    return llm.name || llm.id;
  }

  onChooseItem(llm: LLM, evt: MouseEvent | KeyboardEvent) {
    logger("onChooseItem", llm);
    new Notice(`Selected ${llm.name}`);
    this.onChoose(llm.id);
  }
}

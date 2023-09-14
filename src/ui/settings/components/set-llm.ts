import { App, Notice, FuzzySuggestModal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import debug from "debug";
import { LLMProviderRegistery } from "#/LLMProviders";
const logger = debug("textgenerator:setModel");

interface LLM {
	id: string;
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
			createEl("div", { text: title, cls: "modelTitle" }),
			this.modalEl.children[0]
		);
	}

	getItems() {
		logger("getItems");
		const llmList = LLMProviderRegistery.getList().map(l => ({ id: l }));
		return llmList;
	}

	getItemText(llm: LLM): string {
		return llm.id;
	}

	onChooseItem(llm: LLM, evt: MouseEvent | KeyboardEvent) {
		logger("onChooseItem", llm);
		new Notice(`Selected ${llm.id}`);
		this.onChoose(llm.id);
	}
}

import { App, Notice, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import TextGeneratorPlugin from "./main";
import { Model } from "./types";
import debug from "debug";
const logger = debug("textgenerator:setModel");
export class SetModel extends FuzzySuggestModal<Model> {
	plugin: TextGeneratorPlugin;
	title: string;
	constructor(
		app: App,
		plugin: TextGeneratorPlugin,
		onChoose: (result: string) => void,
		title: string = ""
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

	getItems(): Model[] {
		logger("getItems");
		const templates = Array.from(this.plugin.settings.models.keys()).map(
			(e) => ({ id: e })
		);
		return templates;
	}

	getItemText(model: Model): string {
		return model.id;
	}

	onChooseItem(model: Model, evt: MouseEvent | KeyboardEvent) {
		logger("onChooseItem", model);
		new Notice(`Selected ${model.id}`);
		this.onChoose(model.id);
	}
}

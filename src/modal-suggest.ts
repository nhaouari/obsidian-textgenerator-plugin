import { PromptTemplate } from "src/types";
import {
	Editor,
	EditorSuggest,
	EditorSuggestContext,
	MarkdownView,
} from "obsidian";
import TextGeneratorPlugin from "./main";
import { ExampleModal } from "./models/model";

export class ModelSuggest extends EditorSuggest<PromptTemplate> {
	private app: App;
	private plugin: TextGeneratorPlugin;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app);
		this.app = app;
		this.plugin = plugin;
		this.scope.register([], "Tab", () => {
			this.close();
		});
	}

	public onTrigger(cursor, editor) {
		const line: string = editor
			.getLine(cursor.line)
			.substring(0, cursor.ch);
		if (!line.startsWith("/")) return;
		const currentPart = line.substring(1, cursor.ch);
		const currentStart = currentPart.lastIndexOf("/");
		return {
			start: { ch: 0, line: cursor.line },
			end: cursor,
			query: currentPart,
		};
	}

	public async getSuggestions(context): Promise<PromptTemplate[]> {
		return new Promise((resolve) => {
			const { query } = context;

			const modal = new ExampleModal(
				this.app,
				this.plugin,
				async (result) => {},
				"Choose a template"
			);
			let suggestions = modal.getSuggestions(query);
			suggestions = suggestions.map((s) => ({ ...s, context }));
			resolve(suggestions);
		});
	}

	renderSuggestion(template: PromptTemplate, el) {
		el.createEl("div", { text: template.item.name });
		el.createEl("small", { text: template.item.description, cls: "desc" });
		el.createEl("div", {});
		el.createEl("small", { text: template.item.path, cls: "path" });
	}

	async selectSuggestion(value, evt) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor: Editor = activeView.editor;

		editor.replaceRange("", value.context.start, value.context.end);
		await this.plugin.textGenerator.tempalteToModal(
			this.plugin.settings,
			value.item.path,
			editor
		);

		this.close();
	}
}

import { App, Modal } from "obsidian";
import TextGeneratorPlugin from "src/main";
import * as React from "react";
import { TemplateModalView } from "./template-modal-view";
import { createRoot } from "react-dom/client";

export class TemplateModalUI extends Modal {
	result: string;
	plugin: TextGeneratorPlugin;
	onSubmit: (result: string) => void;
	root: any;
	variables: string[];
	metadata: any;

	constructor(
		app: App,
		plugin: TextGeneratorPlugin,
		variables: string[],
		metadata: any,
		onSubmit: (result: string) => void
	) {
		super(app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		this.variables = variables;
		this.metadata = metadata;
	}

	async onOpen() {
		this.containerEl.createEl("div", { cls: "PackageManager" });
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<React.StrictMode>
				<TemplateModalView
					p={this}
					labels={this.variables}
					onSubmit={this.onSubmit}
					metadata={this.metadata}
				/>
			</React.StrictMode>
		);
	}

	onClose() {
		this.root.unmount();
	}
}

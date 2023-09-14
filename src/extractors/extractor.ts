import { App } from "obsidian";
import TextGeneratorPlugin from "../main";

export class Extractor<document> {
	protected app: App;
	protected plugin: TextGeneratorPlugin;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	/** Read content as string */
	async convert(doc: document): Promise<string> {
		throw Error("Function convert is not implemented");
	}

	/** extract embedded files in a file as documents */
	async extract(filePath: string): Promise<document[]> {
		throw Error("Function extract is not implemented");
	}
}

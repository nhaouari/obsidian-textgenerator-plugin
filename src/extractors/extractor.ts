import { App } from "obsidian";
import TextGeneratorPlugin from "../main";
abstract class Extractor<document> {
	private app: App;
	private plugin: TextGeneratorPlugin;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	convert(doc: document): Promise<string> {
		throw new Error("Method not implemented.");
	}
	extract(filePath: string): Promise<document[]> {
		throw new Error("Method not implemented.");
	}
}

export { Extractor };

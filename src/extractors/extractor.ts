import { App } from "obsidian";
abstract class Extractor<document> {
	app: App;
	convert(doc: document): Promise<string> {
		throw new Error("Method not implemented.");
	}
	extract(filePath: string): Promise<document[]> {
		throw new Error("Method not implemented.");
	}
}

export { Extractor };

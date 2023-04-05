import { App, request } from "obsidian";
import TurndownService from "turndown";
import { Extractor } from "./extractor";
import { Readability } from "@mozilla/readability";
import debug from "debug";

const logger = debug("textgenerator:Extractor:WebPageExtractor");
export default class WebPageExtractor implements Extractor<string> {
	app: App;
	constructor(app: App) {
		this.app = app;
	}

	async convert(url: string): Promise<string> {
		logger("convert", { url });
		const response = await request({ url });
		const parser = new DOMParser();
		const doc = parser.parseFromString(response, "text/html");
		const turndownService = new TurndownService();
		const article = new Readability(doc).parse();
		const markdown = turndownService.turndown(
			"# " + article.title + "/n" + article.content
		);
		logger("convert end", { markdown });
		return markdown;
	}

	async extract(filePath?: string): Promise<string[]> {
		logger("extract", { filePath });
		const activeFileValue = this.app.workspace
			.getActiveFileView()
			.editor.getValue();
		const urls = this.extractUrls(activeFileValue);
		logger("extract end", { urls });
		return urls;
	}

	private extractUrls(text: string): string[] {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const matches = text.match(urlRegex);
		if (!matches) {
			return [];
		}
		return matches;
	}
}

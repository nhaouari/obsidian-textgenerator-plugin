import { App, request, Platform } from "obsidian";
import TurndownService from "turndown";
import { Extractor } from "./extractor";
import { Readability } from "@mozilla/readability";
import TextGeneratorPlugin from "src/main";
import debug from "debug";

// @ts-ignore
let remote: typeof import("electron").remote;

if (!Platform.isMobile) {
	remote = require("electron").remote;
}

const logger = debug("textgenerator:Extractor:WebPageExtractor");
export default class WebPageExtractor extends Extractor<string> {
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
	}

	async convert(url: string) {
		logger("convert", { url });
		let response: string;

		if (Platform.isMobile) {
			response = await request({ url });
		} else {
			const win = new remote.BrowserWindow({ show: false });
			win.webContents.userAgent =
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";
			await win.loadURL(url);
			response = await win.webContents.executeJavaScript(
				"document.documentElement.outerHTML"
			);
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString(response, "text/html");
		const turndownService = new TurndownService();
		const article = new Readability(doc).parse();
		const markdown = turndownService.turndown(
			"# " + article?.title + "\n" + article?.content
		);

		logger("convert end", { markdown });

		if (article?.content) {
			return markdown;
		} else {
			return "No content found";
		}
	}

	async extract(filePath?: string) {
		logger("extract", { filePath });
		const activeFileValue = this.app.workspace
			// @ts-ignore
			.getActiveFileView()
			.editor.getValue();
		const urls = this.extractUrls(activeFileValue);
		logger("extract end", { urls });
		return urls;
	}

	private extractUrls(text: string): string[] {
		const urlRegex =
			/(https?:\/\/(?!.*\.(?:mp3|mp4|mov|avi|pdf|png|jpe?g|gif))[^\s)\]]+)/g;
		const youtubeRegex =
			/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s)\]]+/g;
		const matches = text.match(urlRegex);
		if (!matches) {
			return [];
		}
		const uniqueUrls = new Set(
			matches.filter((url) => !youtubeRegex.test(url))
		);
		return [...uniqueUrls];
	}
}

import { App } from "obsidian";
import { YoutubeTranscript } from "youtube-transcript";
import { Extractor } from "./Extractor";
import debug from "debug";

const logger = debug("textgenerator:Extractor:YoutubeTranscriptionExtractor");

export default class YoutubeExtractor implements Extractor<string> {
	app: App;
	constructor(app: App) {
		this.app = app;
	}

	async convert(url: string): Promise<string> {
		logger("convert", { url });
		const transcription = await YoutubeTranscript.fetchTranscript(url);
		const text = transcription.reduce((acc, curr) => {
			return acc + curr.text + " ";
		}, "");
		logger("convert end", { text });
		return text;
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
		const urlRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=[^\s]+)/g;
		const matches = text.match(urlRegex);
		if (!matches) {
			return [];
		}
		return matches;
	}
}

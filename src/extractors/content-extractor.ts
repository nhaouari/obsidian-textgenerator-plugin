import { App, TAbstractFile } from "obsidian";
import PDFExtractor from "./pdf-extractor";
import WebPageExtractor from "./web-page-extractor";
import YoutubeExtractor from "./youtube-extractor";
import { Extractor } from "./extractor";
import debug from "debug";
const logger = debug("textgenerator:Extractor");

// Add the new Extractor here
enum ExtractorMethod {
	PDFExtractor,
	WebPageExtractor,
	YoutubeExtractor,
}

class ContentExtractor {
	private extractor: Extractor<any>;
	private app: App;
	constructor(app: App) {
		this.app = app;
	}

	setExtractor(extractorName: ExtractorMethod) {
		logger("set Extractor", { extractorName });
		this.extractor = this.createExtractor(extractorName);
	}

	async convert(doc: any): Promise<string> {
		// Use the selected splitter to split the text
		return this.extractor.convert(doc);
	}

	async extract(filePath: string): Promise<TAbstractFile[]> {
		return this.extractor.extract(filePath);
	}

	private createExtractor(extractorName: ExtractorMethod): Extractor<any> {
		switch (extractorName) {
			case ExtractorMethod.PDFExtractor:
				return new PDFExtractor(this.app);
			case ExtractorMethod.WebPageExtractor:
				return new WebPageExtractor(this.app);
			case ExtractorMethod.YoutubeExtractor:
				return new YoutubeExtractor(this.app);
			default:
				throw new Error(`Unknown Extractor: ${extractorName}`);
		}
	}
}

export { ContentExtractor, ExtractorMethod, Extractor };

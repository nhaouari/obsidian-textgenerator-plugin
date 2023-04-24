import { App, TAbstractFile } from "obsidian";
import PDFExtractor from "./pdf-extractor";
import WebPageExtractor from "./web-page-extractor";
import YoutubeExtractor from "./youtube-extractor";
import AudioExtractor from "./audio-extractor";
import { Extractor } from "./extractor";
import TextGeneratorPlugin from "../main";
import debug from "debug";
import ImageExtractor from "./image-extractor";
import ImageExtractorEmbded from "./image-extractor-embded";
const logger = debug("textgenerator:Extractor");

// Add the new Extractor here
enum ExtractorMethod {
	PDFExtractor,
	WebPageExtractor,
	YoutubeExtractor,
	AudioExtractor,
	ImageExtractor,
	ImageExtractorEmbded,
}

class ContentExtractor {
	private extractor: Extractor<any>;
	private app: App;
	private plugin: TextGeneratorPlugin;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	setExtractor(extractorName: ExtractorMethod) {
		logger("set Extractor", { extractorName });
		this.extractor = this.createExtractor(extractorName);
	}

	async convert(doc: any): string {
		// Use the selected splitter to split the text
		this.plugin.startProcessing(false);
		const text = await this.extractor.convert(doc);
		this.plugin.endProcessing(false);
		return text;
	}

	async extract(filePath: string): Promise<TAbstractFile[]> {
		return this.extractor.extract(filePath);
	}

	private createExtractor(extractorName: ExtractorMethod): Extractor<any> {
		switch (extractorName) {
			case ExtractorMethod.PDFExtractor:
				return new PDFExtractor(this.app, this.plugin);
			case ExtractorMethod.WebPageExtractor:
				return new WebPageExtractor(this.app, this.plugin);
			case ExtractorMethod.YoutubeExtractor:
				return new YoutubeExtractor(this.app, this.plugin);
			case ExtractorMethod.AudioExtractor:
				return new AudioExtractor(this.app, this.plugin);
			case ExtractorMethod.ImageExtractor:
				return new ImageExtractor(this.app, this.plugin);
			case ExtractorMethod.ImageExtractorEmbded:
				return new ImageExtractorEmbded(this.app, this.plugin);
			default:
				throw new Error(`Unknown Extractor: ${extractorName}`);
		}
	}
}

export { ContentExtractor, ExtractorMethod, Extractor };

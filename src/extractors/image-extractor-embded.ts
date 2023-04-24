import { App, TAbstractFile } from "obsidian";
import TextGeneratorPlugin from "src/main";
import Tesseract from "tesseract.js";
import debug from "debug";
import { Extractor } from "./extractor";

const logger = debug("textgenerator:Extractor:ImageExtractorEmbded");

export default class ImageExtractorEmbded implements Extractor<TAbstractFile> {
	private app: App;
	private plugin: TextGeneratorPlugin;

	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	async convert(doc: TAbstractFile): Promise<string> {
		logger("convert", { doc });
		const imageBuffer = await this.app.vault.adapter.readBinary(doc.path);

		try {
			const result = await Tesseract.recognize(imageBuffer, "eng", {
				logger: (m) => logger(m),
			});

			const extractedText = result.data.text;
			logger("convert end", { extractedText });

			return extractedText;
		} catch (error) {
			logger("convert error", { error });
			return "Error extracting text from the image.";
		}
	}

	async extract(filePath?: string): Promise<TAbstractFile[]> {
		const embeds = this.app.metadataCache
			.getCache(filePath)
			?.embeds?.filter((embed) =>
				/\.(jpe?g|png|webp|bmp|pbm)$/i.test(embed.link)
			);
		if (!embeds) {
			return [];
		}

		return embeds.map(
			(embed) =>
				this.app.metadataCache.getFirstLinkpathDest(
					embed.link,
					filePath
				) as TAbstractFile
		);
	}
}

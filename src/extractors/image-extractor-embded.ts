import { App, TAbstractFile } from "obsidian";
import TextGeneratorPlugin from "src/main";
import Tesseract from "tesseract.js";
import debug from "debug";
import { Extractor } from "./extractor";

const logger = debug("textgenerator:Extractor:ImageExtractorEmbded");

export default class ImageExtractorEmbded extends Extractor<TAbstractFile> {
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
	}

	async convert(doc: TAbstractFile) {
		logger("convert", { doc });
		const imageBuffer = await this.app.vault.adapter.readBinary(doc.path);
		try {
			const result = await Tesseract.recognize(
				Buffer.from(imageBuffer),
				"eng",
				{
					logger: (m) => logger(m),
				}
			);

			const extractedText = result.data.text;
			logger("convert end", { extractedText });

			return extractedText;
		} catch (error) {
			logger("convert error", { error });
			return "Error extracting text from the image.";
		}
	}

	async extract(filePath?: string) {
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

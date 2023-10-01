import { App, TAbstractFile } from "obsidian";
import TextGeneratorPlugin from "src/main";
import Tesseract from "tesseract.js";
import debug from "debug";
import { Extractor } from "./extractor";

const logger = debug("textgenerator:Extractor:ImageExtractorEmbded");

export default class ImageExtractorEmbded extends Extractor {
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
  }

  async convert(docPath: string) {
    logger("convert", { docPath });
    const imageBuffer = await this.app.vault.adapter.readBinary(docPath);
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

  async extract(filePath: string) {
    const embeds = this.app.metadataCache
      .getCache(filePath)
      ?.embeds?.filter((embed) =>
        /\.(jpe?g|png|webp|bmp|pbm)$/i.test(embed.link)
      );
    if (!embeds) {
      return [];
    }

    return embeds
      .map(
        (embed) =>
          this.app.metadataCache.getFirstLinkpathDest(embed.link, filePath)
            ?.path
      )
      .filter(Boolean) as string[];
  }
}

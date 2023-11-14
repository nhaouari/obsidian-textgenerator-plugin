import { App } from "obsidian";
import TextGeneratorPlugin from "src/main";
import Tesseract from "tesseract.js";
import debug from "debug";
import { Extractor } from "./extractor";

const logger = debug("textgenerator:Extractor:ImageExtractor");

export default class ImageExtractor extends Extractor {
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
  }

  async convert(url: string) {
    logger("convert", { url });

    try {
      const result = await Tesseract.recognize(url, "eng", {
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

  async extract(filePath: string, fileContent: string) {
    logger("extract", { filePath });
    const urls = this.extractUrls(fileContent);
    logger("extract end", { urls });
    return urls;
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+\.(?:jpe?g|png|webp|bmp|pbm)/gi;
    const matches = text.match(urlRegex);
    if (!matches) {
      return [];
    }
    const uniqueUrls = new Set(matches);
    return [...uniqueUrls];
  }
}

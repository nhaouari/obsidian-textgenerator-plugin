import { App } from "obsidian";
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
export const Extractors = {
  PDFExtractor,
  WebPageExtractor,
  YoutubeExtractor,
  AudioExtractor,
  ImageExtractor,
  ImageExtractorEmbded,
} as const;

export type ExtractorMethod = keyof typeof Extractors;

export class ContentExtractor<d> {
  private extractor: Extractor<d>;
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

  async convert(doc: d): Promise<string> {
    // Use the selected splitter to split the text
    this.plugin.startProcessing(false);
    const text = await this.extractor.convert(doc);
    this.plugin.endProcessing(false);
    return text;
  }

  async extract(filePath: string) {
    return this.extractor.extract(filePath);
  }

  private createExtractor(extractorName: ExtractorMethod) {
    if (!Extractors[extractorName])
      throw new Error(`Unknown Extractor: ${extractorName}`);
    return new Extractors[extractorName](this.app, this.plugin) as Extractor<d>;
  }
}

export const getExtractorMethods = () => {
  return Object.keys(Extractors).filter(
    (e) => !(parseInt(e) || e === "0")
  ) as unknown as ExtractorMethod[];
};

export { Extractor };

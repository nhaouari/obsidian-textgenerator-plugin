import { App } from "obsidian";
import PDFExtractor from "./pdf-extractor";
import WebPageExtractorHTML from "./web-extractor";
import WebPageExtractor from "./web-extractor/markdown";
import YoutubeExtractor from "./youtube-extractor";
import AudioExtractor from "./audio-extractor";
import { Extractor } from "./extractor";
import TextGeneratorPlugin from "../main";
import debug from "debug";
import ImageExtractor from "./image-extractor";
import ImageExtractorEmbded from "./image-extractor-embded";
const logger = debug("textgenerator:Extractor");


export const listOfUsableExtractors = [
  "PDFExtractor", "WebPageExtractor", "YoutubeExtractor", "AudioExtractor", "ImageExtractor"
]


// Add the new Extractor here
export const Extractors = {
  PDFExtractor,
  WebPageExtractor,
  WebPageExtractorHTML,
  YoutubeExtractor,
  AudioExtractor,
  ImageExtractor,
  ImageExtractorEmbded,
} as const;

export const ExtractorSlug = {
  pdf: "PDFExtractor",

  web: "WebPageExtractor",
  web_md: "WebPageExtractor",
  web_html: "WebPageExtractorHTML",

  yt: "YoutubeExtractor",
  youtube: "YoutubeExtractor",
  audio: "AudioExtractor",
  img: "ImageExtractor",
  ImgEmbd: "ImageExtractorEmbded",
} as const;


export const UnExtractorSlug: Record<string, string> = {};
for (const key in ExtractorSlug) {
  if (Object.prototype.hasOwnProperty.call(ExtractorSlug, key)) {
    UnExtractorSlug[ExtractorSlug[key as keyof typeof ExtractorSlug]] = key;
  }
}

export type ExtractorMethod = keyof typeof Extractors;

export class ContentExtractor {
  private extractor: Extractor;
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

  async convert(docPath: string, otherOptions?: any): Promise<string> {
    // Use the selected splitter to split the text
    this.plugin.startProcessing(false);
    const text = await this.extractor.convert(docPath.trimStart().trimEnd(), otherOptions);
    this.plugin.endProcessing(false);
    return text;
  }

  async extract(filePath: string) {
    return this.extractor.extract(filePath);
  }

  private createExtractor(extractorName: ExtractorMethod) {
    if (!Extractors[extractorName])
      throw new Error(`Unknown Extractor: ${extractorName}`);
    return new Extractors[extractorName](this.app, this.plugin) as Extractor;
  }
}

export const getExtractorMethods = () => {
  return listOfUsableExtractors as unknown as ExtractorMethod[];
};

export { Extractor };

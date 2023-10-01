import { App } from "obsidian";
import { YoutubeTranscript } from "./youtube-extractor/youtube-transcript";
import { Extractor } from "./extractor";
import debug from "debug";
import TextGeneratorPlugin from "src/main";

const logger = debug("textgenerator:Extractor:YoutubeTranscriptionExtractor");

export default class YoutubeExtractor extends Extractor {
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
  }

  async convert(url: string) {
    logger("convert", { url });
    const transcription = await YoutubeTranscript.fetchTranscript(url);
    const text = transcription?.reduce((acc, curr) => {
      return acc + curr.text + " ";
    }, "");
    logger("convert end", { text });
    return text || "";
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
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s)\]]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) {
      return [];
    }

    const uniqueUrls = new Set(matches);
    return [...uniqueUrls];
  }
}

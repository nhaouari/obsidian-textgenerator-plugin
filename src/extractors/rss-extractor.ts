import { App, TFile, Platform } from "obsidian";
import { Extractor } from "./extractor";
import debug from "debug";
import TextGeneratorPlugin from "src/main";

import type { Item } from "rss-parser";
import type PArser from "rss-parser";

let Parser: typeof PArser;

if (Platform.isDesktop) {
  // @ts-ignore
  Parser = require("rss-parser");
}

const logger = debug("textgenerator:Extractor:RssExtractor");

export default class RssExtractor extends Extractor {
  parser: PArser;

  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
    this.parser = new Parser();
  }

  // Converts an RSS feed URL to a text representation
  async convert(url: string): Promise<string> {
    if (!Platform.isDesktop) throw new Error("rss is only supported in desktop")

    logger("convert", { url });
    try {
      const feed = await this.parser.parseURL(url);
      const text = feed.items.reduce((acc, curr) => {
        return acc + this.itemToText(curr);
      }, "");
      logger("convert end", { text });
      return text;
    } catch (error) {
      logger("convert error", error);
      throw error; // Or handle the error as you see fit
    }
  }

  async extract(filePath: string, fileContent: string) {
    logger("extract", { filePath });
    const urls = this.extractUrls(fileContent);
    logger("extract end", { urls });
    return urls;
  }

  // Extracts URLs ending with .rss from a given text
  private extractUrls(text: string): string[] {
    // This regex matches URLs that start with 'http://' or 'https://',
    // followed by any characters that are not whitespace, and end with
    // '.rss', ':feed', 'rss', or 'feeds', at a word boundary, not followed by other URL-valid characters.
    const rssUrlRegex = /https?:\/\/[^\s]+?(?:\.rss|:feed|\/rss|\/feeds)\b(?![\w\-\.%])/g;
    const matches = text.match(rssUrlRegex);
    console.log({
      text, matches
    })
    return matches ? Array.from(new Set(matches)) : [];
  }



  // Optionally, extract URLs from a given file
  async extractFromFile(file: TFile): Promise<string[]> {
    const content = await this.app.vault.read(file);
    return this.extractUrls(content);
  }

  // Convert an individual RSS item to text
  private itemToText(item: Item): string {
    // Modify this method based on the specific fields you want to include in the text
    let itemText = "";
    if (item.title) {
      itemText += `Title: ${item.title}\n`;
    }
    if (item.link) {
      itemText += `Link: ${item.link}\n`;
    }
    if (item.contentSnippet) {
      itemText += `Description: ${item.contentSnippet}\n`;
    }
    if (item.content) {
      itemText += `Content: \n ${item.content}\n`;
    }
    itemText += "\n"; // Add a new line after each item for readability
    return itemText;
  }

}
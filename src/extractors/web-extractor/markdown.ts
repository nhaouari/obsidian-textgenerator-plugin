import TurndownService from "turndown";
import { Readability } from "@mozilla/readability";
import debug from "debug";
import WebPageExtractor from ".";

const logger = debug("textgenerator:Extractor:WebPageExtractor");
export default class WebPageExtractorMD extends WebPageExtractor {
  async convert(url: string, selector?: string | string[]) {
    logger("convert", { url });
    const doc = await this.getContent(url, selector);
    const turndownService = new TurndownService({
      headingStyle: "atx",
    });

    const article = new Readability(doc).parse();
    const markdown =
      (selector ? "" : "# " + article?.title + "\n") +
      turndownService.turndown("" + article?.content);

    logger("convert end", { markdown });

    if (article?.content) {
      return markdown;
    } else {
      return "No content found";
    }
  }
}

import { App, request, Platform } from "obsidian";
import { Extractor } from "../extractor";
import TextGeneratorPlugin from "src/main";
import debug from "debug";

// @ts-ignore
let remote: typeof import("electron").remote;

if (!Platform.isMobile) {
  remote = require("electron")?.remote;
}

const logger = debug("textgenerator:Extractor:WebPageExtractor");
export default class WebPageExtractor extends Extractor {
  constructor(app: App, plugin: TextGeneratorPlugin) {
    super(app, plugin);
  }

  async getContent(url: string, selector?: string | string[]) {
    logger("convert", { url });
    let response: string;

    if (Platform.isMobile) {
      response = await request({ url });
    } else {
      const win = new remote.BrowserWindow({ show: false });

      const cookie = {
        url: new URL(url).origin,
        name: "dummy_name",
        value: "dummy",
      };

      console.log({ cookie });

      await win.webContents.session.cookies.set(cookie);

      win.webContents.userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";

      await win.loadURL(url);
      response = await win.webContents.executeJavaScript(
        "document.documentElement.outerHTML"
      );
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(response, "text/html");

    // try to parse it
    try {
      selector = JSON.parse(selector as any);
    } catch {
      // empty
    }

    if (selector) {
      const selectors = Array.isArray(selector) ? selector : [selector];

      const total: any[] = [];

      selectors.forEach((s) => {
        doc.body.querySelectorAll(s).forEach((q) => {
          total.push(q);
        });
      });

      doc.body.innerHTML = "";

      const list = doc.body.createEl(total.length > 1 ? "ol" : "div");

      total.forEach((t) =>
        (total.length > 1 ? list.createEl("li") : list).appendChild(t)
      );

      console.log(doc.body.innerText);
    }

    return doc;
  }

  async convert(url: string, selector?: string | string[]) {
    const doc = await this.getContent(url, selector);
    return doc.body.innerHTML;
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

  protected extractUrls(text: string): string[] {
    const urlRegex =
      /(https?:\/\/(?!.*\.(?:mp3|mp4|mov|avi|pdf|png|jpe?g|gif))[^\s)\]]+)/g;
    const youtubeRegex =
      /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s)\]]+/g;
    const matches = text.match(urlRegex);
    if (!matches) {
      return [];
    }
    const uniqueUrls = new Set(
      matches.filter((url) => !youtubeRegex.test(url))
    );
    return [...uniqueUrls];
  }
}

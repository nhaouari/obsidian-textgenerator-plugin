import { App } from "obsidian";
import TextGeneratorPlugin from "../main";

export class Extractor {
  protected app: App;
  protected plugin: TextGeneratorPlugin;
  constructor(app: App, plugin: TextGeneratorPlugin) {
    this.app = app;
    this.plugin = plugin;
  }
  /** Read content as string */
  async convert(docPath: string, otherOptions?: any): Promise<string> {
    throw Error("Function convert is not implemented");
  }

  /** extract embedded files in a file as documents */
  async extract(filePath: string, fileContent: string): Promise<string[]> {
    throw Error("Function extract is not implemented");
  }
}

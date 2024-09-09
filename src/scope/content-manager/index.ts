import type { View } from "obsidian";
import MarkdownManager from "./md";
import ExcalidrawManager from "./ea";
import CanvasManager from "./canvas";
import { ContentManager, Options } from "./types";
import TextGeneratorPlugin from "#/main";
export default class ContentManagerCls {
  static compile(
    view: View,
    plugin: TextGeneratorPlugin,
    otherOptions?: {
      templatePath?: string;
      templateContent?: string;
    }
  ): ContentManager {
    const type = view.getViewType();

    let wrapInBlockQuote = plugin.settings.outputToBlockQuote;

    if (otherOptions?.templatePath) {
      const templateMetadata = plugin.contextManager.getMetaData(otherOptions.templatePath);
      wrapInBlockQuote = templateMetadata?.frontmatter?.outputToBlockQuote ?? wrapInBlockQuote;
    } else if (otherOptions?.templateContent) {
      const templateFrontmatter = plugin.contextManager.extractFrontmatterFromTemplateContent(otherOptions.templateContent);
      wrapInBlockQuote = templateFrontmatter?.outputToBlockQuote ?? wrapInBlockQuote;
    }

    const options: Options = {
      wrapInBlockQuote: wrapInBlockQuote,
    };

    switch (type) {
      case "markdown": {
        // @ts-ignore
        const editor = view?.editor || view.app.workspace.activeEditor?.editor;
        if (!editor) throw "couldn't find the editor fsr";
        return new MarkdownManager(editor, view, options);
      }
      case "excalidraw": {
        // @ts-ignore
        const ea = view.app.plugins?.plugins["obsidian-excalidraw-plugin"]?.ea;
        if (!ea) throw "couldn't find the Escalidraw plugin fsr";
        ea.setView(view);
        ea.clear();
        return new ExcalidrawManager(ea, view, options);
      }
      case "canvas":
        // @ts-ignore
        if (!view.canvas) throw "couldn't find the canvas plugin fsr";
        // @ts-ignore
        return new CanvasManager(view.canvas, view);
      default:
        throw `The content ${type} is not supported`;
    }
  }
}

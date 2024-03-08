import ContentManagerCls from "#/scope/content-manager";
import TextGeneratorPlugin from "#/main";
import { MarkdownPostProcessorContext, MarkdownRenderer } from "obsidian";
import debug from "debug";
const logger = debug("textgenerator:tgBlock");

export default class TGBlock {
  plugin: TextGeneratorPlugin;
  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;

    this.plugin.registerMarkdownCodeBlockProcessor(
      "tg",
      async (source, el, ctx) => {
        this.blockTgHandler(source, el, ctx);
      }
    );
  }

  async blockTgHandler(
    source: string,
    container: HTMLElement,
    { sourcePath: path }: MarkdownPostProcessorContext
  ) {
    setTimeout(async () => {
      try {
        const {
          inputTemplate,
          outputTemplate,
          inputContent,
          outputContent,
          preRunnerContent,
        } = this.plugin.contextManager.splitTemplate(source);

        const activeView = this.plugin.getActiveViewMD();

        if (!activeView) throw "active view wasn't detected";

        const CM = ContentManagerCls.compile(activeView, this.plugin);

        const context = {
          ...(activeView
            ? await this.plugin.contextManager.getContext({
                editor: CM,
                filePath: activeView?.file?.path,
                templateContent: inputContent,
              })
            : {}),
        };

        const markdown = await inputTemplate(context.options);

        console.log(markdown);
        await MarkdownRenderer.render(
          this.plugin.app,
          markdown,
          container,
          path,
          this.plugin
        );

        this.addTGMenu(container, markdown, source, outputTemplate);
      } catch (e) {
        console.warn(e);
      }
    }, 100);
  }

  private addTGMenu(
    el: HTMLElement,
    markdown: string,
    source: string,
    outputTemplate: any
  ) {
    const div = document.createElement("div");
    div.classList.add("plug-tg-tgmenu", "plug-tg-flex", "plug-tg-justify-end");
    const generateSVG = `<svg viewBox="0 0 100 100" class="svg-icon GENERATE_ICON"><defs><style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:4px;}</style></defs><g id="Layer_2" data-name="Layer 2"><g id="VECTOR"><rect class="cls-1" x="74.98" y="21.55" width="18.9" height="37.59"></rect><path class="cls-1" d="M38.44,27.66a8,8,0,0,0-8.26,1.89L24.8,34.86a25.44,25.44,0,0,0-6,9.3L14.14,56.83C11.33,64.7,18.53,67.3,21,60.9" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="74.98 25.58 56.61 18.72 46.72 15.45"></polyline><path class="cls-1" d="M55.45,46.06,42.11,49.43,22.76,50.61c-8.27,1.3-5.51,11.67,4.88,12.8L46.5,65.78,53,68.4a23.65,23.65,0,0,0,17.9,0l6-2.46" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M37.07,64.58v5.91A3.49,3.49,0,0,1,33.65,74h0a3.49,3.49,0,0,1-3.45-3.52V64.58" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M48,66.58v5.68a3.4,3.4,0,0,1-3.34,3.46h0a3.4,3.4,0,0,1-3.34-3.45h0V65.58" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="28.75 48.05 22.66 59.3 13.83 65.61 14.41 54.5 19.11 45.17"></polyline><polyline class="cls-1" points="25.17 34.59 43.75 0.25 52.01 5.04 36.39 33.91"></polyline><line class="cls-1" x1="0.25" y1="66.92" x2="13.83" y2="66.92"></line></g></g></svg>`;

    const button = this.plugin.createRunButton("Generate Text", generateSVG);
    button.addEventListener("click", async () => {
      const activeView = this.plugin.getActiveViewMD();
      if (!activeView) throw "activeView wasn't detected";
      const CM = ContentManagerCls.compile(activeView, this.plugin);
      console.log(markdown);
      if (activeView)
        await this.plugin.textGenerator.generatePrompt(
          markdown,
          CM,
          outputTemplate
        );

      logger(`addTGMenu Generate Text`, {
        markdown: markdown,
        source: source,
      });
    });

    const createTemplateSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const buttonMakeTemplate = this.plugin.createRunButton(
      "Create a new Template",
      createTemplateSVG
    );
    buttonMakeTemplate.addEventListener("click", async () => {
      await this.plugin.textGenerator.createTemplate(source, "newTemplate");
      logger(`addTGMenu MakeTemplate`, {
        markdown: markdown,
        source: source,
      });
    });

    div.appendChild(buttonMakeTemplate);
    div.appendChild(button);
    el.parentElement?.appendChild(div);
  }
}

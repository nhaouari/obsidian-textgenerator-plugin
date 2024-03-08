import { App, Modal, Setting } from "obsidian";
import TextGeneratorPlugin from "src/main";
import debug from "debug";
const logger = debug("textgenerator:SetMaxTokens");
export class SetMaxTokens extends Modal {
  result: string;
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;

  constructor(
    app: App,
    plugin: TextGeneratorPlugin,
    result: string,
    onSubmit: (result: string) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.result = result;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    logger("onOpen");
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Max number of tokens" });
    setTimeout(() => {
      contentEl.addEventListener("keyup", (event) => {
        event.preventDefault();
        if (event.key === "Enter") {
          this.close();
          this.onSubmit(this.result);
        }
      });
    }, 500);

    new Setting(contentEl)
      .setName("Max number of tokens")
      .setDesc(
        "The max number of the tokens that will be generated (1000 tokens ~ 750 words)"
      )
      .addText((text) =>
        text
          .setPlaceholder("max_tokens")
          .setValue(this.result.toString())
          .onChange(async (value) => {
            this.result = value;
            await this.plugin.saveSettings();
          })
          .inputEl.select()
      );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Submit")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.result);
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

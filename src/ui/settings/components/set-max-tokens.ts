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

    contentEl.createEl("h1", { text: "最大 Token 数" });
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
      .setName("最大 Token 数")
      .setDesc(
        "生成的最大 Token 数量（1000 Token ≈ 750 个英文单词）"
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
        .setButtonText("确定")
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

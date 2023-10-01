import { App, Modal, Setting, Notice } from "obsidian";
import debug from "debug";
const logger = debug("textgenerator:SetPath");
export class SetPath extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  info:
    | { title?: string | undefined; content?: string | undefined }
    | undefined;

  constructor(
    app: App,
    result: string,
    onSubmit: (result: string) => void,
    info?: { title?: string; content?: string }
  ) {
    super(app);
    this.result = result;
    this.onSubmit = onSubmit;
    this.info = info;
  }

  onOpen() {
    logger("onOpen");
    const { contentEl } = this;

    contentEl.createEl("h1", {
      text: `New Document Path ${
        this.info?.title ? `(${this.info.title})` : ""
      }`,
    });

    if (this.info?.content) {
      const resi = contentEl.createEl("div", {
        cls: "w-full",
      });

      resi.createEl("span", {
        text: "Content",
      });

      console.log("generated", this.info.content);
      resi.createEl("textarea", {
        text: this.info?.content,
        cls: "overflow-y-auto max-h-64 w-full",
      }).disabled = true;
    }

    setTimeout(() => {
      contentEl.addEventListener("keyup", async (event) => {
        event.preventDefault();
        if (event.key === "Enter") {
          try {
            this.onSubmit(this.result);
            this.close();
          } catch (error) {
            new Notice("🔴Error: File already exists. Choose another path.");
            console.error(error);
          }
        }
      });
    }, 100);

    new Setting(contentEl).setName("Path").addText((text) =>
      text
        .setPlaceholder("Path")
        .setValue(this.result.toString())
        .onChange((value) => {
          this.result = value;
        })
        .inputEl.setAttribute("size", "50")
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Submit")
        .setCta()
        .onClick(async () => {
          try {
            this.onSubmit(this.result);
            this.close();
          } catch (error) {
            new Notice("🔴Error: File already exists. Choose another path.");
            console.error(error);
          }
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

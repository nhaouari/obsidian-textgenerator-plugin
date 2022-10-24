import { App, Modal, Setting } from "obsidian";

export class SetMaxTokens extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, result:string, onSubmit: (result: string) => void) {
    super(app);
    this.result=result;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Max number of tokens" });

    contentEl.addEventListener("keyup", (event)=> {
        event.preventDefault();
        if (event.key === "Enter") {
            this.close();
            this.onSubmit(this.result);  
        }
    })

    new Setting(contentEl)
      .setName("Max number of tokens")
      .addText((text) =>text
        .setPlaceholder('max_tokens')
	    .setValue(this.result.toString())
        .onChange((value) => {
          this.result = value
        }));

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
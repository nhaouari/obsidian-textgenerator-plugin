import { App, Modal, Setting } from "obsidian";
import TextGeneratorPlugin from "src/main";

export class SetMaxTokens extends Modal {
  result: string;
  plugin: TextGeneratorPlugin;
  onSubmit: (result: string) => void;

  constructor(app: App, plugin:TextGeneratorPlugin,result:string, onSubmit: (result: string) => void) {
    super(app);
    this.plugin=plugin
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
      .setDesc('The max number of the tokens that will be generated (1000 tokens ~ 750 words)')
      .addText((text) =>text
        .setPlaceholder('max_tokens')
	    .setValue(this.result.toString())
        .onChange(async(value) => {
          this.result = value
          await this.plugin.saveSettings();
        })
        .inputEl.select()
        )
       


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
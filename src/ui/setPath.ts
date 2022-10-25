import { App, Modal, Setting,Notice } from "obsidian";

export class SetPath extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, result:string, onSubmit: (result: string) => void) {
    super(app);
    this.result=result;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "New Document Path" });
    setTimeout(()=>{
      contentEl.addEventListener("keyup", async(event)=> {
        event.preventDefault();
        if (event.key === "Enter") {
          try {
             await this.onSubmit(this.result);
             this.close();
           } catch (error) {
             new Notice("🔴Error: File already exists. Choose another path.");
             console.error(error);    
           }
        }
    })

    },100);


    new Setting(contentEl)
      .setName("Path")
      .addText((text) =>text
        .setPlaceholder('Path')
	      .setValue(this.result.toString())
        .onChange((value) => {
          this.result = value
        })
        .inputEl.setAttribute("size","50")
        );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(async() => {
            try {
             await this.onSubmit(this.result);
              this.close();
            } catch (error) {
              console.error(error);    
            }


          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
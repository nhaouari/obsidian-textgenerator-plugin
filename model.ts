import { App, Notice, FuzzySuggestModal } from "obsidian";

interface Template {
  title: string;
  path: string;
}

const promptsPath= "templates/prompts";
const paths = app.metadataCache.getCachedFiles().filter(path=>path.includes(promptsPath));
const templates = paths.map(s=>({title:s.substring(promptsPath.length+1),path:s}))

export class ExampleModal extends FuzzySuggestModal <Template> {
 constructor(app: App, onChoose: (result: string) => void) {
        super(app);
        this.onChoose = onChoose;
      }

      getItems(): Template[] {
        return templates;
      }
    
      getItemText(template: Template): string {
        return template.title;
      }
    
      onChooseItem(template: Template, evt: MouseEvent | KeyboardEvent) {
        new Notice(`Selected ${template.title}`);
        this.onChoose(template);
      }
}
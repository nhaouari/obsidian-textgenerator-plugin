import { App, Notice, FuzzySuggestModal } from "obsidian";

interface Template {
  title: string;
  path: string;
  desc: string;
  auth: string;
}



export class ExampleModal extends FuzzySuggestModal <Template> {
 constructor(app: App, onChoose: (result: string) => void) {
        super(app);
        this.onChoose = onChoose;
      }

      getItems(): Template[] {
        const promptsPath= "templates/prompts";
        const paths = app.metadataCache.getCachedFiles().filter(path=>path.includes(promptsPath));
        const templates = paths.map(s=>({title:s.substring(promptsPath.length+1),path:s,...this.getMetadata(s)}))

        return templates;
      }
    
    getMetadata(path:string) {
        const metadata=this.getFrontmatter(path);
        const validedMetaData:any= {}
        if(metadata?.TG_Name){
            validedMetaData["title"]=metadata?.TG_Name;
        }

        if(metadata?.TG_Desc){
            validedMetaData["desc"]=metadata?.TG_Desc;
        }

        return validedMetaData;
    }
    
    getFrontmatter(path:string="") {
        const cache = this.app.metadataCache.getCache(path);
            if (cache.hasOwnProperty('frontmatter')) {
                return cache.frontmatter;
            }
        return null
    }
    
       // Renders each suggestion item.
    renderSuggestion(template: Template, el: HTMLElement) {
      el.createEl("div", { text: template.item.title});
      el.createEl("small", { text: template.item.desc,cls:"desc" });
      el.createEl("div",{});
      el.createEl("small", { text: template.item.path,cls:"path" });
    }

      getItemText(template: Template): string {
        return template.title+template.desc;
      }
    
      onChooseItem(template: Template, evt: MouseEvent | KeyboardEvent) {
        new Notice(`Selected ${template.title}`);
        this.onChoose(template);
      }
}
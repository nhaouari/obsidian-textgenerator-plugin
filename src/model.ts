import { App, Notice, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import TextGeneratorPlugin from "./main";
import {PromptTemplate} from './types';
import debug from 'debug';
const logger = debug('textgenerator:model');
export class ExampleModal extends FuzzySuggestModal <PromptTemplate> {
plugin:TextGeneratorPlugin;
title:string;
 constructor(app: App, plugin:TextGeneratorPlugin, onChoose: (result: string) => void,title:string="") {
        super(app);
        this.onChoose = onChoose;
        this.plugin=plugin;
        this.title = title;
        this.modalEl.insertBefore(createEl("div", {text: title,cls:"modelTitle"}),this.modalEl.children[0]);
      }

      getItems(): PromptTemplate[] {
        logger ("getItems");
        const promptsPath= this.plugin.settings.promptsPath;
        const paths = app.metadataCache.getCachedFiles().filter(path=>path.includes(promptsPath)&&!path.includes("/trash/"));
        const templates = paths.map(s=>({title:s.substring(promptsPath.length+1),path:s,...this.getMetadata(s)}))
        logger ("getItems templates end",templates);
        return templates;
      }

    
       getMetadata(path:string) {
        logger ("getMetadata",path);
        const metadata=this.getFrontmatter(path);
        const validedMetaData:any= {}

        if(metadata?.PromptInfo?.promptId){
          validedMetaData["id"]=metadata.PromptInfo.promptId;
        }

        if(metadata?.PromptInfo?.name){
            validedMetaData["name"]=metadata.PromptInfo.name;
        }

        if(metadata?.PromptInfo?.description){
            validedMetaData["description"]=metadata.PromptInfo.description;
        }

        if(metadata?.PromptInfo?.required_values){
          validedMetaData["required_values"]=metadata.PromptInfo.required_values;
        }

        if(metadata?.PromptInfo?.author){
          validedMetaData["author"]=metadata.PromptInfo.author;
        }

        if(metadata?.PromptInfo?.tags){
          validedMetaData["tags"]=metadata.PromptInfo.tags;
        }

        if(metadata?.PromptInfo?.version){
          validedMetaData["version"]=metadata.PromptInfo.version;
        }

        if(metadata?.PromptInfo?.commands){
          validedMetaData["commands"]=metadata.PromptInfo.commands;
        }

        logger ("getMetadata validedMetaData end",validedMetaData);
        return validedMetaData;
    }
    
    getFrontmatter(path:string="") {
        logger ("getFrontmatter",path);
        const cache = this.app.metadataCache.getCache(path);
            if (cache.hasOwnProperty('frontmatter')) {
              logger ("getFrontmatter end",{cache:cache.frontmatter});
                return cache.frontmatter;
            }
            logger ("getFrontmatter end",{cache:null});
        return null
    }

       // Renders each suggestion item.
    renderSuggestion(template: FuzzyMatch<PromptTemplate>, el: HTMLElement) {
      logger("renderSuggestion",template);
      el.createEl("div", { text: template.item.name});
      el.createEl("small", { text: template.item.description,cls:"desc" });
      el.createEl("div",{});
      el.createEl("small", { text: template.item.path,cls:"path" });
      logger("renderSuggestion end",template);
    }

      getItemText(template: PromptTemplate): string {
        return template.name+template.description+template.author+template.tags+template.path;
      }
    
      onChooseItem(template: PromptTemplate, evt: MouseEvent | KeyboardEvent) {
        logger("onChooseItem",template);
        new Notice(`Selected ${template.name}`);
        this.onChoose(template);
      }
}
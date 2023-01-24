import { TemplateModelUI } from './ui/TemplateModelUI';
import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases, MetadataCache} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './reqFormatter';
import { SetPath } from './ui/setPath';
import ContextManager from './ContextManager';
import {makeid,createFileWithInput,openFile,removeYMAL} from './utils';

export default class TextGenerator {
    plugin: TextGeneratorPlugin;
    app: App;
    reqFormatter: ReqFormatter;
    contextManager: ContextManager; 

	constructor(app: App, plugin: TextGeneratorPlugin) {
        this.app = app;
		this.plugin = plugin;
       
        this.contextManager= new ContextManager(app,plugin);
        this.reqFormatter = new ReqFormatter(app,plugin,this.contextManager);
	}
    
    async generate(prompt:string,insertMetadata: boolean = false,params: any=this.plugin.settings,templatePath:string="") {
        if(!this.plugin.processing){
            let reqParameters:any = this.reqFormatter.addContext(params,prompt);
            reqParameters=this.reqFormatter.prepareReqParameters(reqParameters,insertMetadata,templatePath);
            // this statisticly get close to the number of tokens that are used by gpt-3
            let estimatedTokens = Math.ceil((prompt.length - prompt.split(' ').length) / 10 * 3);
            let text
            try {
                this.plugin.startProcessing(estimatedTokens);
                text = await this.getGeneratedText(reqParameters);
                this.plugin.endProcessing();
                //console.log(text.replace(/^\n*/g,""));
                return text.replace(/^\n*/g," ");
            } catch (error) {
                console.error(error);
                this.plugin.endProcessing();
                return Promise.reject(error);
            }
        } else {
            return Promise.reject(new Error("There is another generation process"));
        }
    }
    
    getCursor(editor:Editor){
        let cursor= editor.getCursor();
        let selectedText = editor.getSelection();
        if (selectedText.length === 0) {
            const lineNumber = editor.getCursor().line;
            selectedText = editor.getLine(lineNumber);
            if (selectedText.length!==0){
                cursor.ch=selectedText.length
            }
        }
        return cursor;
    }

    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true) {
        const cursor= this.getCursor(editor);
        const context = await this.contextManager.getContext(editor,insertMetadata,templatePath);
        const text = await this.generate(context,insertMetadata,params,templatePath);
        if(activeFile===false){
            const title=this.app.workspace.activeLeaf.getDisplayText();
            let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
            
            new SetPath(this.app,suggestedPath,async (path: string) => {
                const file= await createFileWithInput(path,context+text,this.app);
                openFile(this.app,file);
              }).open();
          } else {
            this.insertGeneratedText(text,editor,cursor);
          }  
    }
    
    async generateInEditor(params: TextGeneratorSettings, insertMetadata: boolean = false,editor:Editor) {
        const cursor= this.getCursor(editor);
        const text = await this.generate(await this.contextManager.getContext(editor,insertMetadata),insertMetadata,params);
        this.insertGeneratedText(text,editor,cursor);
    }
  
    async generatePrompt(promptText: string, insertMetadata: boolean = false,editor:Editor) {
        const cursor= this.getCursor(editor);
        const text = await this.generate(promptText,insertMetadata);
        this.insertGeneratedText(text,editor,cursor);
    }

    async createToFile(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true){
        const context = await this.contextManager.getContext(editor,insertMetadata,templatePath);

        if(activeFile===false){
        const title=this.app.workspace.activeLeaf.getDisplayText();
        let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
        
        new SetPath(this.app,suggestedPath,async (path: string) => {
            const file= await createFileWithInput(path,context,this.app);
            openFile(this.app,file);
          }).open();

      } else {
        this.insertGeneratedText(context,editor);
      }  
    }

    async createTemplateFromEditor(editor:Editor) {
        const title=this.app.workspace.activeLeaf.getDisplayText();
        const content= editor.getValue();
        await this.createTemplate(content,title);     
    }



    async createTemplate(content:string,title:string=""){
const promptInfo= 
`PromptInfo:
 promptId: ${title}
 name: 🗞️${title} 
 description: ${title}
 required_values: 
 author: 
 tags: 
 version: 0.0.1`
        
        let templateContent = content;
        const metadata = this.contextManager.getMetaData();
                // We have three cases: no Front-matter / Frontmatter without PromptInfo/ Frontmatter with PromptInfo 
        if (!metadata.hasOwnProperty("frontmatter")) {
            templateContent=`---\n${promptInfo}\n---\n${templateContent}`
        } else if (!metadata["frontmatter"].hasOwnProperty("PromptInfo")) {
            if(templateContent.indexOf("---")!==-1){
                templateContent=templateContent.replace("---",`---\n${promptInfo}`);
            } else {
                templateContent=`---\n${promptInfo}\n---\n${templateContent}`;
            }
        } 
        const suggestedPath = `${this.plugin.settings.promptsPath}/local/${title}.md`;
        new SetPath(this.app,suggestedPath,async (path: string) => {
            const file= await createFileWithInput(path,templateContent,this.app);
            openFile(this.app,file);
          }).open(); 
        }

    async getGeneratedText(reqParams: any) {
            const extractResult = reqParams?.extractResult;
            delete reqParams?.extractResult;
            let requestResults;
            try {
                requestResults = JSON.parse(await request(reqParams));
                console.log({requestResults});
            } catch (error) {
                console.error(requestResults,error);
                return Promise.reject(error);
            }
            const text = eval(extractResult);
            return text
    }

    insertGeneratedText(text: string,editor:Editor,cur:any=null) {
        let cursor= this.getCursor(editor);
        if(cur){
            cursor=cur;
        }
        
        if(editor.listSelections().length > 0){
            const anchor=editor.listSelections()[0].anchor
            const head = editor.listSelections()[0].head
            if(anchor.line > head.line || (anchor.line === head.line && anchor.ch > head.ch)) {
                cursor= editor.listSelections()[0].anchor;
            }
        } 
        editor.replaceRange(text, cursor);
    }

    async tempalteToModel(params: any=this.plugin.settings,templatePath:string="",editor:Editor,activeFile:boolean=true) {
        const templateFile = await this.app.vault.getAbstractFileByPath(templatePath);
        let templateContent= await this.app.vault.read(templateFile);
       // console.log({templateContent,templatePath});
        templateContent=removeYMAL(templateContent);
       // console.log(templateContent);
        const variables= templateContent.match(/\{\{(.*?)\}\}/ig)?.map(e=>e.replace("{{","").replace("}}","")) || [];
       // console.log(variables);
        const metadata= this.getMetadata(templatePath);
        new TemplateModelUI(this.app,this.plugin,variables,metadata,async (results: any) => {
            const cursor= this.getCursor(editor);
            const context = await this.contextManager.getContext(editor,true,templatePath,results);
            const text = await this.generate(context,true,params,templatePath);
            if(activeFile===false){
                const title=this.app.workspace.activeLeaf.getDisplayText();
                let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
                
                new SetPath(this.app,suggestedPath,async (path: string) => {
                    const file= await createFileWithInput(path,context+text,this.app);
                    openFile(this.app,file);
                }).open();
            } else {
                this.insertGeneratedText(text,editor,cursor);
            }  
            }).open();
    }

    getMetadata(path:string) {
        const metadata=this.getFrontmatter(path);
        const validedMetaData:any= {}

        if(metadata?.PromptInfo?.id){
          validedMetaData["id"]=metadata.PromptInfo.id;
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

        return validedMetaData;
    }
    
    getFrontmatter(path:string="") {
        const cache = this.app.metadataCache.getCache(path);
            if (cache.hasOwnProperty('frontmatter')) {
                return cache.frontmatter;
            }
        return null
    }
}


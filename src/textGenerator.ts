import { TemplateModelUI } from './ui/TemplateModelUI';
import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases, MetadataCache} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './reqFormatter';
import { SetPath } from './ui/setPath';
import ContextManager from './ContextManager';
import {makeid,createFileWithInput,openFile,removeYMAL} from './utils';
import safeAwait from 'safe-await'

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
            this.plugin.startProcessing();
            const [error, text ] = await safeAwait(this.getGeneratedText(reqParameters));
            this.plugin.endProcessing();

            if (error) {
                console.error(error);
                return Promise.reject(error);
            }
            
            return text.replace(/^\n*/g," ");
            
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
                if (selectedText[selectedText.length-1]===" ") {
                    cursor.ch=selectedText.length-1;
                }
            }
        }
        return cursor;
    }

    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true) {
        const cursor= this.getCursor(editor);

        const [errorContext, context ] = await safeAwait(this.contextManager.getContext(editor,insertMetadata,templatePath));
        const [errorGeneration, text ] = await safeAwait(this.generate(context,insertMetadata,params,templatePath));

        if(errorContext) {
            return Promise.reject(errorContext);
        }

        if(errorGeneration) {
            return Promise.reject(errorGeneration);
        }

        if(activeFile===false){
            const title=this.app.workspace.activeLeaf.getDisplayText();
            let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
            
            new SetPath(this.app,suggestedPath,async (path: string) => {
                const [errorFile,file]= await safeAwait(createFileWithInput(path,context+text,this.app));
                if(errorFile) {
                    return Promise.reject(errorFile);
                }

                openFile(this.app,file);
              }).open();
          } else {
            this.insertGeneratedText(text,editor,cursor);
          }  
    }
    
    async generateInEditor(params: TextGeneratorSettings, insertMetadata: boolean = false,editor:Editor) {
        const cursor= this.getCursor(editor);
        const [errorGeneration, text ] = await safeAwait(this.generate(await this.contextManager.getContext(editor,insertMetadata),insertMetadata,params));
       
        if(errorGeneration) {
            return Promise.reject(errorGeneration);
        }

        this.insertGeneratedText(text,editor,cursor);
    }
  
    async generatePrompt(promptText: string, insertMetadata: boolean = false,editor:Editor) {
        const cursor= this.getCursor(editor);
        const [errorGeneration, text ] = await safeAwait(this.generate(promptText,insertMetadata));
       
        if(errorGeneration) {
            return Promise.reject(errorGeneration);
        }
        this.insertGeneratedText(text,editor,cursor);
    }

    async createToFile(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true){
        const [errorContext, context ] = await safeAwait(this.contextManager.getContext(editor,insertMetadata,templatePath));
        
        if(errorContext) {
            return Promise.reject(errorContext);
        }

        if(activeFile===false){
        const title=this.app.workspace.activeLeaf.getDisplayText();
        let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
        
        new SetPath(this.app,suggestedPath,async (path: string) => {
            const [errorFile, file ] = await safeAwait(createFileWithInput(path,context,this.app));
        
            if(errorFile) {
                return Promise.reject(errorFile);
            }

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
            const [errorFile,file]= await safeAwait(createFileWithInput(path,templateContent,this.app));
            if(errorFile) {
                return Promise.reject(errorFile);
            }
            openFile(this.app,file);
          }).open(); 
        }

    async getGeneratedText(reqParams: any) {
            const extractResult = reqParams?.extractResult;
            delete reqParams?.extractResult;
            let [errorRequest, requestResults ] = await safeAwait(request(reqParams));
            if(errorRequest) {
                console.error(requestResults,errorRequest);
                return Promise.reject(errorRequest);
            }
            requestResults=JSON.parse(requestResults);
            console.log({requestResults});
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

        const  templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        let [errortemplateContent, templateContent ] = await safeAwait(this.app.vault.read(templateFile));
        if(errortemplateContent) {
            return Promise.reject(errortemplateContent);
        }

        templateContent=removeYMAL(templateContent);

       // console.log(templateContent);
        const variables= templateContent.match(/\{\{(.*?)\}\}/ig)?.map(e=>e.replace("{{","").replace("}}","")) || [];
       // console.log(variables);
        const metadata= this.getMetadata(templatePath);
        new TemplateModelUI(this.app,this.plugin,variables,metadata,async (results: any) => {
            const cursor= this.getCursor(editor);
           
            const [errorContext, context ] = await safeAwait(this.contextManager.getContext(editor,true,templatePath,results));
            if(errorContext) {
                return Promise.reject(errorContext);
            }

            const [errortext, text ] = await safeAwait(this.generate(context,true,params,templatePath));
            if(errortext) {
                return Promise.reject(errortext);
            }
            
            if(activeFile===false){
                const title=this.app.workspace.activeLeaf.getDisplayText();
                let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
                new SetPath(this.app,suggestedPath,async (path: string) => {
                    const [errorFile,file]= await safeAwait(createFileWithInput(path,context+text,this.app));
                    if(errorFile) {
                        return Promise.reject(errorFile);
                    }
                    
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


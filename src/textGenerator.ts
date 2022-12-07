import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases, MetadataCache} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './reqFormatter';
import { SetPath } from './ui/setPath';
import ContextManager from './ContextManager';
import {makeid,createFileWithInput,openFile} from './utils';
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
            let text
            try {
                this.plugin.startProcessing();
                text = await this.getGeneratedText(reqParameters);
                this.plugin.endProcessing();
                //console.log(text.replace(/^\n*/g,""));
                return text.replace(/^\n*/g,"");
            } catch (error) {
                console.error(error);
                this.plugin.endProcessing();
                return Promise.reject(error);
            }
        } else {
            return Promise.reject(new Error("There is another generation process"));
        }
    }
    
    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true) {
        const cursor= editor.getCursor();
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
        const cursor= editor.getCursor();
        const text = await this.generate(await this.contextManager.getContext(editor,insertMetadata),insertMetadata,params);
        this.insertGeneratedText(text,editor,cursor);
    }
  
    async generatePrompt(promptText: string, insertMetadata: boolean = false,editor:Editor) {
        const cursor= editor.getCursor();
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
            templateContent=templateContent.replace("---",`---\n${promptInfo}`)
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
        let cursor = editor.getCursor();
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
}


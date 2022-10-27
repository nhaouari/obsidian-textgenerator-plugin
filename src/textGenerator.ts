import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases, MetadataCache} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './ReqFormatter';
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
    
    async generate(prompt:string,insertMetadata: boolean = false,params: any=this.plugin.settings,path:string="") {
        let reqParameters:any = this.reqFormatter.addContext(params,prompt);
        reqParameters=this.reqFormatter.prepareReqParameters(reqParameters,insertMetadata,path);
        let text
        try {
            text = await this.getGeneratedText(reqParameters);
            return text;
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }
    
    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true) {
        const context = await this.contextManager.getContext(editor,insertMetadata,templatePath);
        const text = await this.generate(context,insertMetadata,params,templatePath);
        
        if(activeFile===false){
            console.log("generateFromTemplate");
            const title=this.app.workspace.activeLeaf.getDisplayText();
            let suggestedPath = 'textgenerator/generations/'+title+"-"+makeid(3)+".md";
            
            new SetPath(this.app,suggestedPath,async (path: string) => {
                const file= await createFileWithInput(path,context+text,this.app);
                openFile(this.app,file);
              }).open();
          } else {
            this.insertGeneratedText(text,editor);
          }  
    }
    
    async generateInEditor(params: TextGeneratorSettings, insertMetadata: boolean = false,editor:Editor) {
        const text = await this.generate(await this.contextManager.getContext(editor,insertMetadata),insertMetadata,params);
        this.insertGeneratedText(text,editor)
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

    async getGeneratedText(reqParams: any) {
        const extractResult = reqParams?.extractResult;
        delete reqParams?.extractResult;
        let requestResults;
        try {
            requestResults = JSON.parse(await request(reqParams));
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
        const text = eval(extractResult);
        return text
    }

    insertGeneratedText(text: string,editor:Editor) {
        let cursor = editor.getCursor();
        
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


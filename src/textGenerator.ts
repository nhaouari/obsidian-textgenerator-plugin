import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases, MetadataCache} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './ReqFormatter';
import { SetPath } from './ui/setPath';
import ContextManager from './ContextManager';
export default class TextGenerator {
    plugin: TextGeneratorPlugin;
    app: App;
    reqFormatter: ReqFormatter;
    contextManager: ContextManager; 

	constructor(app: App, plugin: TextGeneratorPlugin) {
        this.app = app;
		this.plugin = plugin;
        this.reqFormatter = new ReqFormatter(app,plugin);
        this.contextManager= new ContextManager(app,plugin, this.reqFormatter);
	}

    async getGeneratedText(reqParams: any) {
        const extractResult = reqParams?.extractResult;
        delete reqParams?.extractResult;
        let requestResults;
        try {
            requestResults = JSON.parse(await request(reqParams));
        } catch (error) {
            console.log(error);
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
    
    async generate(prompt:string,insertMetadata: boolean = false,params: any=this.plugin.settings,path:string="") {
        let reqParameters:any = this.reqFormatter.addContext(params,prompt);
        reqParameters=this.reqFormatter.prepareReqParameters(reqParameters,insertMetadata,path);
        let text
        try {
            text = await this.getGeneratedText(reqParameters);
            return text;
        } catch (error) {
            console.log(error);
            return Promise.reject(error);
        }
    }
    
    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor,activeFile:boolean=true) {
        const context = await this.contextManager.getContext(editor,insertMetadata,templatePath);
        const text = await this.generate(context,insertMetadata,params,templatePath);
        
        if(activeFile===false){
            console.log("generateFromTemplate");
            const title=this.app.workspace.activeLeaf.getDisplayText();
            let suggestedPath = 'textgenerator/generations/'+title+"-"+this.makeid(3)+".md";
            
            new SetPath(this.app,suggestedPath,async (path: string) => {
                const file= await this.createFileWithInput(path,context+text);
                this.openFile(this.app,file);
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
        let suggestedPath = 'textgenerator/generations/'+title+"-"+this.makeid(3)+".md";
        
        new SetPath(this.app,suggestedPath,async (path: string) => {
            const file= await this.createFileWithInput(path,context);
            console.log("createToFile");
            this.openFile(this.app,file);
          }).open();

      } else {
        this.insertGeneratedText(context,editor);
      }  
    }
    
    /**
     * Copied from Quick Add  https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/engine/QuickAddEngine.ts#L15
     * @param folder 
     */
    async createFolder(folder: string): Promise<void> {
        const folderExists = await this.app.vault.adapter.exists(folder);

        if (!folderExists) {
            await this.app.vault.createFolder(folder);
        }
    }
    makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    
    /**
     *  Copied from Quick Add https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/engine/QuickAddEngine.ts#L50  
     * @param filePath 
     * @param fileContent 
     * @returns 
     */
    async createFileWithInput(filePath: string, fileContent: string): Promise<TFile> {
        const dirMatch = filePath.match(/(.*)[\/\\]/);
        let dirName = "";
        if (dirMatch) dirName = dirMatch[1];

        if (await this.app.vault.adapter.exists(dirName)) {
            return await this.app.vault.create(filePath, fileContent);
        } else {
            await this.createFolder(dirName);
            return await this.app.vault.create(filePath, fileContent)
        }
    }
    
    /*
    * Copied from Quick Add  https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/utility.ts#L150
    */
    
    async openFile(app: App, file: TFile, optional?: {openInNewTab?: boolean, direction?: NewTabDirection, mode?: FileViewMode, focus?: boolean}) {
        let leaf: WorkspaceLeaf;
    
        if (optional?.openInNewTab && optional?.direction) {
            leaf = app.workspace.splitActiveLeaf(optional.direction);
        } else {
            leaf = app.workspace.getUnpinnedLeaf();
        }
    
        await leaf.openFile(file)
    
        if (optional?.mode || optional?.focus) {
            await leaf.setViewState({
                ...leaf.getViewState(),
                state: optional.mode && optional.mode !== 'default' ? {...leaf.view.getState(), mode: optional.mode} : leaf.view.getState(),
                popstate: true,
            } as ViewState, { focus: optional?.focus });
        }
    }    
}


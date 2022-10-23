import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import ReqFormatter from './reqFormatter';

export default class TextGenerator {
    plugin: TextGeneratorPlugin;
    app: App;
    reqFormatter: ReqFormatter;

	constructor(app: App, plugin: TextGeneratorPlugin) {
        this.app = app;
		this.plugin = plugin;
        this.reqFormatter = new ReqFormatter(app,plugin);
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
    
    async generate(prompt:string,insertMetadata: boolean = false,params: any=this.settings) {
        let parameters:any = this.reqFormatter.addContext(params,prompt);
        parameters=this.reqFormatter.prepareReqParameters(parameters,insertMetadata);
        let text
        try {
            text = await this.getGeneratedText(parameters);
            return text;
        } catch (error) {
            console.log(error);
            return Promise.reject(error);
        }
    }
    
    async generateFromTemplate(params: TextGeneratorSettings, templatePath: string, insertMetadata: boolean = false,editor:Editor) {
        const context = await this.getContext(editor,insertMetadata,templatePath);
        const text = await this.generate(context,insertMetadata,params);
        this.insertGeneratedText(text,editor)
    }
    
    async generateInEditor(params: TextGeneratorSettings, insertMetadata: boolean = false,editor:Editor) {
        const text = await this.generate(await this.getContext(editor,insertMetadata),insertMetadata,params);
        this.insertGeneratedText(text,editor)
    }
    
    async getContext(editor:Editor,insertMetadata: boolean = false,templatePath:string="") {
        let context="";
        let selectedText = editor.getSelection();
        if (selectedText.length === 0) {
            const lineNumber = editor.getCursor().line;
            selectedText = editor.getLine(lineNumber);
            if (selectedText.length===0){
                selectedText=editor.getValue()
            }
        }
    
        if(templatePath.length > 0){
            const templateFile = await this.app.vault.getAbstractFileByPath(templatePath);
            let templateContent= await this.app.vault.read(templateFile);
            templateContent=templateContent.replace("<?context?>",selectedText);
            context = templateContent;
        } else {
            context = selectedText;
        }
    
        if (insertMetadata) {
            const metadata = this.reqFormatter.getMetaData();
            if (metadata == null) {
                new Notice("No valid Metadata (YAML front matter) found!");
            } else {
                context=this.reqFormatter.getMetaDataAsStr(metadata) + context;
            }
        }
        return context;
    }
}



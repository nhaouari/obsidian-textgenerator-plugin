import {App, Notice, Editor} from 'obsidian';
import {Context} from './types';
import TextGeneratorPlugin from './main';
import {IGNORE_IN_YMAL} from './constants';
import Handlebars from 'handlebars';
import {removeYMAL} from './utils';
import debug from 'debug';
const logger = debug('textgenerator:ContextManager');
export default class ContextManager {
    plugin: TextGeneratorPlugin;
    app: App;
	constructor(app: App, plugin: TextGeneratorPlugin) {
        logger("ContextManager constructor");
        this.app = app;
		this.plugin = plugin;
        Handlebars.registerHelper('substring', function(string:string, start:number, end:number ) {
            const subString = string.substring( start ,end );
            return new Handlebars.SafeString(subString);
        });
	}
    
    async getContext(editor:Editor,insertMetadata: boolean = false,templatePath:string="",addtionalOpts:any={}) {
        logger("getContext",insertMetadata,templatePath,addtionalOpts);
        /* Template */
        if(templatePath.length > 0){  
            const options={...await this.getTemplateContext(editor,templatePath),...addtionalOpts};
            const context=await this.templateFromPath(templatePath,options);
            logger("Context Template",{context});
            return context;
        } else {  /* Without template */
            let context = await this.getDefaultContext(editor);/* Text Generate */
            if (insertMetadata) {
                let frontmatter = this.getMetaData()?.frontmatter; // frontmatter of the active document 
                if ((typeof frontmatter !== 'undefined')  && Object.keys(frontmatter).length !== 0) { /* Text Generate with metadata */
                    context=this.getMetaDataAsStr(frontmatter)+context;
                } else {
                    new Notice("No valid Metadata (YAML front matter) found!");
                }
            }
            logger("Context without template",{context});
            return context;
        } 
    }

    async getTemplateContext(editor:Editor,templatePath:string=""){
        logger("getTemplateContext",editor,templatePath);
        const contextOptions:Context = this.plugin.settings.context;
        const title = this.getActiveFileTitle();
        const selection = this.getSelection(editor);
        const selections = this.getSelections(editor);
        const context = await this.getDefaultContext(editor);
        const activeDocCache = this.getMetaData(""); // active document
        
        let blocks:any ={};
        blocks["frontmatter"]={};
        blocks["headings"]={};

        if(contextOptions.includeFrontmatter) blocks["frontmatter"] = {...this.getFrontmatter(this.getMetaData(templatePath)),...this.getFrontmatter(activeDocCache)};

        if(contextOptions.includeHeadings) blocks["headings"]=await this.getHeadingContent(activeDocCache);
        
        if(contextOptions.includeChildren) blocks["children"]= await this.getChildrenContent(activeDocCache);

        if(contextOptions.includeHighlights) blocks["highlights"]= await this.getHighlights(editor);
        
        if(contextOptions.includeMentions) blocks['mentions']= await this.getMentions(this.app.workspace.activeLeaf.getDisplayText());

        const options={title,selection,selections,...blocks["frontmatter"],...blocks["headings"],context: context,...blocks};
        logger("getTemplateContext Context Variables ",{...options});
        return options;
    }
    
    async getDefaultContext(editor:Editor){
        logger("getDefaultContext",editor);
        const contextOptions:Context = this.plugin.settings.context;
       
        const title = this.getActiveFileTitle();
        const selection = this.getSelection(editor); 
       
        let context= "";
       
        if(contextOptions.includeTitle){
            context += `title: ${title}\n`;
        }
       
        if(contextOptions.includeStaredBlocks){
            context += await this.getStaredBlocks();
        }

        context+=selection;
        logger("getDefaultContext",{context});
        return context;
    }

    async templateFromPath(templatePath:string,options:any) {
        logger("templateFromPath",templatePath,options);
        const templateFile = await this.app.vault.getAbstractFileByPath(templatePath);
        let templateContent= await this.app.vault.read(templateFile);
        templateContent=removeYMAL(templateContent);
        const template = Handlebars.compile(templateContent);
        templateContent=template(options);
        logger("templateFromPath",{templateContent});
        return templateContent;
    }

    getSelections(editor:Editor) {
        logger("getSelections",editor);
        const selections = editor.listSelections().map(r=>editor.getRange(r.anchor,r.head)).filter(text=>text.length>0);
        logger("getSelections",{selections});
        return selections;
    }

    getSelection(editor:Editor) {
        logger("getSelection",editor);
        let selectedText = editor.getSelection();
        if (selectedText.length === 0) {
            const lineNumber = editor.getCursor().line;
            selectedText = editor.getLine(lineNumber);
            if (selectedText.length===0){
                selectedText= editor.getValue()
                let frontmatter = this.getMetaData()?.frontmatter; // frontmatter of the active document 
                if ((typeof frontmatter !== 'undefined')  && Object.keys(frontmatter).length !== 0) { /* Text Generate with metadata */
                selectedText=removeYMAL(selectedText);
                }
            }
            }
        logger("getSelection",{selectedText});
        return selectedText;
    }

    getFrontmatter(fileCache:any) {
        return fileCache?.frontmatter
    }

    async getHeadingContent(fileCache:any) {
        const headings=fileCache?.headings;
        let headingsContent:any={};
        if(headings){
            for (let i = 0; i < headings.length; i++) {
                let textBlock=await this.getTextBloc(headings[i].heading);
                textBlock=textBlock.substring(textBlock.indexOf(headings[i].heading),textBlock.length-1);
                const headingRegex=new RegExp(`${headings[i].heading}\\s*?\n`, "ig");   
                textBlock=textBlock.replace(headingRegex,"");
                headingsContent[headings[i].heading]=textBlock;
            }
        }
        return headingsContent
    }

    async getChildrenContent(fileCache:any) {
        let children:any=[];
        const links = fileCache?.links?.filter(e=>e.original.substr(0,2)==="[[");
        if(links){
            for (let i = 0; i < links.length; i++) {
                const link=links[i];
                const path=link.link+".md";
                let file
                if (path.includes('/')) {
                    file= await this.app.vault.getFiles().filter(t=>t.path===path)[0];
                } else {
                    file= await this.app.vault.getFiles().filter(t=>t.name===path)[0];
                }

                if (file) {
                    const content= await this.app.vault.read(file);
                    children.push({...file,content});
                }
            }
        }
        return children
    }

    async getHighlights(editor:Editor) {
        const content=editor.getValue();
        const highlights= content.match(/==(.*?)==/ig)?.map(s=>s.replaceAll("==","")) || [];  
        return highlights;
    }

    async getMentions(title:string) {
        let linked:any=[];
        let unlinked:any=[];
        const files = this.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            const file=files[i];
            let content= await this.app.vault.cachedRead(file);
            
            const regLinked=new RegExp(`.*\\[\\[${title}\\]\\].*`, "ig");   
            const resultsLinked = content.match(regLinked);
            if (resultsLinked) {
                linked.push({...file,results:resultsLinked});
            }
            
            const regUnlinked=new RegExp(`.*${title}.*`, "ig");
            const resultsUnlinked = content.match(regUnlinked);
            if (resultsUnlinked) {
                unlinked.push({...file,results:resultsUnlinked});
            }
        }
        return {linked,unlinked}
    }

    async getStaredBlocks (path:string="") {
        const fileCache = this.getMetaData(path);
        let content ="";
        const staredHeadings=fileCache?.headings?.filter(e=>e.heading.substring(e.heading.length-1)==="*")
        if(staredHeadings){
            for (let i = 0; i < staredHeadings.length; i++) {
                content +=await this.getTextBloc(staredHeadings[i].heading);
              }
        }
        return content;
    }

    async getTextBloc(heading:string,path:string="") {
        const fileCache=this.getMetaData(path);
        let level=-1;
        let start=-1;
        let end=-1;

        for (let i = 0; i < fileCache.headings.length; i++) {
            const ele=  fileCache.headings[i];
            if( start===-1 && ele?.heading ===heading) 
            {
                level=ele.level;
                start=ele.position.start.offset;
            } else if(start >= 0 &&  ele.level <= level && end===-1) 
            {
                end=ele.position.start.offset;
                break;
            }
          }

        if(start>=0) {
            const doc = await this.app.vault.getAbstractFileByPath(fileCache.path);
            const docContent= await this.app.vault.read(doc);
            if (end === -1) end = docContent.length-1;
            return docContent.substring(start,end)
        } else {
            console.error("Heading not found ");
        }        
    }

    getActiveFileTitle(){
        return `${this.app.workspace.getActiveFile().basename}`;
    }

    getMetaData(path:string="") {
        let activeFile;
        if (path==="") {
            activeFile = this.app.workspace.getActiveFile();
        } else 
        {
            activeFile ={path};
        }

        if (activeFile !== null) {
            const cache = this.app.metadataCache.getCache(activeFile.path);
            this.app.metadataCache.getCache(this.app.workspace.getActiveFile().path);
            return {...cache,path:activeFile.path};
         }
        return null
    }
    
    getMetaDataAsStr(frontmatter:any)
    {
        let cleanFrontMatter = "";
        for (const [key, value] of Object.entries(frontmatter)) {
            if (IGNORE_IN_YMAL.findIndex((e)=>e===key)!=-1) continue;
            if (Array.isArray(value)) {
                cleanFrontMatter += `${key} : `
                value.forEach(v => {
                    cleanFrontMatter += `${v}, `
                })
                cleanFrontMatter += `\n`
            } else {
                cleanFrontMatter += `${key} : ${value} \n`
            }
        }
        return cleanFrontMatter;
    }
}
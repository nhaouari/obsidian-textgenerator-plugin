import {App, Notice, Editor} from 'obsidian';
import {Context} from './types';
import TextGeneratorPlugin from './main';
import {IGNORE_IN_YMAL} from './constants';
import Handlebars from 'handlebars';
import {removeYMAL} from './utils';
export default class ContextManager {
    plugin: TextGeneratorPlugin;
    app: App;
	constructor(app: App, plugin: TextGeneratorPlugin) {
        this.app = app;
		this.plugin = plugin;
	}
    
    async getContext(editor:Editor,insertMetadata: boolean = false,templatePath:string="") {
        const contextOptions:Context = this.plugin.settings.context;

        let context= "";
        let path ="";
         /* Add the content of the stared Headings */
        
        if(contextOptions.includeStaredBlocks){
            context += await this.getStaredBlocks();
        }

        /* Add the content of the considered context */
        context += this.getSelection(editor); 

        let frontmatter = this.getMetaData()?.frontmatter; // frontmatter of the active document 
        /* apply template */
        if(templatePath.length > 0){
            let blocks:any ={};
            const activeDocCache = this.getMetaData(path);
            
            blocks["frontmatter"]={};
            blocks["headings"]={};

            if(contextOptions.includeFrontmatter) blocks["frontmatter"] = {...this.getFrontmatter(this.getMetaData(templatePath)),...this.getFrontmatter(activeDocCache)};

            if(contextOptions.includeHeadings) blocks["headings"]=await this.getHeadingContent(activeDocCache);
            
            if(contextOptions.includeChildren) blocks["children"]= await this.getChildrenContent(activeDocCache);
            
            if(contextOptions.includeMentions) blocks['mentions']= await this.getMentions(this.app.workspace.activeLeaf.getDisplayText());
            
            const options={...blocks["frontmatter"],...blocks["headings"],context: context,...blocks};
           
            context=await this.templateFromPath(templatePath,options);
            frontmatter = {...this.getMetaData(templatePath)?.frontmatter,...frontmatter}; // frontmatter of active document priority is higher than frontmatter of the template
            path=templatePath;
        } 

        /* Add frontmatter */ 
        if (insertMetadata && frontmatter && Object.keys(frontmatter).length === 0) {
                context=this.getMetaDataAsStr(frontmatter)+context;
            } else if(insertMetadata && templatePath.length===0) { 
                new Notice("No valid Metadata (YAML front matter) found!");
            }
        
       // console.log(context);
        return context;
    }

    async templateFromPath(templatePath:string,options:any) {
        const templateFile = await this.app.vault.getAbstractFileByPath(templatePath);
        let templateContent= await this.app.vault.read(templateFile);
        templateContent=removeYMAL(templateContent);
        const template = Handlebars.compile(templateContent);
        templateContent=template(options);
        return templateContent;
    }

    getSelection(editor:Editor) {
        let selectedText = editor.getSelection();
        if (selectedText.length === 0) {
            const lineNumber = editor.getCursor().line;
            selectedText = editor.getLine(lineNumber);
            if (selectedText.length===0){
                selectedText=editor.getValue()
            }
        }
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
                textBlock=textBlock.replace(headings[i].heading+"\n","");
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
        const fileCache=this.getMetaData(path)
        
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
                    cleanFrontMatter += `${value}, `
                })
                cleanFrontMatter += `\n`
            } else {
                cleanFrontMatter += `${key} : ${value} \n`
            }
        }
        
        return cleanFrontMatter;
    }
}
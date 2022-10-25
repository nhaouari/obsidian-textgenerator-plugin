import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import {IGNORE_IN_YMAL} from './constants';
import Handlebars from 'handlebars';
import ReqFormatter from './ReqFormatter';
export default class ContextManager {
    plugin: TextGeneratorPlugin;
    app: App;
    reqFormatter: ReqFormatter;

	constructor(app: App, plugin: TextGeneratorPlugin,reqFormatter:ReqFormatter) {
        this.app = app;
		this.plugin = plugin;
        this.reqFormatter=reqFormatter;
	}

    async getContext(editor:Editor,insertMetadata: boolean = false,templatePath:string="") {

        let context= "";
        let path ="";
         /* Add the content of the stared Headings */
        context = await this.getStaredBlocks();
        /* Add the content of the considered context */
        let selectedText = editor.getSelection();
        if (selectedText.length === 0) {
            const lineNumber = editor.getCursor().line;
            selectedText = editor.getLine(lineNumber);
            if (selectedText.length===0){
                selectedText=editor.getValue()
            }
        }

        context += selectedText;
        /* Add <?context?> into template */
        if(templatePath.length > 0){
            const templateFile = await this.app.vault.getAbstractFileByPath(templatePath);
            console.log(templatePath);
            let templateContent= await this.app.vault.read(templateFile);
            templateContent=this.removeYMAL(templateContent);
            let template = Handlebars.compile(templateContent);
            const blocks = await this.getBlocks();
            console.log({blocks});
            templateContent=template({context: context,...blocks,...this.reqFormatter.getMetaData()?.frontmatter});
            console.log(templateContent);
            context = templateContent;
            path=templatePath;
        } 
        /* Add metadata */
        if (insertMetadata) {
            const metadata = this.reqFormatter.getMetaData(path)?.frontmatter;
            if (metadata == null) {
                new Notice("No valid Metadata (YAML front matter) found!");
            } else {
                context=this.reqFormatter.getMetaDataAsStr(metadata)+context;
            }
        }
        return context;
    }

    removeYMAL(content:string) {
        return content.replace(/---(.|\n)*---/, '');
    }

    async getBlocks (path:string="") {
        const fileCache = this.reqFormatter.getMetaData(path);
        let blocks:any ={};
        const headings=fileCache?.headings;
        console.log({headings})
        let headingsContent:any={};
        if(headings){
            for (let i = 0; i < headings.length; i++) {
                let textBlock=await this.getTextBloc(headings[i].heading);
                textBlock=textBlock.substring(textBlock.indexOf(headings[i].heading),textBlock.length-1);
                textBlock=textBlock.replace(headings[i].heading+"\n","");
                headingsContent[headings[i].heading]=textBlock;
            }
        }

        
        blocks["headings"]=headingsContent;
        blocks={...blocks,...headings};

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
                    // const templateContent= await this.app.vault.read(file.path); 
                    // console.log(templateContent);
                    children.push({...file,content});
                }
            }
        }

        blocks["children"]=children;

        let linkedMentions:any=[];
        const activeTitle= this.app.workspace.activeLeaf.getDisplayText()
        const files = this.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            const file=files[i];
            const content= await this.app.vault.cachedRead(file);
            const reg=new RegExp(`.*\\[\\[${activeTitle}\\]\\].*`, "ig");   
            const results = content.match(reg);
            if (results) {
                linkedMentions.push({...file,results});
            }
        }

        blocks['linkedMentions']=linkedMentions;
        blocks={...blocks,...children};


        return blocks;
    }

    async getStaredBlocks (path:string="") {
        const fileCache = this.reqFormatter.getMetaData(path);
        let content ="";
        const staredHeadings=fileCache?.headings?.filter(e=>e.heading.substring(e.heading.length-1)==="*")
        if(staredHeadings){
            for (let i = 0; i < staredHeadings.length; i++) {
                content +=await this.getTextBloc(staredHeadings[i].heading);
              }
        }
        return content;
    }


    /**
     * Get the content of specific section
     * @param heading 
     * @param path 
     * @returns 
     */
    async getTextBloc(heading:string,path:string="") {
        const fileCache=this.reqFormatter.getMetaData(path)
        
        let level=-1;
        let start=-1;
        let end=-1;

        for (let i = 0; i < fileCache.headings.length; i++) {
            const ele=  fileCache.headings[i];
            console.log(ele);
            if( start===-1 && ele?.heading ===heading) 
            {
                level=ele.level;
                start=ele.position.start.offset;
                console.log("+",ele);

            } else if(start >= 0 &&  ele.level <= level && end===-1) 
            {
                console.log("-",ele);
                end=ele.position.start.offset;
                break;
            }
          }

        console.log({start,end,level})

        if(start>=0) {
            const doc = await this.app.vault.getAbstractFileByPath(fileCache.path);
            const docContent= await this.app.vault.read(doc);
            if (end === -1) end = docContent.length-1;
            console.log(docContent.substring(start,end)); 
            return docContent.substring(start,end)
        } else {
            console.error("Heading not found ");
        }        
    }
}
import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';

export default class ReqFormatter {
    plugin: TextGeneratorPlugin;
    app: App;

	constructor(app: App, plugin: TextGeneratorPlugin) {
        this.app = app;
		this.plugin = plugin;
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
            if (cache.hasOwnProperty('frontmatter')) {
                return cache.frontmatter;
            }
         }
    
        return null
    }
    
    getMetaDataAsStr(frontmatter:any)
    {
        let metadata = "";
        let keywords = ['config','position','bodyParams','reqParams'];
        for (const [key, value] of Object.entries(frontmatter)) {
            if (keywords.findIndex((e)=>e==key)!=-1) continue;
            if (Array.isArray(value)) {
                metadata += `${key} : `
                value.forEach(v => {
                    metadata += `${value}, `
                })
                metadata += `\n`
            } else {
                metadata += `${key} : ${value} \n`
            }
        }
        return metadata;
    }
    
    addContext(parameters: TextGeneratorSettings,prompt: string){
        const params={
           ...parameters,
           prompt	
       }
       return params;
   }
   
    prepareReqParameters(params: TextGeneratorSettings,insertMetadata: boolean) {
       let bodyParams:any = {
           "prompt": params.prompt,
           "max_tokens": params.max_tokens,
           "temperature": params.temperature,
           "frequency_penalty": params.frequency_penalty,
       };
       
       let reqParams = {
           url: `https://api.openai.com/v1/engines/${params.engine}/completions`,
           method: 'POST',
           body:'',
           headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${params.api_key}`
           },
           extractResult: "requestResults?.choices[0].text"
       }
   
       if (insertMetadata) {
           const metadata = this.getMetaData();
           if (metadata == null) {
               new Notice("No valid Metadata (YAML front matter) found!");
           } else {
               if(metadata["bodyParams"] && metadata["config"]?.append?.bodyParams==false){
                   bodyParams = metadata["bodyParams"];
               } else if (metadata["bodyParams"]) {
                   bodyParams = {...bodyParams,...metadata["bodyParams"]}; 
               } 
               
               if (metadata["config"]?.context &&  metadata["config"]?.context !== "prompt") 
               {
                   bodyParams[metadata["config"].context]=	 params.prompt;
                   delete bodyParams.prompt;
               }
               
               reqParams.body=	JSON.stringify(bodyParams);
   
               if (metadata["config"]?.output) 
               {
                   reqParams.extractResult= metadata["config"]?.output
               }
   
               if(metadata["reqParams"] && metadata["config"]?.append?.reqParams==false){
                   reqParams = metadata["reqParams"];
               } else if (metadata["reqParams"]) {
                   reqParams= {...reqParams,...metadata["reqParams"]} 
               } 
           } 
       } else {
           reqParams.body=	JSON.stringify(bodyParams);
       }

       console.log({bodyParams,reqParams});
       return reqParams;
   }
}
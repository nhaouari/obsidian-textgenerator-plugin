import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {TextGeneratorSettings} from './types';
import TextGeneratorPlugin from './main';
import {IGNORE_IN_YMAL} from './constants';
import ContextManager from './ContextManager';
import debug from 'debug';
const logger = debug('textgenerator:ReqFormatter');
export default class ReqFormatter {
    plugin: TextGeneratorPlugin;
    app: App;
    contextManager:ContextManager;
	constructor(app: App, plugin: TextGeneratorPlugin,contextManager:ContextManager) {
        this.app = app;
		this.plugin = plugin;
        this.contextManager=contextManager;
	}

    addContext(parameters: TextGeneratorSettings,prompt: string){
        const params={
           ...parameters,
           prompt	
       }
       return params;
   }
   
    prepareReqParameters(params: TextGeneratorSettings,insertMetadata: boolean,templatePath:string="", additionnalParams:any={}) {
       logger("prepareReqParameters",params,insertMetadata,templatePath);
       
       let bodyParams:any= {
        "prompt": params.prompt,
        "max_tokens": params.max_tokens,
        "temperature": params.temperature,
        "frequency_penalty": params.frequency_penalty,
        "stop": params.stop,
     };

    
       let reqUrl= `https://api.openai.com/v1/engines/${params.engine}/completions`;
       let reqExtractResult = "requestResults?.choices[0].text";

       if (params.engine==="gpt-3.5-turbo" ||  params.engine==="gpt-3.5-turbo-0301") {
        bodyParams= {
            "model": params.engine,
            "messages": [{"role": "user", "content": params.prompt}],
            "max_tokens": params.max_tokens,
            "temperature": params.temperature,
            "frequency_penalty": params.frequency_penalty,
        };
        reqUrl = "https://api.openai.com/v1/chat/completions";
        reqExtractResult = "requestResults?.choices[0].message.content";
       } 
      
       
       bodyParams = {...bodyParams,...additionnalParams?.bodyParams};

       let reqParams = {
           url: reqUrl,
           method: 'POST',
           body:'',
           headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${params.api_key}`
           },
           extractResult: reqExtractResult
       }
       
       reqParams = {...reqParams,...additionnalParams?.reqParams};

       if (insertMetadata) {
           const activefileFrontmatter =  this.contextManager.getMetaData()?.frontmatter;
           const templateFrontmatter =  this.contextManager.getMetaData(templatePath)?.frontmatter;
           const frontmatter = {...templateFrontmatter,...activefileFrontmatter};
           //console.log({templateFrontmatter,activefileFrontmatter,frontmatter});
           if (frontmatter == null) {
               new Notice("No valid Metadata (YAML front matter) found!");
           } else {
               if(frontmatter["bodyParams"] && frontmatter["config"]?.append?.bodyParams==false){
                   bodyParams = {prompt:params.prompt,...frontmatter["bodyParams"]};
               } else if (frontmatter["bodyParams"]) {
                   bodyParams = {...bodyParams,...frontmatter["bodyParams"]}; 
               } 
               
               if (frontmatter["config"]?.context &&  frontmatter["config"]?.context !== "prompt") 
               {
                   bodyParams[frontmatter["config"].context]=params.prompt;
                   delete bodyParams.prompt;
               }
               
               reqParams.body=	JSON.stringify(bodyParams);
   
               if (frontmatter["config"]?.output) 
               {
                   reqParams.extractResult= frontmatter["config"]?.output
               }
   
               if(frontmatter["reqParams"] && frontmatter["config"]?.append?.reqParams==false){
                   reqParams = frontmatter["reqParams"];
               } else if (frontmatter["reqParams"]) {
                   reqParams= {...reqParams,...frontmatter["reqParams"]} 
               } 
           } 
       } else {
           reqParams.body=	JSON.stringify(bodyParams);
       }
       
       logger("prepareReqParameters",{bodyParams,reqParams});
       return reqParams;
   }
}
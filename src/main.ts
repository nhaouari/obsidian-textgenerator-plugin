import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {ExampleModal} from './model';
import {TextGeneratorSettings} from './types';
import {appPencile_icon, pencil_icon} from './icons';
import TextGeneratorSettingTab from './ui/settingsPage';

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "text-davinci-002",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true
}

export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl: any;

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

	getActiveView() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView !== null) {
			return activeView
		} else {
			new Notice("The file type should be Markdown!");
			return null
		}
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

	
	addContext(parameters: TextGeneratorSettings,prompt: string){
		 const params={
			...parameters,
			prompt	
		}
		return params;
	}

	/*
	Prepare the request parameters
	*/
	 
    
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
		return reqParams;
	}

	async generate(prompt:string,insertMetadata: boolean = false,params: any=this.settings) {
		let parameters:any = this.addContext(params,prompt);
		parameters=this.prepareReqParameters(parameters,insertMetadata);
		let text
		try {
			text = await this.getGeneratedText(parameters);
			return text;
		} catch (error) {
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
			const metadata = this.getMetaData();
			if (metadata == null) {
				new Notice("No valid Metadata (YAML front matter) found!");
			} else {
				context=this.getMetaDataAsStr(metadata) + context;
			}
		}
		return context;
	}

	updateStatusBar(text: string) {
		let text2 = "";
		if (text.length > 0) {
			text2 = `: ${text}`;
		}

		if (this.settings.showStatusBar) {
			this.statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens})${text2}`);
		}
	}

	async onload() {
		addIcon("pencil_icon",pencil_icon);
		addIcon("appPencile_icon",appPencile_icon);
		await this.loadSettings();
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pencil_icon', 'Generate Text!', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const activeFile = this.app.workspace.getActiveFile();
			this.updateStatusBar(`processing... `);
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			try {
				await this.generateInEditor(this.settings,false,editor);
				this.updateStatusBar(``);
			} catch (error) {
				new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
				this.updateStatusBar(`Error: Check Console`);
				setTimeout(()=>this.updateStatusBar(``),3000);
			}
			}


		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			icon: 'pencil_icon',
			hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					await this.generateInEditor(this.settings,false,editor);
					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});

		this.addCommand({
			id: 'generate-text-From-template',
			name: 'Generate Text From Template',
			icon: 'pencil_icon',
			hotkeys: [{ modifiers: ["Ctrl",'Shift'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					new ExampleModal(this.app, async (result) => {
						await this.generateFromTemplate(this.settings,result.path,false,editor);
					  }).open();

					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});


		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			icon: 'appPencile_icon',
			hotkeys: [{ modifiers: ["Ctrl",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					await this.generateInEditor(this.settings,true,editor);
					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});

		this.addCommand({
			id: 'increase-max_tokens',
			name: 'Increase max_tokens by 10',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "1" }],
			editorCallback: async () => {
				this.settings.max_tokens += 10;
				await this.saveSettings();
				this.updateStatusBar('');
			}
		});

		this.addCommand({
			id: 'decrease-max_tokens',
			name: 'decrease max_tokens by 10',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "2" }],
			editorCallback: async () => {
				this.settings.max_tokens -= 10;
				await this.saveSettings();
				this.updateStatusBar('');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TextGeneratorSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
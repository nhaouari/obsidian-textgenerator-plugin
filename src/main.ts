import { DownloaderPage } from './DownloaderPage';
import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases,normalizePath} from 'obsidian';
import {ExampleModal} from './model';
import {TextGeneratorSettings,Context} from './types';
import {GENERATE_ICON,GENERATE_META_ICON} from './constants';
import TextGeneratorSettingTab from './ui/settingsPage';
import {SetMaxTokens} from './ui/setMaxTokens';
import TextGenerator from './textGenerator';
import { SetModel } from './ui/setModel';
import PackageManager from './PackageManager';
import { PackageManagerUI } from './ui/PackageManagerUI';


const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "text-davinci-002",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true,
	promptsPath:"templates/prompts",
	context:{
		includeStaredBlocks:true,
		includeFrontmatter:true,
		includeHeadings:true,
		includeChildren:false,
		includeMentions:false
	}
}

export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl: any;
	textGenerator:TextGenerator;
	packageManager:PackageManager;
	
    updateStatusBar(text: string) {
        let text2 = "";
        if (text.length > 0) {
            text2 = `: ${text}`;
        }
    
        if (this.settings.showStatusBar) {
            this.statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens})${text2}`);
        }
    }

	startProcessing(){
		//this.updateStatusBar(`processing... `);
		//const notice = new Notice('✏️Processing...',30000);
		this.updateStatusBar(`processing... `);
		const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			editor.replaceRange(' <span id="tg-loading" class="loading dots"/> ',editor.getCursor());
			}
	}

	endProcessing(){ 
		const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			const cursor= editor.getCursor();
			let text = editor.getValue();
			text=text.replace(' <span id="tg-loading" class="loading dots"/> ','');
			editor.setValue(text);
			editor.setCursor(cursor);
			}
		//document.querySelectorAll("#tg-loading").forEach(e => e.remove());
		//this.updateStatusBar(`processing... `);
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

	async onload() {
		addIcon("GENERATE_ICON",GENERATE_ICON);
		addIcon("GENERATE_META_ICON",GENERATE_META_ICON);

		this.textGenerator=new TextGenerator(this.app,this);
		
		await this.loadSettings();
		
		
		this.packageManager= new PackageManager(this.app,this.settings.promptsPath);
		await this.packageManager.load();
		

		const adapter = this.app.vault.adapter; 
		//this.settings.communityPrompts=JSON.parse(await adapter.read(normalizePath(app.vault.configDir + "/community-prompts.json")));
		//this.settings.configuration=JSON.parse(await adapter.read(normalizePath(app.vault.configDir + "/text-generator.json")));
		
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('GENERATE_ICON', 'Generate Text!', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const activeFile = this.app.workspace.getActiveFile();
			this.updateStatusBar(`processing... `);
			const notice = new Notice('✏️Processing...',30000);
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			try {
				await this.textGenerator.generateInEditor(this.settings,false,editor);
				this.updateStatusBar(``);
			} catch (error) {
				new Notice("🔴Error:Text Generator Plugin: Error check console CTRL+SHIFT+I");
				console.error(error);
				this.updateStatusBar(`Error: Check Console`);
				setTimeout(()=>this.updateStatusBar(``),3000);
			}
			}


		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					await this.textGenerator.generateInEditor(this.settings,false,editor);
					this.updateStatusBar(``);
					notice.hide();
				} catch (error) {
					notice.hide();
					new Notice("🔴Error:Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});
		
		
		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			icon: 'GENERATE_META_ICON',
			hotkeys: [{ modifiers: ["Ctrl",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					await this.textGenerator.generateInEditor(this.settings,true,editor);
					this.updateStatusBar(``);
					notice.hide();
				} catch (error) {
					notice.hide();
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});

		this.addCommand({
			id: 'insert-generated-text-From-template',
			name: 'Generate and Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl",'Meta'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor,true);
						this.updateStatusBar(``);
						notice.hide();
					  },'Generate and Insert Template').open();
				} catch (error) {
					notice.hide();
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});


		this.addCommand({
			id: 'create-generated-text-From-template',
			name: 'Generate and Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl","Shift"], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor,false);
						this.updateStatusBar(``);
						notice.hide();
					  },'Generate and Create a New File From Template').open();
					
				} catch (error) {
					notice.hide();
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});



		this.addCommand({
			id: 'insert-text-From-template',
			name: 'Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ['Meta','Alt'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor,true);
						this.updateStatusBar(``);
						notice.hide();
					  },'Insert Template').open();
				} catch (error) {
					notice.hide();
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});

		this.addCommand({
			id: 'create-text-From-template',
			name: 'Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Shift","Meta",'Alt'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor,false);
						this.updateStatusBar(``);
						notice.hide();
					  },'Create a New File From Template').open();
				} catch (error) {
					notice.hide();
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});


		this.addCommand({
			id: 'set_max_tokens',
			name: 'Set max_tokens',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "1" }],
			editorCallback: async () => {
				new SetMaxTokens(this.app,this,this.settings.max_tokens.toString(),async (result: string) => {
					this.settings.max_tokens = parseInt(result);
					await this.saveSettings();
				    this.updateStatusBar('');
					new Notice(`Set Max Tokens to ${result}!`);
				  }).open();

			}
		});

		this.addCommand({
			id: 'packageManager',
			name: 'Template Packet Manager',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "3" }],
			editorCallback: async () => {
				new PackageManagerUI(this.app,this,this.settings.max_tokens.toString(),async (result: string) => {
					this.settings.max_tokens = parseInt(result);
					await this.saveSettings();
				    this.updateStatusBar('');
					new Notice(`Set Max Tokens to ${result}!`);
				  }).open();

			}
		});
		
		this.addCommand({
			id: 'set-model',
			name: 'Choose a model',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "2" }],
			editorCallback: async (editor: Editor) => {
				try {
					new SetModel(this.app, this,async (result) => {
						this.settings.engine=result;
						await this.saveSettings();
					  },'Choose a model').open();
				} catch (error) {
					
					new Notice("🔴Error: Check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TextGeneratorSettingTab(this.app, this));

	}

	async downloadTemplate(templateId:string){
		if(!await this.templateExist(templateId) || await this.newUpdateExist()) {
			const url="https://raw.githubusercontent.com/nhaouari/gpt-3-prompt-templates/master/prompts/"+templateId+".md";
			this.writeTemplate(templateId,await request({url:url}));
		}
	}

	async newUpdateExist() {
		// chech the last version the last relese if a new version exist download it and compare the local version with the version in relaise 
		
		return false;
	}


	async getRelease() {
		const rawReleases = JSON.parse(await request({
			url: "https://api.github.com/repos/nhaouari/gpt-3-prompt-templates/releases",
		}));

		const rawRelease: any = rawReleases.filter((x: any) => !x.draft && !x.prerelease).sort((x: any) => x.published_at)[0]
		const release = {
			version: rawRelease.tag_name,
			assets: rawRelease.assets.map((asset: any) => ({
				name: asset.name,
				url: asset.browser_download_url,
			}))			
		}
		console.log(release);
		
	}
    /** https://github.com/plugins-galore/obsidian-plugins-galore/blob/bd3553908fa9eacf33a5e1c2e7b0dea2a02a9d80/src/util/gitServerInterface.ts#L86 */
	async getAsset (release: any, name: string) {
		const asset = release.assets.filter(asset => asset.name === name)[0];
		if (!asset) {
			return null;
		}
		return request({
			url: asset.url,
		});
	}

	async templateExist(templateId:string){
		const templatePath = this.getTemplatePath(templateId);
        const paths = this.app.metadataCache.getCachedFiles().filter(path=>path.includes(templatePath));
		if (paths.length > 0 ) {
			return true;
		}
		else {
			return false;
		}
	}

	async writeTemplate(templateId:string,content:any) {
		console.log({templateId,content});
		const path = this.getTemplatePath(templateId);
		const adapter = this.app.vault.adapter;
		try {
			if (!(await adapter.exists(this.settings.promptsPath))) {
				await adapter.mkdir(this.settings.promptsPath);
			}
			let write = true;
			if(await adapter.exists(path)) {
				let text = "Template "+path+" exists!\nEither OK to Overread or over Cancel.";
					if (await confirm(text) == false) {
						write = false;
					} 
			} 

			if(write){
				adapter.write(
					path,
					content,
				)
			}

			
		} catch (error) {
			console.error(error);
			Promise.reject(error);
		}
	}

	getTemplatePath(packageId:string,promptId:string) {
		const promptsPath= this.settings.promptsPath;
		//app.vault.configDir
		const templatePath=normalizePath(`${promptsPath}/${packageId}/${promptId}.md`);
		return templatePath;
	}

	getFrontmatter(path:string="") {
        const cache = this.app.metadataCache.getCache(path);
            if (cache.hasOwnProperty('frontmatter')) {
                return cache.frontmatter;
            }
        return null
    }
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
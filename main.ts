import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { exit } from 'process';

// Remember to rename these classes and interfaces!

interface TextGeneratorSettings {
    api_key: string;
	engine: string; 
	max_tokens: number; 
	temperature: number;
	frequency_penalty: number;
	prompt:string;
	showStatusBar:boolean;
}

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
    engine: "text-davinci-001",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt:"",
	showStatusBar:true
}


export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl:any;

    async getGeneratedText(params:TextGeneratorSettings) {

		const usedParams = {
			"prompt": params.prompt,
			"max_tokens": params.max_tokens,
			"temperature": params.temperature,
			"frequency_penalty": params.frequency_penalty,
		};

        const reqParams = {
            url: `https://api.openai.com/v1/engines/${params.engine}/completions`,
            method: 'POST',
            body: JSON.stringify(usedParams),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${params.api_key}`
            },
        }
        const requestResults = JSON.parse(await window.request(reqParams));
        const text=requestResults.choices[0].text
        return text
    }

	 getMetaData() {
		 const cache=this.app.metadataCache.getCache(app.workspace.getActiveFile().path);
		 let metadata = ""
		 if(cache.hasOwnProperty('frontmatter')){
			const frontmatter = cache.frontmatter;
			delete frontmatter.position; 

			for(const [key, value] of Object.entries(frontmatter)) {
				if(Array.isArray(value)) {
					metadata+=`${key} : `
					value.forEach(v=>{
						metadata+=`${value}, `
					})
					metadata+=`\n`
				} else {
					metadata+=`${key} : ${value} \n`
				}
			}
		}
		return metadata;
	 }

     insertGeneratedText(text:string) {
        const cursor=this.app.workspace.activeLeaf.view.currentMode.editor.getCursor();
		this.app.workspace.activeLeaf.view.currentMode.editor.replaceRange(text,cursor)
      }

    async complete(params:TextGeneratorSettings,insertMetadata:boolean=false){
    	if (insertMetadata) {
			params.prompt=  this.getMetaData() +params.prompt; 
			new Notice("No frontmatter, or it is not well formated!");
			return;
		}
		console.log(params)
		let text = await this.getGeneratedText(params);
        this.insertGeneratedText(text)
    }	

	getPrompt() {
		this.app.workspace.activeLeaf.view.editor.getLine(this.app.workspace.activeLeaf.view.editor.getCursor().line)
		const leaf = this.app.workspace.activeLeaf;
		let selectedText= leaf.view.currentMode.getSelection();
		if(selectedText.length===0) {
			selectedText=this.app.workspace.activeLeaf.view.editor.getLine(this.app.workspace.activeLeaf.view.editor.getCursor().line);
		}
		return selectedText;
	}

	updateStatusBar(text:string){
		let text2=""
		if(text.length>0) {
			const text2=`: ${text}`
		}
	
		if(this.settings.showStatusBar) {
			this.statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens})${text2}`)
		}
	}

	async onload() {
		await this.loadSettings();
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pencil', 'Text Generator', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.updateStatusBar(`processing... `);
            await this.complete({...this.settings,prompt:this.getPrompt()});
			this.updateStatusBar(``);
		});
		
		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			checkCallback: async (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
                        this.updateStatusBar(`processing... `);
						await this.complete({...this.settings,prompt:this.getPrompt()});
                        this.updateStatusBar(``);
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			checkCallback: async (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.updateStatusBar(`processing... `);
						const settings = {...this.settings, prompt:this.getPrompt()};
                        await this.complete(settings,true);
                        this.updateStatusBar(``);
					}
					return true;
				}
				return false;
			}
		});


		this.addCommand({
			id: 'increase-max_tokens',
			name: 'Increase max_tokens by 10',
			checkCallback: async (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.settings.max_tokens += 10 ;
						await this.saveSettings();
                        this.updateStatusBar('');
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'decrease-max_tokens',
			name: 'decrease max_tokens by 10',
			checkCallback: async (checking: boolean) => {
				const leaf= this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.settings.max_tokens -= 10 ;
						await this.saveSettings();
						this.updateStatusBar('');
					}
					return true;
				}
				return false;
			}
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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


class SampleSettingTab extends PluginSettingTab {
	plugin: TextGeneratorPlugin;

	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for OpenAI.'});

		new Setting(containerEl)
			.setName('api_key')
			.setDesc('api_key')
			.addText(text => text
				.setPlaceholder('Enter your api_key')
				.setValue(this.plugin.settings.api_key)
				.onChange(async (value) => {
					this.plugin.settings.api_key = value;
					await this.plugin.saveSettings();
				}));

        new Setting(containerEl)
        .setName('engine')
        .setDesc('engine')
		.addDropdown((cb) => {
				cb.addOption("text-davinci-001", "text-davinci-001");
				cb.addOption("text-curie-001", "text-curie-001");
				cb.addOption("text-babbage-001", "text-babbage-001");
				cb.addOption("text-ada-001", "text-ada-001");
				cb.setValue(this.plugin.settings.engine);
				cb.onChange(async (value) => {
					this.plugin.settings.engine = value;
					await this.plugin.saveSettings();
				});
			})
		new Setting(containerEl)
		.setName('max_tokens')
		.setDesc('max_tokens')
		.addText(text => text
			.setPlaceholder('max_tokens')
			.setValue(this.plugin.settings.max_tokens.toString())
			.onChange(async (value) => {
				this.plugin.settings.max_tokens = parseInt(value) ;
				await this.plugin.saveSettings();
			}));

        new Setting(containerEl)
        .setName('temperature')
        .setDesc('temperature')
        .addText(text => text
            .setPlaceholder('temperature')
            .setValue(this.plugin.settings.temperature.toString())
            .onChange(async (value) => {
                this.plugin.settings.temperature = parseFloat(value) ;
                await this.plugin.saveSettings();
            }));

		new Setting(containerEl)
		.setName('frequency_penalty')
		.setDesc('frequency_penalty')
		.addText(text => text
			.setPlaceholder('frequency_penalty')
			.setValue(this.plugin.settings.frequency_penalty.toString())
			.onChange(async (value) => {
				this.plugin.settings.frequency_penalty = parseFloat(value) ;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('showStatusBar')
		.setDesc('Show information in the Status Bar')
		.addToggle(v=> v
			.setValue(this.plugin.settings.showStatusBar)
			.onChange(async (value) => {
				this.plugin.settings.showStatusBar = value ;
				await this.plugin.saveSettings();
			}));
	}
}
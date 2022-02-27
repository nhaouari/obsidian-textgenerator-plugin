import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface TextGeneratorSettings {
    api_key: string;
	engine: string; 
	max_tokens: number; 
	temperature: number;
	frequency_penalty: number;
	promp:string
}

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
    engine: "text-davinci-001",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	promp:""
}


export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;

    async getGeneratedText(params:TextGeneratorSettings) {

		const usedParams = {
			"prompt": params.promp,
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

     insertGeneratedText(text:string) {
        const cursor=this.app.workspace.activeLeaf.view.currentMode.editor.getCursor();
		this.app.workspace.activeLeaf.view.currentMode.editor.replaceRange(text,cursor)
      }

    async complete(params:TextGeneratorSettings){
        const text = await this.getGeneratedText(params);
        this.insertGeneratedText(text)
    }

    
	async onload() {
		await this.loadSettings();
		const statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pencil', 'Text Generator', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			statusBarItemEl.setText(`Text Generator (${this.settings.max_tokens}): processing... `);
            await this.complete({...this.settings,promp:leaf.view.currentMode.getSelection()});
            statusBarItemEl.setText(`Text Generator (${this.settings.max_tokens})`);
		});
		
		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			checkCallback: async (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
                        statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens}): processing... `);
						const settings = {...this.settings, promp:leaf.view.currentMode.getSelection()};
                        await this.complete(settings);
                        statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens}):`);
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
                        statusBarItemEl.setText(`OpenAI(${this.settings.max_tokens}):`);
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
                        statusBarItemEl.setText(`OpenAI(${this.settings.max_tokens}):`);
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
                this.plugin.settings.temperature = parseInt(value) ;
                await this.plugin.saveSettings();
            }));
            new Setting(containerEl)
			.setName('frequency_penalty')
			.setDesc('frequency_penalty')
			.addText(text => text
				.setPlaceholder('frequency_penalty')
				.setValue(this.plugin.settings.frequency_penalty.toString())
				.onChange(async (value) => {
					this.plugin.settings.frequency_penalty = parseInt(value) ;
					await this.plugin.saveSettings();
				}));
	}
}
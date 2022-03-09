import {App, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor} from 'obsidian';

// Remember to rename these classes and interfaces!

interface TextGeneratorSettings {
	api_key: string;
	engine: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	prompt: string;
	showStatusBar: boolean;
}

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "text-davinci-001",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true
}


export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl: any;

	async getGeneratedText(params: TextGeneratorSettings) {

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
		const requestResults = JSON.parse(await request(reqParams));
		const text = requestResults.choices[0].text
		return text
	}

	getMetaData() {
		const activeFile = this.app.workspace.getActiveFile();
		let metadata = ""
		if (activeFile !== null) {
			const cache = this.app.metadataCache.getCache(activeFile.path);
			if (cache.hasOwnProperty('frontmatter')) {
				const frontmatter = cache.frontmatter;

				for (const [key, value] of Object.entries(frontmatter)) {
					if (key === 'position') continue;

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
		const cursor = editor.getCursor();
		editor.replaceRange(text, cursor);
	}

	async complete(params: TextGeneratorSettings, insertMetadata: boolean = false,editor:Editor) {
		params={
			...params,
			prompt: this.getPrompt(editor)
		}
		
		if (insertMetadata) {
			const metadata = this.getMetaData();
			if (metadata.length === 0) {
				new Notice("Please provide a valid frontmatter!");
				return;
			} else {
				params.prompt = this.getMetaData() + params.prompt;
			}
		}
		let text = await this.getGeneratedText(params);
		this.insertGeneratedText(text,editor)
	}

	getPrompt(editor:Editor) {
		let selectedText = editor.getSelection();
		if (selectedText.length === 0) {
			const lineNumber = editor.getCursor().line;
			selectedText = editor.getLine(lineNumber);
		}
		return selectedText;
	}

	updateStatusBar(text: string) {
		let text2 = ""
		if (text.length > 0) {
			const text2 = `: ${text}`
		}

		if (this.settings.showStatusBar) {
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
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			await this.complete(this.settings,false,editor);
			this.updateStatusBar(``);
			}
		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				await this.complete(this.settings,false,editor);
				this.updateStatusBar(``);
			}
		});

		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			hotkeys: [{ modifiers: ["Ctrl",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				await this.complete(this.settings, true,editor);
				this.updateStatusBar(``);
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


class TextGeneratorSettingTab extends PluginSettingTab {
	plugin: TextGeneratorPlugin;

	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {
			containerEl
		} = this;

		containerEl.empty();

		containerEl.createEl('h2', {
			text: 'Settings for OpenAI.'
		});

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
					this.plugin.settings.max_tokens = parseInt(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('temperature')
			.setDesc('temperature')
			.addText(text => text
				.setPlaceholder('temperature')
				.setValue(this.plugin.settings.temperature.toString())
				.onChange(async (value) => {
					this.plugin.settings.temperature = parseFloat(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('frequency_penalty')
			.setDesc('frequency_penalty')
			.addText(text => text
				.setPlaceholder('frequency_penalty')
				.setValue(this.plugin.settings.frequency_penalty.toString())
				.onChange(async (value) => {
					this.plugin.settings.frequency_penalty = parseFloat(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('showStatusBar')
			.setDesc('Show information in the Status Bar')
			.addToggle(v => v
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));
	}
}

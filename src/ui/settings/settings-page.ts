import { App, PluginSettingTab, Setting, request, Notice } from "obsidian";
import TextGeneratorPlugin from "scr/main";
import packageJson from "package.json";
export default class TextGeneratorSettingTab extends PluginSettingTab {
	plugin: TextGeneratorPlugin;
	app: App;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
		let models = new Map();
		if (this.plugin.settings.models?.size > 0) {
			models = this.plugin.settings.models;
		} else {
			[
				"gpt-3.5-turbo",
				"gpt-4",
				"text-davinci-003",
				"text-davinci-002",
				"text-davinci-001",
				"text-curie-001",
				"text-babbage-001",
				"text-ada-001",
			].forEach((e) => models.set(e, ""));
			this.plugin.settings.models = models;
			this.plugin.saveSettings();
		}
	}

	async reloadPlugin() {
		await this.app.plugins.disablePlugin("obsidian-textgenerator-plugin");
		await this.app.plugins.enablePlugin("obsidian-textgenerator-plugin");
		this.app.setting.openTabById("obsidian-textgenerator-plugin").display();
	}
	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("H1", {
			text: "Text Generator v" + packageJson.version,
		});
		containerEl.createEl("a", {
			text: "Discord \u{1F44B} |",
			href: "https://bit.ly/Tg-discord",
		});
		containerEl.createEl("a", {
			text: " Documentation \u{1F4D6} |",
			href: "https://bit.ly/tg-doc",
		});
		containerEl.createEl("a", {
			text: " Twitter \u{1F426} |",
			href: "https://bit.ly/tg-twitter2",
		});
		containerEl.createEl("a", {
			text: " YouTube \u{1F3A5} |",
			href: "https://bit.ly/tg-youtube2",
		});

		containerEl.createEl("H1", {
			text: "OpenAI Settings",
		});
		containerEl.appendChild(
			createEl("a", {
				text: "API documentation",
				href: "https://beta.openai.com/docs/api-reference/introduction",
				cls: "linkMoreInfo",
			})
		);

		new Setting(containerEl)
			.setName("Endpoint")
			.setDesc("You can define openai api endpoint.")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API endpoint")
					.setValue(this.plugin.settings.endpoint)
					.onChange(async (value) => {
						this.plugin.settings.endpoint = value;
						await this.plugin.saveSettings();
					})
					.inputEl.setAttribute("type", "text")
			);

		let inputEl;
		const apikeuEl = new Setting(containerEl)
			.setName("API Key")
			.setDesc(
				"You need to create an account in OpenAI to generate an API Key."
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your API Key")
					.setValue(this.plugin.settings.api_key)
					.onChange(async (value) => {
						this.plugin.settings.api_key = value;
						await this.plugin.saveSettings();
					})
					.then((textEl) => {
						inputEl = textEl;
					})
					.inputEl.setAttribute("type", "password")
			);

		apikeuEl.addToggle((v) =>
			v.onChange((value) => {
				if (value) {
					inputEl.inputEl.setAttribute("type", "clear");
				} else {
					inputEl.inputEl.setAttribute("type", "password");
				}
			})
		);

		containerEl.appendChild(
			createEl("a", {
				text: "Create account OpenAI",
				href: "https://beta.openai.com/signup/",
				cls: "linkMoreInfo",
			})
		);

		let models = new Map();
		if (this.plugin.settings.models?.size > 0) {
			models = this.plugin.settings.models;
		} else {
			[
				"gpt-3.5-turbo",
				"gpt-4",
				"text-davinci-003",
				"text-davinci-002",
				"text-davinci-001",
				"text-curie-001",
				"text-babbage-001",
				"text-ada-001",
			].forEach((e) => models.set(e, ""));
			this.plugin.settings.models = models;
			this.plugin.saveSettings();
		}

		let cbModelsEl: any;
		new Setting(containerEl)
			.setName("Model")
			.setDesc(
				"gpt-3.5-turbo is the most advanced language model. text-ada-001 is the fastest model. GPT-4 is currently in a limited beta and only accessible to those who have been granted access."
			)
			.addDropdown((cb) => {
				cbModelsEl = cb;
				models.forEach((value, key) => {
					cb.addOption(key, key);
				});
				cb.setValue(this.plugin.settings.engine);
				cb.onChange(async (value) => {
					this.plugin.settings.engine = value;
					await this.plugin.saveSettings();
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Update models")
					.setCta()
					.onClick(async () => {
						if (this.plugin.settings.api_key.length > 0) {
							let reqParams = {
								url: `${this.plugin.settings.endpoint}/v1/models`,
								method: "GET",
								body: "",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${this.plugin.settings.api_key}`,
								},
							};

							const requestResults = JSON.parse(
								await request(reqParams)
							);
							requestResults.data.forEach(async (model) => {
								if (!models.get(model.id)) {
									cbModelsEl.addOption(model.id, model.id);
									models.set(model.id, "");
								}
							});
							this.plugin.settings.models = models;
							await this.plugin.saveSettings();
						} else {
							console.error("Please provide a valid api key.");
						}
					})
			);
		containerEl.appendChild(
			createEl("a", {
				text: "more information",
				href: "https://beta.openai.com/docs/models/overview",
				cls: "linkMoreInfo",
			})
		);

		new Setting(containerEl)
			.setName("Display errors in the editor")
			.setDesc("If you want to see the errors in the editor")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.displayErrorInEditor)
					.onChange(async (value) => {
						this.plugin.settings.displayErrorInEditor = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("")
			.setDesc("Reload the plugin")
			.addButton((btn) =>
				btn
					.setButtonText("Reload the plugin")
					.setCta()
					.onClick(async () => {
						await this.reloadPlugin();
					})
			);

		containerEl.createEl("H1", {
			text: "Default model parameters",
		});

		containerEl.createEl("H5", {
			text: "You can specify more parameters in the Frontmatter YAML",
		});
		containerEl.appendChild(
			createEl("a", {
				text: "API documentation",
				href: "https://beta.openai.com/docs/api-reference/completions",
				cls: "linkMoreInfo",
			})
		);
		new Setting(containerEl)
			.setName("Max tokens")
			.setDesc(
				"The maximum number of tokens to generate in the chat completion. The total length of input tokens and generated tokens is limited by the model's context length. (1000 tokens ~ 750 words)"
			)
			.addText((text) =>
				text
					.setPlaceholder("max_tokens")
					.setValue(this.plugin.settings.max_tokens.toString())
					.onChange(async (value) => {
						this.plugin.settings.max_tokens = parseInt(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Temperature")
			.setDesc(
				"What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic."
			)
			.addText((text) =>
				text
					.setPlaceholder("temperature")
					.setValue(this.plugin.settings.temperature.toString())
					.onChange(async (value) => {
						this.plugin.settings.temperature = parseFloat(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Frequency Penalty")
			.setDesc(
				"Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics."
			)
			.addText((text) =>
				text

					.setValue(this.plugin.settings.frequency_penalty.toString())
					.onChange(async (value) => {
						this.plugin.settings.frequency_penalty =
							parseFloat(value);
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Timeout")
			.setDesc(
				"Timeout in milliseconds. If the request takes longer than the timeout, the request will be aborted. (default: 5000ms)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Timeout")
					.setValue(this.plugin.settings.requestTimeout.toString())
					.onChange(async (value) => {
						this.plugin.settings.requestTimeout = parseInt(value);
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Prefix")
			.setDesc(
				"Prefix to add to the beginning of the completion (default: '\n\n')"
			)
			.addText((text) =>
				text
					.setPlaceholder("Prefix")
					.setValue(this.plugin.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Streaming")
			.setDesc(
				"Enable streaming for commands Generate Text and Generate Text(with metadata)"
			)
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.stream)
					.onChange(async (value) => {
						this.plugin.settings.stream = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("H1", {
			text: "Text Generator",
		});
		containerEl.createEl("H3", {
			text: "General",
		});
		new Setting(containerEl)
			.setName("Show Status in StatusBar")
			.setDesc("Show information in the Status Bar")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Output generated text to blockquote")
			.setDesc(
				"Distinguish between AI generated text and typed text using a blockquote"
			)
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.outputToBlockQuote)
					.onChange(async (value) => {
						this.plugin.settings.outputToBlockQuote = value;
						await this.plugin.saveSettings();
					})
			);

		const pathTempEl = new Setting(containerEl)
			.setName("Prompts Templates Path")
			.setDesc("Path of Prompts Templates")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.promptsPath)
					.onChange(async (value) => {
						this.plugin.settings.promptsPath = value;
						await this.plugin.saveSettings();
					})
					.inputEl.setAttribute("size", "50")
			);

		containerEl.createEl("H3", {
			text: "Considered Context",
		});

		new Setting(containerEl)
			.setName("includeTitle")
			.setDesc(
				"Include the title of the active document in the considered context."
			)
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeTitle)
					.onChange(async (value) => {
						this.plugin.settings.context.includeTitle = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("starredBlocks")
			.setDesc("Include starred blocks in the considered context.")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeStaredBlocks)
					.onChange(async (value) => {
						this.plugin.settings.context.includeStaredBlocks =
							value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("H3", {
			text: "Considered Context For Templates",
		});

		new Setting(containerEl)
			.setName("includeFrontmatter")
			.setDesc("Include frontmatter")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.context.includeFrontmatter = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("includeHeadings")
			.setDesc("Include headings with their content.")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeHeadings)
					.onChange(async (value) => {
						this.plugin.settings.context.includeHeadings = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("includeChildren")
			.setDesc("Include the content of internal md links on the page.")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeChildren)
					.onChange(async (value) => {
						this.plugin.settings.context.includeChildren = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("includeMentions")
			.setDesc("Include paragraphs from mentions (linked, unliked).")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeMentions)
					.onChange(async (value) => {
						this.plugin.settings.context.includeMentions = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("includeHighlights")
			.setDesc("Include Obsidian Highlights.")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeHighlights)
					.onChange(async (value) => {
						this.plugin.settings.context.includeHighlights = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("includeExtractions")
			.setDesc("Include Extracted Information")
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.context.includeExtractions)
					.onChange(async (value) => {
						this.plugin.settings.context.includeExtractions = value;
						await this.plugin.saveSettings();
					})
			);
		containerEl.createEl("H5", {
			text: "Extractors Options",
		});

		new Setting(containerEl)
			.setName("PDF Extractor")
			.setDesc("Enable or disable PDF extractor.")
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.extractorsOptions.PDFExtractor
					)
					.onChange(async (value) => {
						this.plugin.settings.extractorsOptions.PDFExtractor =
							value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Web Page Extractor")
			.setDesc("Enable or disable web page extractor.")
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.extractorsOptions.WebPageExtractor
					)
					.onChange(async (value) => {
						this.plugin.settings.extractorsOptions.WebPageExtractor =
							value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Youtube Extractor")
			.setDesc("Enable or disable Youtube extractor.")
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.extractorsOptions.YoutubeExtractor
					)
					.onChange(async (value) => {
						this.plugin.settings.extractorsOptions.YoutubeExtractor =
							value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Audio Extractor (Whisper)")
			.setDesc(
				"Enable or disable audio extractor using Whisper OpenAI ($0.006 / minute) supports multi-languages and accepts a variety of formats (m4a, mp3, mp4, mpeg, mpga, wav, webm)."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.extractorsOptions.AudioExtractor
					)
					.onChange(async (value) => {
						this.plugin.settings.extractorsOptions.AudioExtractor =
							value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("H3", {
			text: "Auto-Suggest Options",
		});

		this.plugin.settings.autoSuggestOptions = {
			...this.plugin.defaultSettings.autoSuggestOptions,
			...this.plugin.settings.autoSuggestOptions,
		};

		new Setting(containerEl)
			.setName("Enable/Disable")
			.setDesc("Enable or disable auto-suggest.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoSuggestOptions.isEnabled)
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.isEnabled =
							value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Trigger Phrase")
			.setDesc(
				"Enter the trigger phrase for auto-suggest. (The default is double spaces.)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Trigger Phrase")
					.setValue(
						this.plugin.settings.autoSuggestOptions.triggerPhrase?.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.triggerPhrase =
							value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Delay milliseconds for trigger")
			.addSlider((slider) =>
				slider
					.setLimits(0, 2000, 50)
					.setValue(this.plugin.settings.autoSuggestOptions.delay)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.delay = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Number of Suggestions")
			.setDesc(
				"Enter the number of suggestions to generate. Please note that increasing this value may significantly increase the cost of usage with GPT-3."
			)
			.addText((text) =>
				text
					.setValue(
						this.plugin.settings.autoSuggestOptions.numberOfSuggestions?.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.numberOfSuggestions =
							parseInt(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Stop Phrase")
			.setDesc(
				"Enter the stop phrase to use for generating auto-suggestions. The generation will stop when the stop phrase is found. (Use a space for words, a period for sentences, and a newline for paragraphs.)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Stop Phrase")
					.setValue(
						this.plugin.settings.autoSuggestOptions.stop?.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.stop = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show/Hide Auto-suggest status in Status Bar")
			.setDesc("")
			.addToggle((v) =>
				v
					.setValue(
						this.plugin.settings.autoSuggestOptions.showStatus
					)
					.onChange(async (value) => {
						this.plugin.settings.autoSuggestOptions.showStatus =
							value;
						this.plugin.AutoSuggestStatusBar();
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("H3", {
			text: "Options",
			cls: "tg-opts",
		});

		const opts = {
			...this.plugin.defaultSettings.options,
			...this.plugin.settings.options,
		};
		for (const key in opts) {
			new Setting(containerEl)
				.setName(key)
				.setDesc(
					this.plugin.commands.find(
						(c) =>
							c.id === key ||
							c.id === "obsidian-textgenerator-plugin:" + key
					)?.name || key
				)
				.addToggle((v) =>
					v
						.setValue(this.plugin.settings.options[key])
						.onChange(async (value) => {
							this.plugin.settings.options[key] = value;
							await this.plugin.saveSettings();
							if (this.plugin.settings.options[key]) {
								new Notice(`${key} is enabled.`);
							} else {
								new Notice(`${key} is disabled.`);
							}
							await this.reloadPlugin();
							document.querySelector(".tg-opts").scrollIntoView();
						})
				);
		}
	}
}

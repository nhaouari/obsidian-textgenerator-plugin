import { App, PluginSettingTab, Setting } from 'obsidian';
import TextGeneratorPlugin from '../main';

export default class TextGeneratorSettingTab extends PluginSettingTab {
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
			.setDesc('You need to create an account in OpenAI to generate an API Key. (https://beta.openai.com/)')
			.addText(text => text
				.setPlaceholder('Enter your API Key')
				.setValue(this.plugin.settings.api_key)
				.onChange(async (value) => {
					this.plugin.settings.api_key = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('engine')
			.setDesc('text-davinci-002 is Most capable model. text-ada-001 is the fastest model (more information: https://beta.openai.com/docs/models/overview)')
			.addDropdown((cb) => {
				cb.addOption("text-davinci-002", "text-davinci-002");
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
			.setDesc('The max number of the tokens that will be generated (1000 tokens ~ 750 words)')
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
				
				.setValue(this.plugin.settings.frequency_penalty.toString())
				.onChange(async (value) => {
					this.plugin.settings.frequency_penalty = parseFloat(value);
					await this.plugin.saveSettings();
				})
				);

		new Setting(containerEl)
			.setName('showStatusBar')
			.setDesc('Show information in the Status Bar')
			.addToggle(v => v
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));

        new Setting(containerEl)
        .setName('promptsPath')
        .setDesc('promptsPath')
        .addText(text => text
            .setValue(this.plugin.settings.promptsPath)
            .onChange(async (value) => {
                this.plugin.settings.promptsPath = value;
                await this.plugin.saveSettings();
            })
			.inputEl.setAttribute('size','50')
			);
	}
}

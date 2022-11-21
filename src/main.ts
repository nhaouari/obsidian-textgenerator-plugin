import {addIcon, Notice, Plugin, MarkdownView, Editor} from 'obsidian';
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
	promptsPath:"textgenerator/prompts",
	context:{
		includeTitle:false,
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
		this.updateStatusBar(`processing... `);
		const activeView = this.getActiveView();
			if (activeView !== null) {
				const editor = activeView.editor;
				editor.replaceRange(' <span id="tg-loading" class="loading dots"/> ',editor.getCursor());
			}
	}

	endProcessing(){ 
		this.updateStatusBar(``);
		const activeView = this.getActiveView();
		if (activeView !== null) {
			const editor = activeView.editor;
			const cursor= editor.getCursor();
			let text = editor.getValue();
			text=text.replace(' <span id="tg-loading" class="loading dots"/> ','');
			editor.setValue(text);
			editor.setCursor(cursor);
		}
	}

	handelError(error:any){
		new Notice("🔴Error:Text Generator Plugin: Error check console CTRL+SHIFT+I");
		console.error(error);
		this.updateStatusBar(`Error check console`);
		setTimeout(()=>this.updateStatusBar(``),3000);
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
		
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('GENERATE_ICON', 'Generate Text!', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const activeFile = this.app.workspace.getActiveFile();
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			try {
				await this.textGenerator.generateInEditor(this.settings,false,editor);
			} catch (error) {
				this.handelError(error);
			}
			}
		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Mod"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				try {
					await this.textGenerator.generateInEditor(this.settings,false,editor);
				} catch (error) {
					this.handelError(error);
				}	
			}
		});
		
		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			icon: 'GENERATE_META_ICON',
			hotkeys: [{ modifiers: ["Mod",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				try {
					await this.textGenerator.generateInEditor(this.settings,true,editor);
					this.updateStatusBar(``);
				} catch (error) {
					this.handelError(error);
				}
			}
		});

		this.addCommand({
			id: 'insert-generated-text-From-template',
			name: 'Generate and Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Mod"], key: "q"}],
			editorCallback: async (editor: Editor) => {
				try {
					new ExampleModal(this.app, this,async (result) => {		
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor,true);		
					  },'Generate and Insert Template').open();
				} catch (error) {
					this.handelError(error);
				}
			}
		});

		this.addCommand({
			id: 'create-generated-text-From-template',
			name: 'Generate and Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Mod","Shift"], key: "q"}],
			editorCallback: async (editor: Editor) => {
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor,false);
					  },'Generate and Create a New File From Template').open();
					
				} catch (error) {
					this.handelError(error);
				}
			}
		});

		this.addCommand({
			id: 'insert-text-From-template',
			name: 'Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ['Alt'], key: "q"}],
			editorCallback: async (editor: Editor) => {
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor,true);
					  },'Insert Template').open();
				} catch (error) {
					this.handelError(error);
				}	
			}
		});

		this.addCommand({
			id: 'create-text-From-template',
			name: 'Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Shift","Alt"], key: "q"}],
			editorCallback: async (editor: Editor) => {
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor,false);
					  },'Create a New File From Template').open();
				} catch (error) {
					this.handelError(error);
				}	
			}
		});


		this.addCommand({
			id: 'set_max_tokens',
			name: 'Set max_tokens',
			hotkeys: [{ modifiers: ["Mod","Alt"], key: "1" }],
			editorCallback: async () => {
				new SetMaxTokens(this.app,this,this.settings.max_tokens.toString(),async (result: string) => {
					this.settings.max_tokens = parseInt(result);
					await this.saveSettings();
					new Notice(`Set Max Tokens to ${result}!`);
				  }).open();

			}
		});

		this.addCommand({
			id: 'packageManager',
			name: 'Template Packages Manager',
			hotkeys: [{ modifiers: ["Mod","Alt"], key: "3" }],
			editorCallback: async () => {
				new PackageManagerUI(this.app,this,async (result: string) => {
				  }).open();

			}
		});
		
		this.addCommand({
			id: 'set-model',
			name: 'Choose a model',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Mod","Alt"], key: "2" }],
			editorCallback: async (editor: Editor) => {
				try {
					new SetModel(this.app, this,async (result) => {
						this.settings.engine=result;
						await this.saveSettings();
					  },'Choose a model').open();
				} catch (error) {
					this.handelError(error);
				}	
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TextGeneratorSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
import {
	addIcon,
	Notice,
	Plugin,
	MarkdownView,
	Editor,
	MarkdownRenderer,
	MarkdownPostProcessorContext,
	getIcon,
} from "obsidian";
import { ExampleModal } from "./models/model";
import { TextGeneratorSettings } from "./types";
import { numberToKFormat } from "./utils";
import { GENERATE_ICON, GENERATE_META_ICON, OPENAI_MODELS } from "./constants";
import TextGeneratorSettingTab from "./ui/settings/settings-page";
import { SetMaxTokens } from "./ui/settings/set-max-tokens";
import TextGenerator from "./text-generator";
import { SetModel } from "./ui/settings/set-model";
import PackageManager from "./ui/package-manager/package-manager";
import { PackageManagerUI } from "./ui/package-manager/package-manager-ui";
import { EditorView } from "@codemirror/view";
import { spinnersPlugin } from "./cm/plugin";
import Handlebars from "handlebars";
import PrettyError from "pretty-error";
import ansiToHtml from "ansi-to-html";
import { AutoSuggest } from "./auto-suggest";
import debug from "debug";
import { init, Tiktoken } from "@dqbd/tiktoken/lite/init";
import wasm from "../node_modules/@dqbd/tiktoken/tiktoken_bg.wasm";
import cl100k_base from "@dqbd/tiktoken/encoders/cl100k_base.json";
import r50k_base from "@dqbd/tiktoken/encoders/r50k_base.json";
import p50k_base from "@dqbd/tiktoken/encoders/p50k_base.json";
import {
	ExtractorMethod,
	ContentExtractor,
} from "./extractors/content-extractor";
const logger = debug("textgenerator:main");
const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "gpt-3.5-turbo",
	max_tokens: 500,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true,
	outputToBlockQuote: false,
	promptsPath: "textgenerator/prompts",
	context: {
		includeTitle: false,
		includeStaredBlocks: true,
		includeFrontmatter: true,
		includeHeadings: true,
		includeChildren: false,
		includeMentions: false,
		includeHighlights: true,
		includeExtractions: false,
	},
	timeout: 30000,
	options: {
		"generate-text": true,
		"generate-text-with-metadata": true,
		"insert-generated-text-From-template": true,
		"create-generated-text-From-template": false,
		"insert-text-From-template": false,
		"create-text-From-template": false,
		"show-modal-From-template": true,
		set_max_tokens: true,
		"set-model": true,
		packageManager: true,
		"create-template": false,
		"get-title": true,
		"generated-text-to-clipboard-From-template": false,
		"calculate-tokens": true,
		"calculate-tokens-for-template": true,
	},
	autoSuggestOptions: {
		status: false,
		delay: 300,
		numberOfSuggestions: 5,
		triggerPhrase: "  ",
		stop: ".",
		showStatus: true,
	},
	extractorsOptions: {
		PDFExtractor: true,
		WebPageExtractor: true,
		YoutubeExtractor: true,
		AudioExtractor: false,
	},
	displayErrorInEditor: false,
};

export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	textGenerator: TextGenerator;
	packageManager: PackageManager;
	processing: false;
	defaultSettings: TextGeneratorSettings;
	textGeneratorIconItem: HTMLElement = null;
	autoSuggestItem: HTMLElement = null;
	statusBarTokens: HTMLElement = null;
	notice: Notice;

	updateStatusBar(text: string, processing = false) {
		let text2 = "";
		if (text.length > 0) {
			text2 = `: ${text}`;
		}
		if (this.settings.showStatusBar) {
			this.textGeneratorIconItem.innerHTML = "";
			this.statusBarTokens.innerHTML = "";

			if (processing) {
				let span = document.createElement("span");
				span.addClasses(["loading", "dots"]);
				span.setAttribute("id", "tg-loading");
				span.style.width = "16px";
				span.style.alignContent = "center";
				this.textGeneratorIconItem.append(span);
				this.textGeneratorIconItem.title = "Generating Text...";
				this.notice && this.notice.hide();
				this.notice = new Notice(`Processing...`, 100000);
			} else {
				this.textGeneratorIconItem.append(getIcon("bot"));
				this.textGeneratorIconItem.title = "Text Generator";
				this.textGeneratorIconItem.addClass("mod-clickable");
				this.textGeneratorIconItem.addEventListener("click", () => {
					this.app.setting.open();
					this.app.setting
						.openTabById("obsidian-textgenerator-plugin")
						.display();
				});

				if (this.notice) {
					this.notice.hide();
					if (text.length > 0) {
						new Notice(text);
					}
				}
			}
			this.statusBarTokens.addClass("mod-clickable");
			const statusBarTokens = this.statusBarTokens.createEl("span");
			statusBarTokens.textContent = `${numberToKFormat(
				this.settings.max_tokens
			)}`;
			statusBarTokens.title = "Max Tokens for Output";
			statusBarTokens.addClass("mod-clickable");
			statusBarTokens.addEventListener("click", () => {
				new SetMaxTokens(
					this.app,
					this,
					this.settings.max_tokens.toString(),
					async (result: string) => {
						this.settings.max_tokens = parseInt(result);
						await this.saveSettings();
						new Notice(`Set Max Tokens to ${result}!`);
						this.updateStatusBar("");
					}
				).open();
			});
		}
	}

	startProcessing(showSpinner: boolean = true) {
		this.updateStatusBar(``, true);
		this.processing = true;
		const activeView = this.getActiveView();
		if (activeView !== null && showSpinner) {
			const editor = activeView.editor;
			// @ts-expect-error, not typed
			const editorView = activeView.editor.cm as EditorView;
			const plugin = editorView.plugin(spinnersPlugin);

			if (plugin) {
				plugin.add(
					editor.posToOffset(editor.getCursor("to")),
					editorView
				);
				this.app.workspace.updateOptions();
			}
		}
	}

	endProcessing(showSpinner: boolean = true) {
		this.updateStatusBar(``);
		this.processing = false;
		const activeView = this.getActiveView();
		if (activeView !== null && showSpinner) {
			const editor = activeView.editor;
			// @ts-expect-error, not typed
			const editorView = activeView.editor.cm as EditorView;
			const plugin = editorView.plugin(spinnersPlugin);

			if (plugin) {
				plugin.remove(
					editor.posToOffset(editor.getCursor("to")),
					editorView
				);
			}
		}
	}

	formatError(error: any) {
		const pe = new PrettyError();
		const convert = new ansiToHtml();
		let formattedError = convert.toHtml(pe.render(error));
		const lines = formattedError.split("\n");
		const formattedLines = lines.map((line) => `> ${line}`);
		formattedError = `> [!failure]- Failure \n${formattedLines.join(
			"\n"
		)} \n`;
		const errorContainer = document.createElement("div");
		errorContainer.classList.add("error-container");
		errorContainer.innerHTML = formattedError;

		return errorContainer;
	}

	async handelError(error: any) {
		if (error.message) {
			new Notice("🔴 " + error.message);
		} else {
			new Notice(
				"🔴 Error: Text Generator Plugin: An error has occurred. Please check the console by pressing CTRL+SHIFT+I or turn on display errors in the editor within the settings for more information."
			);
		}

		console.error(error);
		//this.updateStatusBar(`Error check console`);
		const activeView = this.getActiveView();
		if (activeView !== null && this.settings.displayErrorInEditor) {
			activeView.editor.cm.contentDOM.appendChild(
				this.formatError(error)
			);
		}

		setTimeout(() => this.updateStatusBar(``), 5000);
	}

	getActiveView() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView !== null) {
			return activeView;
		} else {
			new Notice("The file type should be Markdown!");
			return null;
		}
	}

	AutoSuggestStatusBar() {
		this.autoSuggestItem.innerHTML = "";
		if (this.settings.autoSuggestOptions.showStatus) {
			let languageIcon;
			if (!this.settings.autoSuggestOptions.status) {
				languageIcon = getIcon("zap-off");
			} else {
				languageIcon = getIcon("zap");
			}
			this.autoSuggestItem.append(languageIcon);
			this.autoSuggestItem.title =
				"Text Generator Enable or disable Auto-suggest";
			this.autoSuggestItem.addClass("mod-clickable");
		}
	}

	AddAutoSuggestStatusBar() {
		this.AutoSuggestStatusBar();
		const onClickAutoSuggestStatusBar = (event) => {
			this.settings.autoSuggestOptions.status =
				!this.settings.autoSuggestOptions.status;
			this.saveSettings();
			this.AutoSuggestStatusBar();
			if (this.settings.autoSuggestOptions.status) {
				new Notice(`Auto Suggestion is on!`);
			} else {
				new Notice(`Auto Suggestion is off!`);
			}
		};
		this.autoSuggestItem.addEventListener(
			"click",
			onClickAutoSuggestStatusBar
		);
	}

	getModelInfo(model) {
		if (model in OPENAI_MODELS) {
			return OPENAI_MODELS[model];
		} else {
			null;
		}
	}

	getTokens(text: string) {
		let tokens: Uint32Array = null;
		const modelName = this.settings.engine;
		const modelInfo = this.getModelInfo(modelName);
		if (modelInfo) {
			logger("encoding wasm");
			let model;
			switch (modelInfo.encoding) {
				case "cl100k_base":
					model = cl100k_base;
					break;
				case "r50k_base":
					model = r50k_base;
					break;
				case "p50k_base":
					model = p50k_base;
					break;
				default:
					break;
			}
			const encoder = new Tiktoken(
				model.bpe_ranks,
				model.special_tokens,
				model.pat_str
			);
			logger("encoding wasm");
			tokens = encoder.encode(text);
		}
		return { tokens, modelInfo };
	}

	estimateTokens(text: string) {
		const result = this.getTokens(text);
		const tokens = result.tokens.length;
		logger("done wasm");

		const summaryEl = document.createElement("div");
		summaryEl.classList.add("summary");

		const { engine, max_tokens } = this.settings;
		const { maxTokens, prices } = result.modelInfo;
		const total = tokens + max_tokens;

		summaryEl.innerHTML = `
  <table>
    <tr><td><strong>Model</strong></td><td>${engine}</td></tr>
    <tr><td><strong>Prompt tokens</strong></td><td>${tokens}</td></tr>
    <tr><td><strong>Completion tokens</strong></td><td>${max_tokens}</td></tr>
    <tr><td><strong>Total tokens</strong></td><td>${total}</td></tr>
    <tr><td><strong>Max Tokens</strong></td><td>${maxTokens}</td></tr>
    <tr><td><strong>Estimated Price</strong></td><td class="price">$${(
		(tokens * prices.prompt + max_tokens * prices.completion) /
		1000
	).toLocaleString()}</td></tr>
  </table>
`;

		logger(summaryEl);
		new Notice(summaryEl, 5000);
	}
	async onload() {
		logger("loading textGenerator plugin");
		await init((imports) => WebAssembly.instantiate(wasm, imports));
		addIcon("GENERATE_ICON", GENERATE_ICON);
		addIcon("GENERATE_META_ICON", GENERATE_META_ICON);
		this.defaultSettings = DEFAULT_SETTINGS;
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		const settingTab = new TextGeneratorSettingTab(this.app, this);
		this.addSettingTab(settingTab);
		this.textGenerator = new TextGenerator(this.app, this);
		this.packageManager = new PackageManager(this.app, this);
		this.registerEditorExtension(spinnersPlugin);
		this.app.workspace.updateOptions();

		this.textGeneratorIconItem = this.addStatusBarItem();
		this.statusBarTokens = this.addStatusBarItem();
		this.autoSuggestItem = this.addStatusBarItem();
		this.statusBarItemEl = this.addStatusBarItem();

		this.updateStatusBar(``);
		if (
			this.settings.options["auto-suggest"] &&
			this.settings.autoSuggestOptions.showStatus
		) {
			this.AddAutoSuggestStatusBar();
		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"GENERATE_ICON",
			"Generate Text!",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				const activeFile = this.app.workspace.getActiveFile();
				const activeView = this.getActiveView();
				if (activeView !== null) {
					const editor = activeView.editor;
					try {
						await this.textGenerator.generateInEditor(
							this.settings,
							false,
							editor
						);
					} catch (error) {
						this.handelError(error);
					}
				}
			}
		);

		const ribbonIconEl2 = this.addRibbonIcon(
			"boxes",
			"Text Generator: Templates Packages Manager",
			async (evt: MouseEvent) => {
				new PackageManagerUI(
					this.app,
					this,
					async (result: string) => {}
				).open();
			}
		);

		/*
		const ribbonIconEl3 = this.addRibbonIcon(
			"square",
			"Download webpage as markdown",
			async (evt: MouseEvent) => {
			const contentExtractor = new ContentExtractor(this.app);
				contentExtractor.setExtractor(ExtractorMethod.WebPageExtractor);
				const urls = await contentExtractor.extract("");
				console.log(await contentExtractor.convert(urls[0]));
				
				let extractedContent: any = {};
				const contentExtractor = new ContentExtractor(this.app, this);
				for (let key in ExtractorMethod) {
					if (!isNaN(parseInt(key))) {
						contentExtractor.setExtractor(parseInt(key));
						const links = await contentExtractor.extract(
							this.app.workspace.getActiveFile().path
						);
						extractedContent[ExtractorMethod[key]] = "";
						if (links.length > 0) {
							extractedContent[ExtractorMethod[key]] =
								await Promise.all(
									links.map((link) =>
										contentExtractor.convert(link)
									)
								);
						}
					}
				}
				console.log(extractedContent);
				
			}
				
		);*/

		this.commands = [
			{
				id: "generate-text",
				name: "Generate Text!",
				icon: "GENERATE_ICON",
				hotkeys: [{ modifiers: ["Mod"], key: "j" }],
				editorCallback: async (editor: Editor) => {
					try {
						await this.textGenerator.generateInEditor(
							this.settings,
							false,
							editor
						);
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "generate-text-with-metadata",
				name: "Generate Text (use Metadata))!",
				icon: "GENERATE_META_ICON",
				hotkeys: [{ modifiers: ["Mod", "Alt"], key: "j" }],
				editorCallback: async (editor: Editor) => {
					try {
						await this.textGenerator.generateInEditor(
							this.settings,
							true,
							editor
						);
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "insert-generated-text-From-template",
				name: "Templates: Generate & Insert ",
				icon: "circle",
				//hotkeys: [{ modifiers: ["Mod"], key: "q"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.generateFromTemplate(
									this.settings,
									result.path,
									true,
									editor,
									true
								);
							},
							"Generate and Insert Template In The Active Note"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},
			{
				id: "generated-text-to-clipboard-From-template",
				name: "Templates: Generate & Copy To Clipboard ",
				icon: "circle",
				//hotkeys: [{ modifiers: ["Mod"], key: "q"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.generateToClipboard(
									this.settings,
									result.path,
									true,
									editor
								);
							},
							"Generate & Copy To Clipboard"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "create-generated-text-From-template",
				name: "Templates: Generate & Create Note",
				icon: "plus-circle",
				//hotkeys: [{ modifiers: ["Mod","Shift"], key: "q"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.generateFromTemplate(
									this.settings,
									result.path,
									true,
									editor,
									false
								);
							},
							"Generate and Create a New Note From Template"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "insert-text-From-template",
				name: "Templates: Insert Template",
				icon: "square",
				//hotkeys: [{ modifiers: ['Alt'], key: "q"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.createToFile(
									this.settings,
									result.path,
									true,
									editor,
									true
								);
							},
							"Insert Template In The Active Note"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "create-text-From-template",
				name: "Templates: Insert & Create Note",
				icon: "plus-square",
				//hotkeys: [{ modifiers: ["Shift","Alt"], key: "q"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.createToFile(
									this.settings,
									result.path,
									true,
									editor,
									false
								);
							},
							"Create a New Note From Template"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "show-modal-From-template",
				name: "Show model From Template",
				icon: "layout",
				//hotkeys: [{ modifiers: ["Alt"], key: "4"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								await this.textGenerator.tempalteToModel(
									this.settings,
									result.path,
									editor
								);
							},
							"Choose a template"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "set_max_tokens",
				name: "Set max_tokens",
				icon: "separator-horizontal",
				//hotkeys: [{ modifiers: ["Alt"], key: "1" }],
				callback: async () => {
					new SetMaxTokens(
						this.app,
						this,
						this.settings.max_tokens.toString(),
						async (result: string) => {
							this.settings.max_tokens = parseInt(result);
							await this.saveSettings();
							new Notice(`Set Max Tokens to ${result}!`);
							this.updateStatusBar("");
						}
					).open();
				},
			},

			{
				id: "set-model",
				name: "Choose a model",
				icon: "list-start",
				//hotkeys: [{ modifiers: ["Alt"], key: "2" }],
				callback: async () => {
					try {
						new SetModel(
							this.app,
							this,
							async (result) => {
								this.settings.engine = result;
								await this.saveSettings();
							},
							"Choose a model"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "packageManager",
				name: "Template Packages Manager",
				icon: "boxes",
				//hotkeys: [{ modifiers: ["Alt"], key: "3" }],
				callback: async () => {
					new PackageManagerUI(
						this.app,
						this,
						async (result: string) => {}
					).open();
				},
			},

			{
				id: "create-template",
				name: "Create a Template",
				icon: "plus",
				//hotkeys: [{ modifiers: ["Alt"], key: "c"}],
				editorCallback: async (editor: Editor) => {
					try {
						await this.textGenerator.createTemplateFromEditor(
							editor
						);
					} catch (error) {
						this.handelError(error);
					}
				},
			},

			{
				id: "get-title",
				name: "Generate a Title",
				icon: "heading",
				//hotkeys: [{ modifiers: ["Alt"], key: "c"}],
				editorCallback: async (editor: Editor) => {
					try {
						const maxLength = 255;
						const prompt = `Generate a title for the current document (do not use * " \ / < > : | ? .):
			  ${editor.getValue().slice(0, maxLength)}
			  `;
						const additionalParams = {
							showSpinner: false,
						};
						const generatedTitle =
							await this.textGenerator.generate(
								{ context: prompt },
								false,
								this.settings,
								"",
								additionalParams
							);
						const sanitizedTitle = generatedTitle
							.replace(/[*\\"/<>:|?\.]/g, "")
							.replace(/^\n*/g, "");
						const activeFile = this.app.workspace.getActiveFile();
						const renamedFilePath = activeFile.path.replace(
							activeFile.name,
							`${sanitizedTitle}.md`
						);
						await this.app.fileManager.renameFile(
							activeFile,
							renamedFilePath
						);
						logger(`Generated a title: ${sanitizedTitle}`);
					} catch (error) {
						this.handelError(error);
					}
				},
			},
			{
				id: "auto-suggest",
				name: "Turn on or off the auto suggestion",
				icon: "heading",
				//hotkeys: [{ modifiers: ["Alt"], key: "c"}],
				callback: async () => {
					this.settings.autoSuggestOptions.status =
						!this.settings.autoSuggestOptions.status;
					await this.saveSettings();
					this.AutoSuggestStatusBar();

					if (this.settings.autoSuggestOptions.status) {
						new Notice(`Auto Suggestion is on!`);
					} else {
						new Notice(`Auto Suggestion is off!`);
					}
				},
			},
			{
				id: "calculate-tokens",
				name: "Estimate tokens for the current document",
				icon: "heading",
				//hotkeys: [{ modifiers: ["Alt"], key: "c"}],
				editorCallback: async (editor: Editor) => {
					this.estimateTokens(editor.getValue());
				},
			},
			{
				id: "calculate-tokens-for-template",
				name: "Estimate tokens for a Template",
				icon: "layout",
				//hotkeys: [{ modifiers: ["Alt"], key: "4"}],
				editorCallback: async (editor: Editor) => {
					try {
						new ExampleModal(
							this.app,
							this,
							async (result) => {
								const text = (
									await this.textGenerator.contextManager.getContext(
										editor,
										true,
										result.path
									)
								).context;
								this.estimateTokens(text);
							},
							"Choose a template"
						).open();
					} catch (error) {
						this.handelError(error);
					}
				},
			},
		];

		this.addCommands();
		const blockTgHandler = async (
			source: string,
			container: HTMLElement,
			{ sourcePath: path }: MarkdownPostProcessorContext
		) => {
			setTimeout(async () => {
				try {
					const template = Handlebars.compile(source, {
						noEscape: true,
						strict: true,
					});
					const markdown = template(
						await this.textGenerator.contextManager.getTemplateContext(
							this.getActiveView().editor
						)
					);
					await MarkdownRenderer.renderMarkdown(
						markdown,
						container,
						path,
						undefined
					);
					this.addTGMenu(container, markdown, source);
				} catch (e) {
					console.warn(e);
				}
			}, 100);
		};

		this.registerMarkdownCodeBlockProcessor("tg", async (source, el, ctx) =>
			blockTgHandler(source, el, ctx)
		);

		await this.packageManager.load();
		this.registerEditorSuggest(new AutoSuggest(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	addCommands() {
		let cmds = this.commands.filter(
			(cmd) => this.settings.options[cmd.id] === true
		);
		const promptsPath = this.settings.promptsPath;
		const paths = app.metadataCache
			.getCachedFiles()
			.filter(
				(path) =>
					path.includes(promptsPath) && !path.includes("/trash/")
			);
		const templates = paths.map((s) => ({
			title: s.substring(promptsPath.length + 1),
			path: s,
			...this.textGenerator.getMetadata(s),
		}));
		//debugger

		const templatesWithCommands = templates.filter((t) => t?.commands);
		logger("Templates with commands ", { templatesWithCommands });

		templatesWithCommands.forEach((template) => {
			//debugger
			template.commands.forEach((command) => {
				logger("Tempate commands ", { template, command });
				const cmd = {
					id: `${
						template.path.split("/").slice(-2, -1)[0]
					}-${command}-${template.id}`,
					name: `${command.toUpperCase()} ${template.title}`,
					editorCallback: async (editor: Editor) => {
						try {
							switch (command) {
								case "generate":
									await this.textGenerator.generateFromTemplate(
										this.settings,
										template.path,
										true,
										editor,
										true
									);
									break;
								case "insert":
									await this.textGenerator.createToFile(
										this.settings,
										template.path,
										true,
										editor,
										true
									);
									break;
								case "generate&create":
									await this.textGenerator.generateFromTemplate(
										this.settings,
										template.path,
										true,
										editor,
										false
									);
									break;
								case "insert&create":
									await this.textGenerator.createToFile(
										this.settings,
										template.path,
										true,
										editor,
										false
									);
									break;
								case "model":
									await this.textGenerator.tempalteToModel(
										this.settings,
										template.path,
										editor
									);
									break;
								case "clipboard":
									await this.textGenerator.generateToClipboard(
										this.settings,
										template.path,
										true,
										editor
									);
									break;
								case "estimate":
									{
										const text = (
											await this.textGenerator.contextManager.getContext(
												editor,
												true,
												template.path
											)
										).context;
										this.estimateTokens(text);
									}
									break;
								default:
									console.error("command name not found");
									break;
							}
						} catch (error) {
							this.handelError(error);
						}
					},
				};
				logger("command ", { cmd, template });
				cmds.push(cmd);
			});
		});

		cmds.forEach((command) => {
			this.addCommand(command);
		});
	}
	createRunButton(label: string, svg: string) {
		const button = document.createElement("div");
		button.classList.add("clickable-icon");
		button.setAttribute("aria-label", label);
		//aria-label-position="right"
		button.innerHTML = svg;

		return button;
	}

	addTGMenu(el: HTMLElement, markdown: string, source: string) {
		const div = document.createElement("div");
		div.classList.add("tgmenu");
		const generateSVG = `<svg viewBox="0 0 100 100" class="svg-icon GENERATE_ICON"><defs><style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:4px;}</style></defs><g id="Layer_2" data-name="Layer 2"><g id="VECTOR"><rect class="cls-1" x="74.98" y="21.55" width="18.9" height="37.59"></rect><path class="cls-1" d="M38.44,27.66a8,8,0,0,0-8.26,1.89L24.8,34.86a25.44,25.44,0,0,0-6,9.3L14.14,56.83C11.33,64.7,18.53,67.3,21,60.9" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="74.98 25.58 56.61 18.72 46.72 15.45"></polyline><path class="cls-1" d="M55.45,46.06,42.11,49.43,22.76,50.61c-8.27,1.3-5.51,11.67,4.88,12.8L46.5,65.78,53,68.4a23.65,23.65,0,0,0,17.9,0l6-2.46" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M37.07,64.58v5.91A3.49,3.49,0,0,1,33.65,74h0a3.49,3.49,0,0,1-3.45-3.52V64.58" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M48,66.58v5.68a3.4,3.4,0,0,1-3.34,3.46h0a3.4,3.4,0,0,1-3.34-3.45h0V65.58" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="28.75 48.05 22.66 59.3 13.83 65.61 14.41 54.5 19.11 45.17"></polyline><polyline class="cls-1" points="25.17 34.59 43.75 0.25 52.01 5.04 36.39 33.91"></polyline><line class="cls-1" x1="0.25" y1="66.92" x2="13.83" y2="66.92"></line></g></g></svg>`;

		const button = this.createRunButton("Generate Text", generateSVG);
		button.addEventListener("click", async () => {
			await this.textGenerator.generatePrompt(
				markdown,
				false,
				this.getActiveView().editor
			);
			logger(`addTGMenu Generate Text`, {
				markdown: markdown,
				source: source,
			});
		});

		const createTemplateSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
		const buttonMakeTemplate = this.createRunButton(
			"Create a new Template",
			createTemplateSVG
		);
		buttonMakeTemplate.addEventListener("click", async () => {
			await this.textGenerator.createTemplate(source, "newTemplate");
			logger(`addTGMenu MakeTemplate`, {
				markdown: markdown,
				source: source,
			});
		});

		div.appendChild(buttonMakeTemplate);
		div.appendChild(button);
		el.parentElement.appendChild(div);
	}
}

import { TemplateModelUI } from "./ui/template-model-ui";
import { App, Notice, Editor, RequestUrlParam } from "obsidian";
import { TextGeneratorSettings } from "./types";
import TextGeneratorPlugin from "./main";
import ReqFormatter from "./api-request-formatter";
import { SetPath } from "./ui/settings/set-path";
import ContextManager from "./context-manager";
import { makeid, createFileWithInput, openFile, removeYMAL } from "./utils";
import safeAwait from "safe-await";
import debug from "debug";
const logger = debug("textgenerator:TextGenerator");

export default class TextGenerator {
	plugin: TextGeneratorPlugin;
	app: App;
	reqFormatter: ReqFormatter;
	contextManager: ContextManager;
	signal: AbortSignal;

	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;

		this.contextManager = new ContextManager(app, plugin);
		this.reqFormatter = new ReqFormatter(app, plugin, this.contextManager);
	}

	async generate(
		context: any,
		insertMetadata = false,
		params: any = this.plugin.settings,
		templatePath = "",
		additionnalParams: any = {
			showSpinner: true,
		}
	) {
		const { options, template } = context;

		const prompt = template ? template(options) : context.context;

		logger("generate", {
			prompt,
			insertMetadata,
			params,
			templatePath,
			additionnalParams,
		});

		if (this.plugin.processing) {
			logger("generate error", "There is another generation process");
			return Promise.reject(
				new Error("There is another generation process")
			);
		}
		this.plugin.startProcessing(additionnalParams?.showSpinner);
		let reqParameters: any = this.reqFormatter.addContext(params, prompt);
		reqParameters = this.reqFormatter.prepareReqParameters(
			reqParameters,
			insertMetadata,
			templatePath,
			additionnalParams
		);
		try {
			let result = await this.getGeneratedText(reqParameters);
			// Remove leading/trailing newlines
			if (String.isString(result)) {
				result.replace(/^\n*/g, "\n");
			}
			logger("generate end", {
				result,
			});
			return result;
		} catch (error) {
			logger("generate error", error);
			return Promise.reject(error);
		} finally {
			this.plugin.endProcessing(additionnalParams?.showSpinner);
		}
	}

	getCursor(editor: Editor) {
		logger("getCursor");
		let cursor = editor.getCursor();
		let selectedText = editor.getSelection();
		if (selectedText.length === 0) {
			const lineNumber = editor.getCursor().line;
			selectedText = editor.getLine(lineNumber);
			if (selectedText.length !== 0) {
				cursor.ch = selectedText.length;
				if (selectedText[selectedText.length - 1] === " ") {
					cursor.ch = selectedText.length - 1;
				}
			}
		}
		logger("getCursor end");
		return cursor;
	}

	async generateFromTemplate(
		params: TextGeneratorSettings,
		templatePath: string,
		insertMetadata: boolean = false,
		editor: Editor,
		activeFile: boolean = true
	) {
		logger("generateFromTemplate");
		const cursor = this.getCursor(editor);

		const [errorContext, context] = await safeAwait(
			this.contextManager.getContext(editor, insertMetadata, templatePath)
		);
		const [errorGeneration, text] = await safeAwait(
			this.generate(context, insertMetadata, params, templatePath)
		);

		if (errorContext) {
			return Promise.reject(errorContext);
		}

		if (errorGeneration) {
			return Promise.reject(errorGeneration);
		}

		if (activeFile === false) {
			const title = this.app.workspace.activeLeaf.getDisplayText();
			let suggestedPath =
				"textgenerator/generations/" + title + "-" + makeid(3) + ".md";

			new SetPath(this.app, suggestedPath, async (path: string) => {
				const [errorFile, file] = await safeAwait(
					createFileWithInput(path, context.context + text, this.app)
				);
				if (errorFile) {
					return Promise.reject(errorFile);
				}

				openFile(this.app, file);
			}).open();
		} else {
			this.insertGeneratedText(text, editor, cursor);
		}
		logger("generateFromTemplate end");
	}

	async generateInEditor(
		params: TextGeneratorSettings,
		insertMetadata: boolean = false,
		editor: Editor
	) {
		logger("generateInEditor");
		const cursor = this.getCursor(editor);
		const [errorGeneration, text] = await safeAwait(
			this.generate(
				await this.contextManager.getContext(editor, insertMetadata),
				insertMetadata,
				params
			)
		);

		if (errorGeneration) {
			return Promise.reject(errorGeneration);
		}

		this.insertGeneratedText(text, editor, cursor);
		logger("generateInEditor end");
	}

	async generateToClipboard(
		params: TextGeneratorSettings,
		templatePath: string,
		insertMetadata: boolean = false,
		editor: Editor
	) {
		logger("generateToClipboard");
		const [errorContext, context] = await safeAwait(
			this.contextManager.getContext(editor, insertMetadata, templatePath)
		);
		const [errorGeneration, text] = await safeAwait(
			this.generate(context, insertMetadata, params, templatePath)
		);

		if (errorContext) {
			return Promise.reject(errorContext);
		}

		if (errorGeneration) {
			return Promise.reject(errorGeneration);
		}
		const data = new ClipboardItem({
			"text/plain": new Blob([text], {
				type: "text/plain",
			}),
		});
		await navigator.clipboard.write([data]);
		new Notice("Generated Text copied to clipboard");
		editor.setCursor(editor.getCursor());
		logger("generateToClipboard end");
	}

	async generatePrompt(
		promptText: string,
		insertMetadata: boolean = false,
		editor: Editor
	) {
		logger("generatePrompt");
		const cursor = this.getCursor(editor);
		const [errorGeneration, text] = await safeAwait(
			this.generate(promptText, insertMetadata)
		);

		if (errorGeneration) {
			return Promise.reject(errorGeneration);
		}
		this.insertGeneratedText(text, editor, cursor);
		logger("generatePrompt end");
	}

	async createToFile(
		params: TextGeneratorSettings,
		templatePath: string,
		insertMetadata: boolean = false,
		editor: Editor,
		activeFile: boolean = true
	) {
		logger("createToFile");
		const [errorContext, context] = await safeAwait(
			this.contextManager.getContext(editor, insertMetadata, templatePath)
		);

		if (errorContext) {
			return Promise.reject(errorContext);
		}
		const contextAsString = context.context;
		if (activeFile === false) {
			const title = this.app.workspace.activeLeaf.getDisplayText();
			let suggestedPath =
				"textgenerator/generations/" + title + "-" + makeid(3) + ".md";

			new SetPath(this.app, suggestedPath, async (path: string) => {
				const [errorFile, file] = await safeAwait(
					createFileWithInput(path, contextAsString, this.app)
				);

				if (errorFile) {
					logger("createToFile error", errorFile);
					return Promise.reject(errorFile);
				}

				openFile(this.app, file);
			}).open();
		} else {
			this.insertGeneratedText(contextAsString, editor);
		}
		logger("createToFile end");
	}

	async createTemplateFromEditor(editor: Editor) {
		logger("createTemplateFromEditor");
		const title = this.app.workspace.activeLeaf.getDisplayText();
		const content = editor.getValue();
		await this.createTemplate(content, title);
		logger("createTemplateFromEditor end");
	}

	async createTemplate(content: string, title: string = "") {
		logger("createTemplate");
		const promptInfo = `PromptInfo:
 promptId: ${title}
 name: 🗞️${title} 
 description: ${title}
 required_values: 
 author: 
 tags: 
 version: 0.0.1`;

		let templateContent = content;
		const metadata = this.contextManager.getMetaData();
		// We have three cases: no Front-matter / Frontmatter without PromptInfo/ Frontmatter with PromptInfo
		if (!metadata.hasOwnProperty("frontmatter")) {
			templateContent = `---\n${promptInfo}\n---\n${templateContent}`;
		} else if (!metadata["frontmatter"].hasOwnProperty("PromptInfo")) {
			if (templateContent.indexOf("---") !== -1) {
				templateContent = templateContent.replace(
					"---",
					`---\n${promptInfo}`
				);
			} else {
				templateContent = `---\n${promptInfo}\n---\n${templateContent}`;
			}
		}
		const suggestedPath = `${this.plugin.settings.promptsPath}/local/${title}.md`;
		new SetPath(this.app, suggestedPath, async (path: string) => {
			const [errorFile, file] = await safeAwait(
				createFileWithInput(path, templateContent, this.app)
			);
			if (errorFile) {
				logger("createTemplate error", errorFile);
				return Promise.reject(errorFile);
			}
			openFile(this.app, file);
		}).open();
		logger("createTemplate end");
	}

	async getGeneratedText(reqParams: any) {
		logger("getGeneratedText");
		const extractResult = reqParams?.extractResult;
		delete reqParams?.extractResult;
		let [errorRequest, requestResults] = await safeAwait(
			this.request(reqParams)
		);

		if (errorRequest) {
			logger("getGeneratedText error", requestResults, errorRequest);
			return Promise.reject(errorRequest);
		}
		const text = eval(extractResult);
		logger("getGeneratedText  end", {
			requestResults,
			extractResult,
			text,
		});
		return text;
	}

	async request(params: RequestUrlParam) {
		return new Promise((resolve, reject) => {
			const controller = new AbortController();
			this.signal = controller.signal;
			const timeoutId = setTimeout(() => {
				controller.abort();
				reject(new Error("Timeout Reached"));
			}, this.plugin.settings.timeout);
			const raw = params.body;
			const requestOptions = {
				method: params.method,
				headers: params.headers,
				body: raw,
				redirect: "follow",
				signal: this.signal,
			};

			logger({ params, requestOptions });
			fetch(params.url, requestOptions)
				.then((response) => response.json())
				.then((result) => {
					clearTimeout(timeoutId);
					if (result.error) {
						reject(result.error);
					} else {
						resolve(result);
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	outputToBlockQuote(text: string) {
		let lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line !== "" && line !== ">");
		lines = lines
			.map((line, index) => {
				if (line.includes("[!ai]+ AI")) {
					return ">";
				}

				return line.startsWith(">") ? line : "> " + line;
			})
			.filter((line) => line !== "");

		return "\n> [!ai]+ AI\n>\n" + lines.join("\n").trim() + "\n\n";
	}

	insertGeneratedText(text: string, editor: Editor, cur = null) {
		const logger = (message) => console.log(message);
		logger("insertGeneratedText");

		let cursor = this.getCursor(editor);
		if (cur) {
			cursor = cur;
		}

		if (editor.listSelections().length > 0) {
			const anchor = editor.listSelections()[0].anchor;
			const head = editor.listSelections()[0].head;
			if (
				anchor.line > head.line ||
				(anchor.line === head.line && anchor.ch > head.ch)
			) {
				cursor = editor.listSelections()[0].anchor;
			}
		}

		if (this.plugin.settings.outputToBlockQuote) {
			text = this.outputToBlockQuote(text);
		}

		editor.replaceRange(text, cursor);
		editor.setCursor(editor.getCursor());
		logger("insertGeneratedText end");
	}

	async tempalteToModel(
		params: any = this.plugin.settings,
		templatePath = "",
		editor: Editor,
		activeFile = true
	) {
		logger("tempalteToModel");
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
		let [errortemplateContent, templateContent] = await safeAwait(
			this.app.vault.read(templateFile)
		);
		if (errortemplateContent) {
			return Promise.reject(errortemplateContent);
		}

		templateContent = removeYMAL(templateContent);

		// console.log(templateContent);
		const variables =
			templateContent
				.match(/\{\{(.*?)\}\}/gi)
				?.map((e) => e.replace("{{", "").replace("}}", "")) || [];
		// console.log(variables);
		const metadata = this.getMetadata(templatePath);
		new TemplateModelUI(
			this.app,
			this.plugin,
			variables,
			metadata,
			async (results: any) => {
				const cursor = this.getCursor(editor);

				const [errorContext, context] = await safeAwait(
					this.contextManager.getContext(
						editor,
						true,
						templatePath,
						results
					)
				);
				if (errorContext) {
					logger("tempalteToModel error", errorContext);
					return Promise.reject(errorContext);
				}
				const contextAsString = context.context;
				const [errortext, text] = await safeAwait(
					this.generate(contextAsString, true, params, templatePath)
				);
				if (errortext) {
					logger("tempalteToModel error", errortext);
					return Promise.reject(errortext);
				}

				if (activeFile === false) {
					const title =
						this.app.workspace.activeLeaf.getDisplayText();
					let suggestedPath =
						"textgenerator/generations/" +
						title +
						"-" +
						makeid(3) +
						".md";
					new SetPath(
						this.app,
						suggestedPath,
						async (path: string) => {
							const [errorFile, file] = await safeAwait(
								createFileWithInput(
									path,
									contextAsString + text,
									this.app
								)
							);
							if (errorFile) {
								logger("tempalteToModel error", errorFile);
								return Promise.reject(errorFile);
							}

							openFile(this.app, file);
						}
					).open();
				} else {
					this.insertGeneratedText(text, editor, cursor);
				}
			}
		).open();
		logger("tempalteToModel end");
	}

	getMetadata(path: string) {
		logger("getMetadata");
		const metadata = this.getFrontmatter(path);
		const validedMetaData: any = {};

		if (metadata?.PromptInfo?.promptId) {
			validedMetaData["id"] = metadata.PromptInfo.promptId;
		}

		if (metadata?.PromptInfo?.name) {
			validedMetaData["name"] = metadata.PromptInfo.name;
		}

		if (metadata?.PromptInfo?.description) {
			validedMetaData["description"] = metadata.PromptInfo.description;
		}

		if (metadata?.PromptInfo?.required_values) {
			validedMetaData["required_values"] =
				metadata.PromptInfo.required_values;
		}

		if (metadata?.PromptInfo?.author) {
			validedMetaData["author"] = metadata.PromptInfo.author;
		}

		if (metadata?.PromptInfo?.tags) {
			validedMetaData["tags"] = metadata.PromptInfo.tags;
		}

		if (metadata?.PromptInfo?.version) {
			validedMetaData["version"] = metadata.PromptInfo.version;
		}

		if (metadata?.PromptInfo?.commands) {
			validedMetaData["commands"] = metadata.PromptInfo.commands;
		}

		logger("getMetadata end");
		return validedMetaData;
	}

	getFrontmatter(path: string = "") {
		logger("getFrontmatter");
		const cache = this.app.metadataCache.getCache(path);
		if (cache.hasOwnProperty("frontmatter")) {
			logger("getFrontmatter end");
			return cache.frontmatter;
		}
		logger("getFrontmatter end");
		return null;
	}
}

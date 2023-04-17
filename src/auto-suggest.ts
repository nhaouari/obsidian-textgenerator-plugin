import TextGeneratorPlugin from "src/main";
import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	MarkdownView,
	TFile,
} from "obsidian";

import debug from "debug";
const logger = debug("textgenerator:AutoSuggest");

function debounce<T extends unknown[], R>(
	func: (...args: T) => Promise<R>,
	wait: number
): (...args: T) => Promise<R> {
	let timeout: NodeJS.Timeout | null;

	logger("debounce", func, wait);
	return function debouncedFunction(...args: T): Promise<R> {
		const context = this;

		return new Promise((resolve, reject) => {
			if (timeout !== null) {
				clearTimeout(timeout);
			}

			timeout = setTimeout(() => {
				logger("debouncedFunction", args);
				func.apply(context, args)
					.then((result) => resolve(result))
					.catch((error) => reject(error));
			}, wait);
		});
	};
}

interface Completition {
	label: string;
	value: string;
}

export class AutoSuggest extends EditorSuggest<Completition> {
	plugin: TextGeneratorPlugin;
	process: boolean = true;
	delay: number = 0;
	getSuggestionsDebounced: any;
	constructor(private app: App, plugin: TextGeneratorPlugin) {
		logger("AutoSuggest", app, plugin);
		super(app);
		this.plugin = plugin;
		this.scope.register(
			[],
			"Tab",
			this.scope.keys.find((k) => k.key === "ArrowDown").func
		);
		this.scope.register(
			["Shift"],
			"Tab",
			this.scope.keys.find((k) => k.key === "ArrowUp").func
		);
	}

	public updateSettings() {
		logger("updateSettings");
		if (
			this.delay !== this.plugin.settings.autoSuggestOptions.delay ||
			this.getSuggestionsDebounced === undefined
		) {
			this.delay = this.plugin.settings.autoSuggestOptions.delay;
			this.getSuggestionsDebounced = debounce(
				async (
					context: EditorSuggestContext
				): Promise<Completition[]> => {
					logger("updateSettings", { delay: this.delay, context });
					try {
						if (this.process) {
							const suggestions = await this.getGPTSuggestions(
								context
							);
							return suggestions?.length
								? suggestions
								: [
										{
											label: context.query,
											value: context.query,
										},
								  ];
						} else {
							return [
								{ label: context.query, value: context.query },
							];
						}
					} catch (error) {
						throw error;
					}
				},
				this.delay
			);
		}
	}

	public onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile
	): EditorSuggestTriggerInfo {
		logger("onTrigger", cursor, editor, file);
		if (
			!this.plugin.settings?.autoSuggestOptions?.isEnabled ||
			this.isOpen
		) {
			this.process = false;
			return;
		}

		const line = editor.getLine(cursor.line).substring(0, cursor.ch);
		const triggerPhrase =
			this.plugin.settings.autoSuggestOptions.triggerPhrase;

		if (!line.endsWith(triggerPhrase)) {
			this.process = false;
			return;
		}
		this.process = true;

		const selection =
			this.plugin.textGenerator.contextManager.getSelection(editor);
		const lastOccurrenceIndex = selection.lastIndexOf(triggerPhrase);
		const currentPart =
			selection.substr(0, lastOccurrenceIndex) +
			selection.substr(lastOccurrenceIndex).replace(triggerPhrase, "");

		const currentStart = line.lastIndexOf(triggerPhrase);

		const result = {
			start: {
				ch: currentStart,
				line: cursor.line,
			},
			end: cursor,
			query: currentPart,
		};
		logger("onTrigger", result);
		return result;
	}

	public getSuggestions(
		context: EditorSuggestContext
	): Promise<Completition[]> {
		logger("getSuggestions", context);
		this.updateSettings();
		return new Promise((resolve, reject) => {
			this.getSuggestionsDebounced(context)
				.then((suggestions) => {
					logger("getSuggestions", suggestions);
					resolve(suggestions);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	public renderSuggestion(value: Completition, el: HTMLElement): void {
		//logger("renderSuggestion",value,el);
		el.setAttribute("dir", "auto");
		el.setText(value.label);
	}

	public checkLastSubstring(str: string, substring: string): boolean {
		const size = substring.length;
		const lastSubstring = str.slice(-size);
		return lastSubstring === substring;
	}

	public selectSuggestion(
		value: Completition,
		evt: MouseEvent | KeyboardEvent
	): void {
		logger("selectSuggestion", value, evt);
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const currentCursorPos = activeView.editor.getCursor();
		let replacementValue = value.value;
		const prevChar = activeView.editor.getRange(
			{ line: this.context.start.line, ch: this.context.start.ch - 1 },
			this.context.start
		);

		if (
			prevChar &&
			prevChar.trim() !== "" &&
			replacementValue.charAt(0) !== " "
		) {
			replacementValue = " " + replacementValue;
		}

		const newCursorPos = {
			ch: this.context.start.ch + replacementValue.length,
			line: currentCursorPos.line,
		};
		if (!activeView) {
			return;
		}

		activeView.editor.replaceRange(
			replacementValue,
			{
				ch: this.context.start.ch,
				line: this.context.start.line,
			},
			this.context.end
		);

		activeView.editor.setCursor(newCursorPos);
	}

	private async getGPTSuggestions(
		context: EditorSuggestContext
	): Promise<Completition[]> {
		logger("getGPTSuggestions", context);
		const result: string[] = [];
		try {
			const prompt = `continue the follwing text :
            ${context.query}
            `;

			const additionalParams = {
				showSpinner: false,
				bodyParams: {
					n: parseInt(
						this.plugin.settings.autoSuggestOptions
							.numberOfSuggestions
					),
					stop: this.plugin.settings.autoSuggestOptions.stop,
				},
				reqParams: {
					extractResult: "requestResults?.choices",
				},
			};

			const re = await this.plugin.textGenerator.generate(
				{ context: prompt },
				false,
				this.plugin.settings,
				"",
				additionalParams
			);
			let suggestions = [];
			if (
				this.plugin.settings.engine === "gpt-3.5-turbo" ||
				this.plugin.settings.engine === "gpt-3.5-turbo-0301"
			) {
				suggestions = re.map((r) => r.message.content);
			} else {
				suggestions = re.map((r) => r.text);
			}
			suggestions = [...new Set(suggestions)];
			return suggestions.map((r) => {
				let label = r.trim();
				if (
					!this.checkLastSubstring(
						label,
						this.plugin.settings.autoSuggestOptions.stop
					)
				) {
					label += this.plugin.settings.autoSuggestOptions.stop;
				}

				const suggestionsObj = {
					label: label,
					value: label
						.toLowerCase()
						.startsWith(context.query.toLowerCase())
						? label.substring(context.query.length).trim()
						: label.trim(),
				};
				logger("getGPTSuggestions", suggestionsObj);
				return suggestionsObj;
			});
		} catch (error) {
			logger("getGPTSuggestions error", error);
			this.plugin.handelError(error);
		}
	}
}

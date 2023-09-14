// import { TemplateModalUI } from "../ui/template-modal-ui";
// import { App, Notice, Editor, RequestUrlParam, EditorPosition } from "obsidian";
import TextGeneratorPlugin from "../main";
import ReqFormatter from "../api-request-formatter";
import ContextManager, { InputContext } from "../context-manager";
import debug from "debug";
import LLMProviderInterface from "src/LLMProviders/interface";
import { LLMProviderRegistery } from "src/LLMProviders";

const logger = debug("textgenerator:TextGenerator");

export default class RequestHandler {
	plugin: TextGeneratorPlugin;
	reqFormatter: ReqFormatter;
	contextManager: ContextManager;
	signalController?: AbortController;

	LLMProvider: LLMProviderInterface;

	constructor(plugin: TextGeneratorPlugin) {
		this.plugin = plugin;
		this.contextManager = new ContextManager(app, plugin);
		this.reqFormatter = new ReqFormatter(app, plugin, this.contextManager);

		this.setup();
	}

	setup() {
		const llmList = LLMProviderRegistery.getList();

		const llm =
			LLMProviderRegistery.get(
				this.plugin.settings.selectedProvider || ""
			) || LLMProviderRegistery.get(llmList[0]);

		if (llm)
			// @ts-ignore
			this.LLMProvider = new llm({
				plugin: this.plugin,
			});
	}

	async gen(
		prompt: string,
		settings: Partial<typeof this.plugin.settings> = {}
	) {
		logger("gen ", {
			prompt,
			pluginSettings: this.plugin.settings,
			settings,
		});

		const params = { ...this.plugin.settings, ...settings };

		if (prompt) params["prompt"] = prompt;

		const { reqParams, bodyParams } =
			this.reqFormatter.getRequestParameters(params, false, "");

		try {
			const result = await this.LLMProvider.generate(
				bodyParams["messages"],
				{
					requestParams: {
						signal: this.signalController?.signal,
						...reqParams,
					},
					...params,
					stream: false,
					llmPredict: bodyParams["messages"]?.length == 1,
					otherOptions: this.plugin.settings.LLMProviderOptions,
				}
			);

			logger("gen results", {
				result,
			});

			return result;
		} catch (error) {
			logger("gen  error", error);
			return Promise.reject(error);
		}
	}

	async streamGenerate(
		context: InputContext,
		insertMetadata = false,
		params: any = this.plugin.settings,
		templatePath = "",
		additionnalParams: any = {
			showSpinner: true,
		}
	) {
		try {
			logger("generate", {
				context,
				insertMetadata,
				params,
				templatePath,
				additionnalParams,
			});

			if (!this.LLMProvider.streamable) {
				throw "LLM not streamable";
			}

			const { options, template } = context;
			const prompt = template
				? template.inputTemplate(options)
				: context.context;

			if (this.plugin.processing) {
				logger(
					"streamGenerate error",
					"There is another generation process"
				);
				return Promise.reject(
					new Error("There is another generation process")
				);
			}

			// order of config
			const config = {
				...this.plugin.settings,
				...this.plugin.settings.LLMProviderOptions[this.LLMProvider.id],
				...params,
			};

			if (prompt) config["prompt"] = prompt;

			this.startLoading(additionnalParams.showSpinner);

			const { reqParams, bodyParams } =
				this.reqFormatter.getRequestParameters(
					config,
					insertMetadata,
					templatePath,
					additionnalParams
				);

			//const stream = await this.streamRequest(reqParams);
			const stream = async (
				onToken: Parameters<typeof this.LLMProvider.generate>[2]
			) => {
				try {
					const k = await this.LLMProvider.generate(
						bodyParams["messages"],
						{
							...config,
							...bodyParams,
							requestParams: {
								...reqParams,
								signal: this.signalController?.signal,
							},
							otherOptions:
								this.plugin.settings.LLMProviderOptions[
									this.LLMProvider.id
								],
							streaming: true,
							llmPredict: bodyParams["messages"]?.length == 1,
						} as any,
						onToken
					);

					// output template, template used AFTER the generation happens
					return (
						template?.outputTemplate?.({ ...options, output: k }) ||
						k
					);
				} finally {
					this.endLoading(additionnalParams?.showSpinner);
				}
			};

			logger("streamGenerate end", {
				stream,
			});

			return stream;
		} catch (error) {
			this.endLoading(additionnalParams.showSpinner);
			logger("streamGenerate error", error);
			return Promise.reject(error);
		}
	}

	async generate(
		context: InputContext,
		insertMetadata = false,
		params: Partial<typeof this.plugin.settings> = this.plugin.settings,
		templatePath = "",
		additionnalParams = {
			showSpinner: true,
		}
	) {
		try {
			logger("generate", {
				context,
				insertMetadata,
				params,
				templatePath,
				additionnalParams,
			});

			const { options, template } = context;

			const prompt =
				typeof template != "undefined"
					? template.inputTemplate(options)
					: context.context;

			if (this.plugin.processing) {
				logger("generate error", "There is another generation process");
				return Promise.reject(
					new Error("There is another generation process")
				);
			}

			this.startLoading(additionnalParams?.showSpinner);

			// order of config
			const config = {
				...this.plugin.settings,
				...this.plugin.settings.LLMProviderOptions[this.LLMProvider.id],
				...params,
			};

			if (prompt) config["prompt"] = prompt;

			const { reqParams, bodyParams } =
				this.reqFormatter.getRequestParameters(
					config,
					insertMetadata,
					templatePath,
					additionnalParams
				);

			let result = await this.LLMProvider.generate(
				bodyParams["messages"],
				{
					...config,
					...bodyParams,
					requestParams: {
						...reqParams,
						signal: this.signalController?.signal,
					},
					otherOptions:
						this.plugin.settings.LLMProviderOptions[
							this.LLMProvider.id
						],
					stream: false,
					llmPredict: bodyParams["messages"]?.length == 1,
				}
			);

			// Remove leading/trailing newlines
			result = result.trim();

			// output template, template used AFTER the generation happens
			result =
				template?.outputTemplate?.({ ...options, output: result }) ||
				result;

			logger("generate end", {
				result,
			});

			return result;
		} catch (error) {
			logger("generate error", error);
			return Promise.reject(error);
		} finally {
			this.endLoading(additionnalParams?.showSpinner);
		}
	}

	protected startLoading(showSpinner?: boolean) {
		this.signalController = new AbortController();
		this.plugin.startProcessing(showSpinner);
	}

	endLoading(showSpinner?: boolean) {
		this.signalController?.abort();
		this.signalController = undefined;
		this.plugin.endProcessing(showSpinner);
	}
}

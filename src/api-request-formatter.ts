import { App, Notice } from "obsidian";
import { TextGeneratorSettings } from "./types";
import TextGeneratorPlugin from "./main";
import ContextManager from "./context-manager";
import debug from "debug";
import { transformStringsToChatFormat } from "./utils";
const logger = debug("textgenerator:ReqFormatter");
export default class ReqFormatter {
	plugin: TextGeneratorPlugin;
	app: App;
	contextManager: ContextManager;
	constructor(
		app: App,
		plugin: TextGeneratorPlugin,
		contextManager: ContextManager
	) {
		this.app = app;
		this.plugin = plugin;
		this.contextManager = contextManager;
	}

	getRequestParameters(
		params: TextGeneratorSettings,
		insertMetadata: boolean,
		templatePath = "",
		additionnalParams: any = {}
	) {
		logger("prepareReqParameters", params, insertMetadata, templatePath);

		let bodyParams: any = {
			model: params.engine,
			max_tokens: params.max_tokens,
			temperature: params.temperature,
			frequency_penalty: params.frequency_penalty,
		};

		let reqUrl = new URL(`/v1/completions`, params.endpoint).href;
		let reqExtractResult = "requestResults?.choices[0].text";

		const chatModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-0301", "gpt-4"];
		if (params.engine && chatModels.includes(params.engine)) {
			reqUrl = new URL(`/v1/chat/completions`, params.endpoint).href;
			reqExtractResult = "requestResults?.choices[0].message.content";
			bodyParams["messages"] = [{ role: "user", content: params.prompt }];
		} else {
			bodyParams["prompt"] = params.prompt;
		}

		bodyParams = { ...bodyParams, ...additionnalParams?.bodyParams };

		let reqParams = {
			url: reqUrl,
			method: "POST",
			body: "",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${params.api_key}`,
			},
			extractResult: reqExtractResult,
		};

		reqParams = { ...reqParams, ...additionnalParams?.reqParams };

		if (insertMetadata) {
			const activefileFrontmatter =
				this.contextManager.getMetaData()?.frontmatter;
			const templateFrontmatter =
				this.contextManager.getMetaData(templatePath)?.frontmatter;
			const frontmatter = {
				...templateFrontmatter,
				...activefileFrontmatter,
			};
			//console.log({templateFrontmatter,activefileFrontmatter,frontmatter});
			if (frontmatter == null) {
				new Notice("No valid Metadata (YAML front matter) found!");
			} else {
				if (bodyParams["messages"]) {
					//chat mode
					let messages = [];
					if (frontmatter["config"]?.system) {
						messages = [
							{
								role: "system",
								content: frontmatter["config"].system,
							},
						];
					}

					if (frontmatter["config"]?.messages) {
						messages.push(
							...transformStringsToChatFormat(
								frontmatter["config"].messages
							)
						);
					}

					bodyParams["messages"] = [
						...messages,
						...bodyParams["messages"],
					];
				}

				if (
					frontmatter["bodyParams"] &&
					frontmatter["config"]?.append?.bodyParams == false
				) {
					bodyParams = {
						prompt: params.prompt,
						...frontmatter["bodyParams"],
					};
				} else if (frontmatter["bodyParams"]) {
					bodyParams = {
						...bodyParams,
						...frontmatter["bodyParams"],
					};
				}

				if (
					frontmatter["config"]?.context &&
					frontmatter["config"]?.context !== "prompt"
				) {
					bodyParams[frontmatter["config"].context] = params.prompt;
					delete bodyParams.prompt;
				}

				reqParams.body = JSON.stringify(bodyParams);

				if (frontmatter["config"]?.output) {
					reqParams.extractResult = frontmatter["config"]?.output;
				}

				if (
					frontmatter["reqParams"] &&
					frontmatter["config"]?.append?.reqParams == false
				) {
					reqParams = frontmatter["reqParams"];
				} else if (frontmatter["reqParams"]) {
					reqParams = { ...reqParams, ...frontmatter["reqParams"] };
				}
			}
		} else {
			reqParams.body = JSON.stringify(bodyParams);
		}

		logger("prepareReqParameters", { bodyParams, reqParams });
		return { bodyParams, reqParams };
	}
}

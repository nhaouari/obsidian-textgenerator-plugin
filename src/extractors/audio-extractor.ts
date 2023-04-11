import { App, TAbstractFile, requestUrl, RequestUrlParam } from "obsidian";
import { Extractor } from "./content-extractor";
import TextGeneratorPlugin from "src/main";
import debug from "debug";
const logger = debug("textgenerator:Extractor:AudioExtractor");

export default class AudioExtractor implements Extractor<TAbstractFile> {
	private app: App;
	private plugin: TextGeneratorPlugin;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	async convert(doc: TAbstractFile): Promise<string> {
		logger("convert", { doc });
		const audioBuffer = await this.app.vault.adapter.readBinary(doc.path);
		const transcript = await this.generateTranscript(
			audioBuffer,
			doc.extension
		);
		logger("convert end", { transcript });
		return transcript;
	}

	async extract(filePath: string): Promise<TAbstractFile[]> {
		const supportedAudioExtensions = [
			"mp3",
			"mp4",
			"mpeg",
			"mpga",
			"m4a",
			"wav",
			"webm",
		];
		const embeds = this.app.metadataCache
			.getCache(filePath)
			?.embeds.filter((embed) =>
				supportedAudioExtensions.some((ext) =>
					embed.link.endsWith(`.${ext}`)
				)
			);
		if (!embeds) {
			return [];
		}
		return embeds.map(
			(embed) =>
				this.app.metadataCache.getFirstLinkpathDest(
					embed.link,
					filePath
				) as TAbstractFile
		);
	}

	async generateTranscript(audioBuffer: ArrayBuffer, filetype: string) {
		if (this.plugin.settings.api_key.length < 1)
			this.plugin.handelError(
				new Error("OpenAI API Key is not provided.")
			);
		const formData = this.createFormData(audioBuffer, filetype);
		this.plugin.startProcessing(false);
		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.plugin.settings.api_key}`,
				},
				body: formData,
			}
		).catch((error) => {
			this.plugin.endProcessing(false);
			this.plugin.handelError(error);
		});

		const jsonResponse = await response.json();
		this.plugin.endProcessing(false);
		if ("text" in jsonResponse) return jsonResponse.text;
		else
			this.plugin.handelError(
				new Error("Error. " + JSON.stringify(jsonResponse))
			);
	}

	createFormData(audioBuffer, filetype) {
		const formData = new FormData();
		const blob = new Blob([audioBuffer], { type: `audio/${filetype}` });
		formData.append("file", blob, `audio.${filetype}`);
		formData.append("model", "whisper-1");

		return formData;
	}
}

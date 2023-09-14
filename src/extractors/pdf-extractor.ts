import { loadPdfJs, App, TAbstractFile } from "obsidian";
import { Extractor } from "./extractor";
import TextGeneratorPlugin from "src/main";
import debug from "debug";
const logger = debug("textgenerator:Extractor:PdfExtractor");

export default class PDFExtractor extends Extractor<TAbstractFile> {
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app, plugin);
	}
	async convert(doc: TAbstractFile) {
		logger("convert", { doc });
		const pdfBuffer = await this.app.vault.adapter.readBinary(doc.path);
		const pdfjs = await loadPdfJs();
		const pdf = await pdfjs.getDocument(pdfBuffer).promise;

		const contents = await Promise.all(
			Array.from({ length: pdf.numPages }, (_, i) =>
				pdf.getPage(i + 1).then((page: any) => page.getTextContent())
			)
		);

		const pageContents = contents.map(
			(content, i) =>
				`Page ${i + 1}: ` +
				content.items
					.map((item: any) => item.str)
					.join(" ")
					.replace(/\s+/g, " ")
		);

		const text = pageContents.join("\n");
		logger("convert end", { text });
		return text;
	}

	async extract(filePath: string) {
		const embeds = this.app.metadataCache
			.getCache(filePath)
			?.embeds?.filter((embed) => embed.link.endsWith(".pdf"));

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
}

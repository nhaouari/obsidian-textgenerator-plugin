import { loadPdfJs, App, TAbstractFile } from "obsidian";
import { Extractor } from "./content-extractor";
import debug from "debug";
const logger = debug("textgenerator:Extractor:PdfExtractor");

export default class PDFExtractor implements Extractor<TAbstractFile> {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
	async convert(doc: TAbstractFile): Promise<string> {
		logger("convert", { doc });
		const pdfBuffer = await this.app.vault.adapter.readBinary(doc.path);
		const pdfjs = await loadPdfJs();
		const pdf = await pdfjs.getDocument(pdfBuffer).promise;
		const contentPromises = Array.from({ length: pdf.numPages }, (_, i) =>
			pdf.getPage(i + 1).then((page) => page.getTextContent())
		);
		const contents = await Promise.all(contentPromises);
		const pageContents = contents.map(
			(content, i) =>
				`Page ${i + 1}: ` +
				content.items
					.map((item) => item.str)
					.join(" ")
					.replace(/\s+/g, " ")
		);
		const text = pageContents.join("\n");
		logger("convert end", { text });
		return text;
	}

	async extract(filePath: string): Promise<TAbstractFile[]> {
		const embeds = this.app.metadataCache
			.getCache(filePath)
			?.embeds.filter((embed) => embed.link.endsWith(".pdf"));

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

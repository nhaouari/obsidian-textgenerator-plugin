import { ContentExtractor } from "./content-extractor";
import TextGeneratorPlugin from "#/main";

export default async function read(path: string, plugin: TextGeneratorPlugin, otherOptions?: any) {
    if (!app.vault.adapter.exists(path)) throw "file doesn't exist";

    const extension = path.split(".").reverse()[0].toLowerCase();

    const extractor = new ContentExtractor(plugin.app, plugin);

    switch (extension) {
        // pdf
        case "pdf":
            extractor.setExtractor("PDFExtractor")
            break;

        // image
        case "png":
            extractor.setExtractor("ImageExtractor")
            break;
        case "jpeg":
            extractor.setExtractor("ImageExtractor")
            break;

        // audio
        case "mp3":
            extractor.setExtractor("AudioExtractor")
            break;
        case "webm":
            extractor.setExtractor("AudioExtractor")
            break;

        default:
            const p = self.app.vault.getAbstractFileByPath(path);
            if (!p) throw new Error("file doesn't exist");
            // @ts-ignore
            return self.app.vault.cachedRead(p);
    }

    return await extractor.convert(path, otherOptions);
}
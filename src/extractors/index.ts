import { ContentExtractor } from "./content-extractor";
import TextGeneratorPlugin from "#/main";
import { supportedAudioExtensions } from "./audio-extractor";

export default async function read(path: string, plugin: TextGeneratorPlugin, otherOptions?: any) {
    if (!app.vault.adapter.exists(path)) throw "file doesn't exist";

    const extension = path.split(".").reverse()[0].toLowerCase();

    const extractor = new ContentExtractor(plugin.app, plugin);

    if (supportedAudioExtensions.includes(extension?.toLowerCase()))
        extractor.setExtractor("AudioExtractor")

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

        default:
            const p = self.app.vault.getAbstractFileByPath(path);
            if (!p) throw new Error("file doesn't exist");
            // @ts-ignore
            return self.app.vault.cachedRead(p);
    }

    return await extractor.convert(path, otherOptions);
}
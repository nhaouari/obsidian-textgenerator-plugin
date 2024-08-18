import TextGeneratorPlugin from "../main"

export default class PluginAPIService {
    constructor(private plugin: TextGeneratorPlugin) {
        this.plugin = plugin;
    }

    /** get settings
     * 
     * @returns settings
     */
    async getSettings() {
        return this.plugin.settings;
    }

    /** generate text
     * 
     * @param prompt prompt to generate text
     * @param settings settings to generate text
     * @returns generated text
     */
    async gen(prompt: string, settings: Partial<typeof this.plugin.settings> = {}) {
        return this.plugin.textGenerator.gen(prompt, settings);
    }

    /** get metadata of a note
     * 
     * @param path path of the note
     * @returns metadata of the note
     */
    getMetadata(path: string) {
        return this.plugin.contextManager.getMetaData(path)
    }

    /** get childrens of a note
     * 
     * @param path path of the note
     * @returns childrens of the note
     */
    async getChildrensOf(path: string) {
        const meta = this.getMetadata(path);
        if (!meta) return [];
        return await this.plugin.contextManager.getChildrenContent(
            meta,
            {}
        )
    }

    /** get list of providers 
     * 
     * @returns list of providers
    */
    async getListOfProviders(): Promise<keyof typeof this.plugin.textGenerator.LLMRegestry.ProviderSlugs> {
        return Object.keys(this.plugin.textGenerator.LLMRegestry.ProviderSlugs) as any;
    }



    /** get provider's options */
    async getProvidersOptions(slug: string) {
        const reg = this.plugin.textGenerator.LLMRegestry
        return this.plugin.settings.LLMProviderOptions[reg.ProviderSlugs[slug as keyof typeof reg.ProviderSlugs] || slug]
    }

    /** selects and loads a provider */
    async selectProvider(slug: string): Promise<void> {
        const slugs = this.plugin.textGenerator.LLMRegestry.ProviderSlugs;
        const id = slugs[slug as keyof typeof slugs] || slug;
        if (!id)
            throw `provider ${slug} doesn't exist`;



        this.plugin.settings.selectedProvider = id as any;

        await this.plugin.saveSettings();
        return this.plugin.textGenerator.loadllm(id);
    }
}
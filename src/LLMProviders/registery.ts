export default class LLMProviderRegistry<T> {
	// private plugins: Map<string, T> = new Map();
	private plugins: Record<string, T> = {};
	constructor(plugins: Record<string, T> = {}) {
		// for (const provider in plugins) {
		//     if (Object.prototype.hasOwnProperty.call(plugins, provider)) {
		//         const element = plugins[provider as keyof typeof plugins];
		//         this.register(provider, element as unknown as T)
		//     }
		// }

		this.plugins = plugins;
	}

	register(name: string, plugin: T) {
		// this.plugins.set(name, plugin);
		this.plugins[name] = plugin;
	}

	getList() {
		return Object.keys(this.plugins);
	}

	get(name: string): T | undefined {
		// return this.plugins.get(name);
		return this.plugins[name];
	}
}

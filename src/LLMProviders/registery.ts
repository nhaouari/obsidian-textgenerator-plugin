export default class LLMProviderRegistry<T> {
  // private plugins: Map<string, T> = new Map();
  private plugins: Record<string, T> = {};
  private slugs: Record<string, string> = {};
  constructor(plugins: Record<string, T> = {}, slugs?: any) {
    // for (const provider in plugins) {
    //     if (Object.prototype.hasOwnProperty.call(plugins, provider)) {
    //         const element = plugins[provider as keyof typeof plugins];
    //         this.register(provider, element as unknown as T)
    //     }
    // }

    this.plugins = plugins;
    this.slugs = slugs;
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
    return this.plugins[this.slugs[name] || name];
  }
}

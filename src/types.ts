type Context = {
  includeTitle: boolean;
  includeStaredBlocks: boolean;
  includeFrontmatter: boolean;
  includeHeadings: boolean;
  includeChildren: boolean;
  includeMentions: boolean;
  includeHighlights: boolean;
  includeExtractions: boolean;
  includeClipboard: boolean;
};

export type Version = `${number}.${number}.${number}${"" | "-beta"}`;

type TextGeneratorSettings = {
  version: Version;
  endpoint: string;
  api_key: string;
  api_key_encrypted?: Buffer | string;
  encrypt_keys?: boolean;
  engine: string;
  max_tokens: number;
  temperature: number;
  frequency_penalty: number;
  prompt: string;
  promptsPath: string;
  showStatusBar: boolean;
  displayErrorInEditor: boolean;
  outputToBlockQuote: boolean;
  freeCursorOnStreaming: boolean;
  models: any;
  context: Context;
  requestTimeout: number;
  prefix: string;
  stream: boolean;
  options: Record<
    | "generate-text"
    | "generate-text-with-metadata"
    | "insert-generated-text-From-template"
    | "create-generated-text-From-template"
    | "insert-text-From-template"
    | "create-text-From-template"
    | "search-results-batch-generate-from-template"
    | "show-modal-From-template"
    | "open-template-as-tool"
    | "set_max_tokens"
    | "set-llm"
    | "packageManager"
    | "create-template"
    | "get-title"
    | "generated-text-to-clipboard-From-template"
    | "calculate-tokens"
    | "calculate-tokens-for-template"
    | "modal-suggest"
    | "text-extractor-tool"
    | "stop-stream",
    boolean
  >;
  autoSuggestOptions: {
    isEnabled: boolean;
    delay: number;
    numberOfSuggestions: number;
    triggerPhrase: string;
    stop: string;
    showStatus: boolean;
  };
  extractorsOptions: {
    PDFExtractor: boolean;
    WebPageExtractor: boolean;
    YoutubeExtractor: boolean;
    AudioExtractor: boolean;
    ImageExtractorEmbded: boolean;
    ImageExtractor: boolean;
  };

  selectedProvider?: string;
  // TODO: FUTURE IMPLEMENTATION
  // reason: it will clean code, and also help with custom llm providers later on
  LLMProviderOptions: Record<string, Record<string, any>>;
  LLMProviderOptionsKeysHashed: Record<string, Buffer | string>;
};

type TextGeneratorConfiguration = {
  packages: PackageTemplate[];
  installedPackages: InstalledPackage[];
};

type InstalledPackage = {
  packageId: string;
  version?: string;
  prompts?: PromptTemplate[];
  installedPrompts?: installedPrompts[];
};

type installedPrompts = {
  promptId: string;
  version: string;
};

type PackageTemplate = {
  packageId: string;
  name?: string;
  version?: string;
  minTextGeneratorVersion?: string;
  description?: string;
  tags?: string;
  author?: string;
  authorUrl?: string;
  repo?: string;
  published_at?: Date;
  downloads?: number;
};

type PromptTemplate = {
  promptId: string;
  name?: string;
  path?: string;
  description?: string;
  required_values?: string;
  author?: string;
  tags?: string;
  version?: string;
  context?: any;
};

type FileViewMode = "source" | "preview" | "default";
enum NewTabDirection {
  vertical = "vertical",
  horizontal = "horizontal",
}

type Model = {
  id: string;
};
export type {
  FileViewMode,
  NewTabDirection,
  TextGeneratorSettings,
  PromptTemplate,
  PackageTemplate,
  Model,
  Context,
  InstalledPackage,
  TextGeneratorConfiguration,
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

type LiteralUnion<T extends U, U = string> = T | (U & { zz_IGNORE_ME?: never });

export type Role = LiteralUnion<"assistant" | "user" | "system" | "admin">;
export type Message = {
  role: Role;
  content: string;
};

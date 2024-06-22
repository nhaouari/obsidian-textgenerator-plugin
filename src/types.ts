import { MessageContent } from "@langchain/core/messages";
import { llmSlugType, llmType } from "./LLMProviders";

type Options = Record<
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
  | "text-extractor-tool"
  | "stop-stream"
  | "custom-instruct"
  | "generate-in-right-click-menu"
  | "reload"
  | "open-playground"
  | "batch-generate-in-right-click-files-menu"
  | "tg-block-processor"
  | "disable-ribbon-icons",
  boolean
>;

type Context = {
  includeClipboard: boolean;
  customInstructEnabled: boolean;
  customInstruct: string;
  contextTemplate: string;
};

export type Version = `${number}.${number}.${number}${"" | "-beta"}`;

type TextGeneratorSettings = {
  allowJavascriptRun?: boolean;
  version: Version;
  endpoint: string;
  api_key: string;
  api_key_encrypted?: Buffer | string;
  encrypt_keys?: boolean;
  max_tokens: number;
  temperature: number;
  frequency_penalty: number;
  promptsPath: string;
  textGenPath: string;
  showStatusBar: boolean;
  displayErrorInEditor: boolean;
  outputToBlockQuote: boolean;
  freeCursorOnStreaming: boolean;
  models: any;
  context: Context;
  requestTimeout: number;
  prefix: string;
  tgSelectionLimiter: string;
  stream: boolean;
  options: Options;
  experiment: boolean;
  advancedOptions?: {
    generateTitleInstruct?: string;
    generateTitleInstructEnabled?: boolean;
    /** EXPERIMENTAL: in supported models, it will include images's base64 in the request  */
    includeAttachmentsInRequest?: boolean;
  };
  autoSuggestOptions: {
    customInstructEnabled: boolean;
    customInstruct: string;
    isEnabled: boolean;
    allowInNewLine: boolean;
    delay: number;
    numberOfSuggestions: number;
    triggerPhrase: string;
    stop: string;
    showStatus: boolean;
    customProvider: boolean;
    selectedProvider?: string;
    inlineSuggestions?: boolean;
    overrideTrigger?: string;
    showInMarkdown?: boolean;
  };
  slashSuggestOptions: {
    isEnabled: boolean;
    triggerPhrase: string;
  };
  extractorsOptions: {
    PDFExtractor: boolean;
    WebPageExtractor: boolean;
    YoutubeExtractor: boolean;
    AudioExtractor: boolean;
    ImageExtractorEmbded: boolean;
    ImageExtractor: boolean;
  };

  selectedProvider?: llmType;
  // TODO: FUTURE IMPLEMENTATION
  // reason: it will clean code, and also help with custom llm providers later on
  LLMProviderProfiles: Record<
    string,
    {
      extends: string;
      name: string;
    }
  >;
  LLMProviderOptions: Record<string, Record<string, any>>;
  LLMProviderOptionsKeysHashed: Record<string, Buffer | string>;
};

type Resource = {
  id: string;
  name: string;
  size: number;
  types: string;
  metadata: Record<string, string>;
  folderName: string;
};

type Subscription = {
  id: string;
  name: string;
  type: string;
};

type TextGeneratorConfiguration = {
  packagesHash: Record<string, PackageTemplate>;
  installedPackagesHash: Record<string, InstalledPackage>;
  resources: Record<string, Resource>;
  subscriptions: Subscription[];
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
  installed?: boolean;
  type?: "template" | "feature";
  price?: number;
  core?: boolean;
  desktopOnly?: boolean;
};

type PromptTemplate = {
  id: string;
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
  type?: string;
  image_url?: string;
  role: Role;
  content: MessageContent;
};

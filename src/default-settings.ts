import pkg from "../package.json";
import { TextGeneratorSettings } from "./types";

const DEFAULT_SETTINGS: TextGeneratorSettings = {
  version: pkg.version as any,
  endpoint: "https://api.openai.com/v1",
  models: [],
  api_key: "",
  encrypt_keys: false,
  selectedProvider: "OpenAI Chat (Langchain)",
  max_tokens: 5000,
  temperature: 0.7,
  frequency_penalty: 0.5,
  showStatusBar: true,
  outputToBlockQuote: false,
  freeCursorOnStreaming: false,
  allowJavascriptRun: false,
  experiment: false,
  promptsPath: "textgenerator/templates",
  textGenPath: "textgenerator/",
  prefix: "\n\n",
  tgSelectionLimiter: "^\\*\\*\\*",
  stream: true,
  context: {
    customInstructEnabled: true,
    includeClipboard: true,
    customInstruct: `Title: {{title}}
  
Starred Blocks: {{starredBlocks}}
	  
{{tg_selection}}`,

    contextTemplate: `Title: {{title}}
	
Starred Blocks: {{starredBlocks}}
	  
{{tg_selection}}`,
  },
  requestTimeout: 300000,
  options: {
    "generate-text": true,
    "generate-text-with-metadata": true,
    "insert-generated-text-From-template": true,
    "create-generated-text-From-template": false,
    "search-results-batch-generate-from-template": true,
    "insert-text-From-template": false,
    "create-text-From-template": false,
    "show-modal-From-template": true,
    "open-template-as-tool": true,
    "open-playground": true,
    set_max_tokens: true,
    "set-llm": true,
    "set-model": true,
    packageManager: true,
    "create-template": false,
    "get-title": true,
    "generated-text-to-clipboard-From-template": false,
    "calculate-tokens": true,
    "calculate-tokens-for-template": true,
    "text-extractor-tool": true,
    "stop-stream": true,
    "custom-instruct": true,
    "generate-in-right-click-menu": false,
    "batch-generate-in-right-click-files-menu": true,
    "tg-block-processor": true,
    reload: true,
    "disable-ribbon-icons": false,
    "overlay-toolbar": false,
    "log-slowest-operations": false,
  },

  advancedOptions: {
    generateTitleInstructEnabled: false,
    generateTitleInstruct: `Generate a title for the current document (do not use * " \\ / < > : | ? .):
{{substring content 0 255}}`,

    includeAttachmentsInRequest: false,
  },

  autoSuggestOptions: {
    customInstructEnabled: true,
    customInstruct: `Continue the follwing text:
Title: {{title}}
{{query}}`,
    systemPrompt: "",
    isEnabled: false,
    allowInNewLine: false,
    delay: 300,
    numberOfSuggestions: 5,
    triggerPhrase: "  ",
    stop: ".",
    showStatus: true,
    customProvider: false,
    inlineSuggestions: false,
    overrideTrigger: " ",
  },

  slashSuggestOptions: {
    isEnabled: false,
    triggerPhrase: "/",
  },

  extractorsOptions: {
    PDFExtractor: true,
    WebPageExtractor: true,
    YoutubeExtractor: true,
    AudioExtractor: false,
    ImageExtractorEmbded: true,
    ImageExtractor: true,
  },
  displayErrorInEditor: false,
  LLMProviderProfiles: {},
  LLMProviderOptions: {},
  LLMProviderOptionsKeysHashed: {},
};

export default DEFAULT_SETTINGS;

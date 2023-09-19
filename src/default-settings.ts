import { TextGeneratorSettings } from "./types";


const { safeStorage } = require("electron").remote;


const DEFAULT_SETTINGS: TextGeneratorSettings = {
  endpoint: "https://api.openai.com/v1",
  models: [],
  api_key: "",
  encrypt_keys: safeStorage?.isEncryptionAvailable(),
  engine: "gpt-3.5-turbo",
  max_tokens: 500,
  temperature: 0.7,
  frequency_penalty: 0.5,
  prompt: "",
  showStatusBar: true,
  outputToBlockQuote: false,
  freeCursorOnStreaming: true,
  promptsPath: "textgenerator/prompts",
  prefix: "\n\n",
  stream: true,
  context: {
    includeTitle: false,
    includeStaredBlocks: true,
    includeFrontmatter: true,
    includeHeadings: true,
    includeChildren: false,
    includeMentions: false,
    includeHighlights: true,
    includeExtractions: false,
    includeClipboard: true,
  },
  requestTimeout: 300000,
  options: {
    "generate-text": true,
    "generate-text-with-metadata": true,
    "insert-generated-text-From-template": true,
    "create-generated-text-From-template": false,
    "insert-text-From-template": false,
    "create-text-From-template": false,
    "show-modal-From-template": true,
    set_max_tokens: true,
    "set-llm": true,
    packageManager: true,
    "create-template": false,
    "get-title": true,
    "generated-text-to-clipboard-From-template": false,
    "calculate-tokens": true,
    "calculate-tokens-for-template": true,
    "modal-suggest": false,
    "text-extractor-tool": true,
    "stop-stream": true,

  },
  autoSuggestOptions: {
    isEnabled: false,
    delay: 300,
    numberOfSuggestions: 5,
    triggerPhrase: "  ",
    stop: ".",
    showStatus: true,
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
  LLMProviderOptions: {},
  LLMProviderOptionsKeysHashed: {},
};

export default DEFAULT_SETTINGS;

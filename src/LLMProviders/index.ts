import LangchainOpenAIChatProvider from "./langchain/openaiChat";
import LangchainChatGoogleGenerativeAIProvider from "./langchain/googleGenerativeAI";

export const defaultProviders = [
  // OpenAI Chat —— 兼容 DeepSeek / Moonshot / 通义千问等所有 OpenAI 格式 API
  LangchainOpenAIChatProvider,

  // Google Gemini
  LangchainChatGoogleGenerativeAIProvider,
];

export type llmType = (typeof defaultProviders)[number]["id"];
export type llmSlugType = (typeof defaultProviders)[number]["slug"];
export type LLMProviderType = llmType;

export const defaultProvidersMap: Record<
  any,
  (typeof defaultProviders)[number]
> = {} as any;

for (const llm of defaultProviders) {
  defaultProvidersMap[llm.id] = llm;
}

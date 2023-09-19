import ProviderBase from "./base";
import CustomProvider from "./custom/base";

import ChatgptLangchainProvider from "./langchain/chatgpt";
import LangchainOpenAIProvider from "./langchain/openai";
// import LangchainReplicaProvider from "./langchain/replica"
import LangchainHFProvider from "./langchain/hf";
import ChatanthropicLangchainProvider from "./langchain/chatanthropic";
import OlamaLangchainProvider from "./langchain/olama";
import LLMProviderRegistry from "./registery";
import LangchainAzureChatgptProvider from "./langchain/azure.chatgpt";
import LangchainPalmProvider from "./langchain/palm";

const DefaultProviders = {
  [ChatgptLangchainProvider.id]: ChatgptLangchainProvider,
  [LangchainOpenAIProvider.id]: LangchainOpenAIProvider,
  [LangchainAzureChatgptProvider.id]: LangchainAzureChatgptProvider,
  [LangchainPalmProvider.id]: LangchainPalmProvider,
  [ChatanthropicLangchainProvider.id]: ChatanthropicLangchainProvider,
  [OlamaLangchainProvider.id]: OlamaLangchainProvider,
  // "Replica (Langchain)": LangchainReplicaProvider,
  [LangchainHFProvider.id]: LangchainHFProvider,
  [CustomProvider.id]: CustomProvider,
} as const;

export type LLMProviderType = keyof typeof DefaultProviders;
export const LLMProviderRegistery = new LLMProviderRegistry<ProviderBase>(
  DefaultProviders as any
);

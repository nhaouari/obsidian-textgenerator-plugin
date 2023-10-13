import ProviderBase from "./base";

import CustomProvider from "./custom/base";

import LangchainOpenAIChatProvider from "./langchain/openaiChat";
import LangchainOpenAIInstructProvider from "./langchain/openaiInstruct";
import LangchainHFProvider from "./langchain/hf";
import ChatanthropicLangchainProvider from "./langchain/chatanthropic";
import OllamaLangchainProvider from "./langchain/ollama";
import LangchainAzureOpenAIChatProvider from "./langchain/azureOpenAIChat";
import LangchainAzureOpenAIInstructProvider from "./langchain/azureOpenAIInstruct";
import LangchainPalmProvider from "./langchain/palm";
// import LangchainReplicaProvider from "./langchain/replica"

import LLMProviderRegistry from "./registery";

const DefaultProviders = {
  // openai
  [LangchainOpenAIChatProvider.id]: LangchainOpenAIChatProvider,
  [LangchainOpenAIInstructProvider.id]: LangchainOpenAIInstructProvider,

  // azure
  [LangchainAzureOpenAIChatProvider.id]: LangchainAzureOpenAIChatProvider,
  [LangchainAzureOpenAIInstructProvider.id]:
    LangchainAzureOpenAIInstructProvider,

  // palm
  [LangchainPalmProvider.id]: LangchainPalmProvider,

  // anthropic
  [ChatanthropicLangchainProvider.id]: ChatanthropicLangchainProvider,

  // ollama
  [OllamaLangchainProvider.id]: OllamaLangchainProvider,

  // replica (disabled because it doesn't work)
  // "Replica (Langchain)": LangchainReplicaProvider,

  // huggingface
  [LangchainHFProvider.id]: LangchainHFProvider,

  // custom
  [CustomProvider.id]: CustomProvider,
} as const;

export type LLMProviderType = keyof typeof DefaultProviders;
export const LLMProviderRegistery = new LLMProviderRegistry<ProviderBase>(
  DefaultProviders as any
);

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

const providers = [
  // openai
  LangchainOpenAIChatProvider,
  LangchainOpenAIInstructProvider,

  // azure
  LangchainAzureOpenAIChatProvider,
  LangchainAzureOpenAIInstructProvider,

  // palm
  LangchainPalmProvider,

  // anthropic
  ChatanthropicLangchainProvider,

  // ollama
  OllamaLangchainProvider,

  // replica (disabled because it doesn't work)
  // "Replica (Langchain)": LangchainReplicaProvider,

  // huggingface
  LangchainHFProvider,

  // custom
  CustomProvider,
];

export type llmType = (typeof providers)[number]["id"];
export type llmSlugType = (typeof providers)[number]["slug"];

const DefaultProviders: Record<llmType, (typeof providers)[number]> = {} as any;
const ProviderSlugs: Record<llmSlugType, llmType> = {};

for (const pvrd of providers) {
  DefaultProviders[pvrd.id] = pvrd;
  if (pvrd.slug) ProviderSlugs[pvrd.slug] = pvrd.id;
}

export type LLMProviderType = keyof typeof DefaultProviders;

export const LLMProviderRegistery = new LLMProviderRegistry<ProviderBase>(
  DefaultProviders as any,
  ProviderSlugs
);

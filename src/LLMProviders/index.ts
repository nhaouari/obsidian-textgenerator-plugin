import ProviderBase from "./base";

import CustomProvider from "./custom/custom";
import AnthropicCustomProvider from "./custom/anthropic";

import LangchainOpenAIChatProvider from "./langchain/openaiChat";
import LangchainMistralAIChatProvider from "./langchain/mistralaiChat";
import LangchainOpenAIInstructProvider from "./langchain/openaiInstruct";
import LangchainHFProvider from "./langchain/hf";
import ChatanthropicLangchainProvider from "./langchain/chatanthropic";
import OllamaLangchainProvider from "./langchain/ollama";
import LangchainAzureOpenAIChatProvider from "./langchain/azureOpenAIChat";
import LangchainAzureOpenAIInstructProvider from "./langchain/azureOpenAIInstruct";
import LangchainPalmProvider from "./langchain/palm";
import LangchainChatGoogleGenerativeAIProvider from "./langchain/googleGenerativeAI";
// import LangchainReplicaProvider from "./langchain/replica"

import LLMProviderRegistry from "./registery";

import { LOCClone1, LOCClone2 } from "./langchain/clones";


const providers = [
  // openai
  LangchainOpenAIChatProvider,
  LangchainOpenAIInstructProvider,

  // google
  LangchainChatGoogleGenerativeAIProvider,
  LangchainPalmProvider,

  // ollama
  OllamaLangchainProvider,

  // huggingface
  LangchainHFProvider,

  // mistralAI
  LangchainMistralAIChatProvider,

  // anthropic
  ChatanthropicLangchainProvider,


  // azure
  LangchainAzureOpenAIChatProvider,
  LangchainAzureOpenAIInstructProvider,

  // replica (disabled because it doesn't work)
  // "Replica (Langchain)": LangchainReplicaProvider,



  // anthropic custom
  AnthropicCustomProvider,

  LOCClone1,
  LOCClone2,

  // custom
  CustomProvider,
];

export type llmType = (typeof providers)[number]["id"];
export type llmSlugType = (typeof providers)[number]["slug"];

const DefaultProviders: Record<llmType, (typeof providers)[number]> = {} as any;

/** to get llm from slug */
export const ProviderSlugs: Partial<Record<llmSlugType, llmType>> = {};
/** to get llm slug */
export const UnProviderSlugs: Record<string, llmSlugType> = {};

export const ProviderSlugsList: llmSlugType[] = [];

for (const pvrd of providers) {
  DefaultProviders[pvrd.id] = pvrd;
  if (pvrd.slug) {
    ProviderSlugs[pvrd.slug] = pvrd.id;
    UnProviderSlugs[pvrd.id] = pvrd.slug;
    ProviderSlugsList.push(pvrd.slug);
  }
}

export type LLMProviderType = llmType

export const LLMProviderRegistery = new LLMProviderRegistry<ProviderBase>(
  DefaultProviders as any,
  ProviderSlugs
);

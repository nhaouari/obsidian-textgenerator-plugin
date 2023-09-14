import ProviderBase from "./base";
import CustomProvider from "./custom/base";

import ChatgptLangchainProvider from "./langchain/chatgpt";
// import LangchainReplicaProvider from "./langchain/replica"
import LangchainHFProvider from "./langchain/hf";
import ChatanthropicLangchainProvider from "./langchain/chatanthropic";
import OlamaLangchainProvider from "./langchain/olama";
import LLMProviderRegistry from "./registery";
import LangchainAzureChatgptProvider from "./langchain/azure.chatgpt";
import LangchainPalmProvider from "./langchain/palm";

const DefaultProviders = {
	"Chatgpt (Langchain)": ChatgptLangchainProvider,
	"Azure Chatgpt (Langchain)": LangchainAzureChatgptProvider,
	"Google Palm (Langchain)": LangchainPalmProvider,
	"Chat Anthropic (Langchain)": ChatanthropicLangchainProvider,
	"Olama (Langchain)": OlamaLangchainProvider,
	// "Replica (Langchain)": LangchainReplicaProvider,
	"Huggingface (Langchain)": LangchainHFProvider,
	"Custom (Custom)": CustomProvider,
} as const;

export type LLMProviderType = keyof typeof DefaultProviders;
export const LLMProviderRegistery = new LLMProviderRegistry<ProviderBase>(
	DefaultProviders as any
);

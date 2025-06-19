import type { LLMProviderType } from "../types";

export type ModelType = {
  encoding: string;
  prices: {
    prompt: number;
    completion: number;
  };
  maxTokens: number;
  llm: LLMProviderType[];
  order?: number;
};


const AI_MODELS: Record<
  string,
  ModelType
> = {
  "gpt-4o": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.005,
      completion: 0.005,
    },
    maxTokens: 128000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.03,
      completion: 0.06,
    },
    maxTokens: 8192,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4-vision-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.01,
      completion: 0.03,
    },
    maxTokens: 128000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4-0314": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.03,
      completion: 0.06,
    },
    maxTokens: 8192,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4-0613": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.03,
      completion: 0.06,
    },
    maxTokens: 8192,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4-32k": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.06,
      completion: 0.12,
    },
    maxTokens: 32768,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4-32k-0613": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.06,
      completion: 0.12,
    },
    maxTokens: 32768,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4-32k-0314": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.06,
      completion: 0.12,
    },
    maxTokens: 32768,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-3.5-turbo": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0005,
      completion: 0.0015,
    },
    maxTokens: 4097,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-3.5-turbo-16k": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.004,
    },
    maxTokens: 16385,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-3.5-turbo-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0015,
      completion: 0.002,
    },
    maxTokens: 4097,
    llm: ["OpenAI Instruct (Langchain)"],
  },
  "text-davinci-003": {
    encoding: "p50k_base",
    prices: {
      prompt: 0.02,
      completion: 0.02,
    },
    maxTokens: 4097,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  "text-davinci-002": {
    encoding: "p50k_base",
    prices: {
      prompt: 0.02,
      completion: 0.02,
    },
    maxTokens: 4097,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  "text-davinci-001": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.02,
      completion: 0.02,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  "text-curie-001": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.002,
      completion: 0.002,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  "text-babbage-001": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0005,
      completion: 0.0005,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  "text-ada-001": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0004,
      completion: 0.0004,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },
  davinci: {
    encoding: "r50k_base",
    prices: {
      prompt: 0.02,
      completion: 0.02,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -2,
  },
  curie: {
    encoding: "r50k_base",
    prices: {
      prompt: 0.002,
      completion: 0.002,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -2,
  },
  babbage: {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0005,
      completion: 0.0005,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -2,
  },
  ada: {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0004,
      completion: 0.0004,
    },
    maxTokens: 2049,
    llm: ["OpenAI Instruct (Langchain)"],
    order: -1,
  },


  "gemini-1.5-flash": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0070,
      completion: 0.0105,
    },
    maxTokens: 128000,
    llm: ["Google GenerativeAI (Langchain)"],
    order: -1,
  },

  "gemini-1.5-pro": {
    encoding: "r50k_base",
    prices: {
      prompt: 0.0070,
      completion: 0.0105,
    },
    maxTokens: 128000,
    llm: ["Google GenerativeAI (Langchain)"],
    order: -1,
  },

  "models/gemini-pro": {
    encoding: "r50k_base",
    prices: {
      prompt: 0,
      completion: 0,
    },
    maxTokens: 2048,
    llm: ["Google GenerativeAI (Langchain)"],
  },

  "models/gemini-pro-vision": {
    encoding: "r50k_base",
    prices: {
      prompt: 0,
      completion: 0,
    },
    maxTokens: 2048,
    llm: ["Google GenerativeAI (Langchain)"],
    order: -1,
  },

  "mistral-tiny": {
    // @TODO: prices are not correct
    encoding: "r50k_base",
    prices: {
      prompt: 0.0004,
      completion: 0.0004,
    },
    maxTokens: 2049,
    llm: ["MistralAI Chat (Langchain)"],
    // order: -1
  },
  "mistral-small": {
    // @TODO: prices are not correct
    encoding: "r50k_base",
    prices: {
      prompt: 0.0004,
      completion: 0.0004,
    },
    maxTokens: 2049,
    llm: ["MistralAI Chat (Langchain)"],
    // order: -1
  },
  "mistral-medium": {
    // @TODO: prices are not correct
    encoding: "r50k_base",
    prices: {
      prompt: 0.0004,
      completion: 0.0004,
    },
    maxTokens: 2049,
    llm: ["MistralAI Chat (Langchain)"],
    // order: -1
  },
  "gpt-4.1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.0000005,
    },
    maxTokens: 8000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4.1-2025-04-14": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.0000005,
    },
    maxTokens: 8000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4.1-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000004,
      completion: 0.0000001,
    },
    maxTokens: 1600,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4.1-mini-2025-04-14": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000004,
      completion: 0.0000001,
    },
    maxTokens: 1600,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4.1-nano": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000001,
      completion: 0.000000025,
    },
    maxTokens: 400,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4.1-nano-2025-04-14": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000001,
      completion: 0.000000025,
    },
    maxTokens: 400,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4.5-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000075,
      completion: 0.0000375,
    },
    maxTokens: 15000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4.5-preview-2025-02-27": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000075,
      completion: 0.0000375,
    },
    maxTokens: 15000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-2024-08-06": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000025,
      completion: 0.00000125,
    },
    maxTokens: 10000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-audio-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000025,
      completion: 0,
    },
    maxTokens: 10000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-audio-preview-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000025,
      completion: 0,
    },
    maxTokens: 10000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-realtime-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.0000025,
    },
    maxTokens: 20000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.0000025,
    },
    maxTokens: 20000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0.000000075,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-mini-2024-07-18": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0.000000075,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-mini-audio-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-mini-audio-preview-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-mini-realtime-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000006,
      completion: 0.0000003,
    },
    maxTokens: 2400,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000006,
      completion: 0.0000003,
    },
    maxTokens: 2400,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "o1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.0000075,
    },
    maxTokens: 60000,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o1-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.0000075,
    },
    maxTokens: 60000,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "o1-pro": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00015,
      completion: 0,
    },
    maxTokens: 600000,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o1-pro-2025-03-19": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00015,
      completion: 0,
    },
    maxTokens: 600000,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "o3": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00001,
      completion: 0.0000025,
    },
    maxTokens: 40000,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o3-2025-04-16": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00001,
      completion: 0.0000025,
    },
    maxTokens: 40000,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "o4-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.000000275,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o4-mini-2025-04-16": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.000000275,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "o3-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o3-mini-2025-01-31": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "o1-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
  },
  "o1-mini-2024-09-12": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    order: -1,
  },
  "gpt-4o-mini-search-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-mini-search-preview-2025-03-11": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00000015,
      completion: 0,
    },
    maxTokens: 600,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "gpt-4o-search-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000025,
      completion: 0,
    },
    maxTokens: 10000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "gpt-4o-search-preview-2025-03-11": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000025,
      completion: 0,
    },
    maxTokens: 10000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "computer-use-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0,
    },
    maxTokens: 12000,
    llm: ["OpenAI Chat (Langchain)"],
  },
  "computer-use-preview-2025-03-11": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0,
    },
    maxTokens: 12000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
  },
  "amazon/nova-lite-v1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 5120,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "amazon/nova-micro-v1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 5120,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "amazon/nova-pro-v1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000003,
    },
    maxTokens: 5120,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2.0": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2.0:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2.1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2.1:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-2:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000008,
      completion: 0.000024,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-haiku": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-haiku:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-opus": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000075,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-opus:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000075,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-sonnet": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3-sonnet:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-haiku": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-haiku-20241022": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-haiku-20241022:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-haiku:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-sonnet": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-sonnet-20240620": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-sonnet-20240620:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.5-sonnet:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.7-sonnet": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 64000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.7-sonnet:beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-3.7-sonnet:thinking": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-opus-4": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000075,
    },
    maxTokens: 32000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "anthropic/claude-sonnet-4": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 64000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-chat": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-chat-v3-0324": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-chat-v3-0324:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-chat:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-prover-v2": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-0528": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-0528-qwen3-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-0528-qwen3-8b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-0528:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-llama-70b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-llama-70b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-llama-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-1.5b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-14b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-14b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 64000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-32b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-32b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 16000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1-distill-qwen-7b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-r1:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "deepseek/deepseek-v3-base:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.0-flash-001": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.0-flash-exp:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.0-flash-lite-001": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000003,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash-lite-preview-06-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash-preview-05-20": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash-preview-05-20:thinking": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000003,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-flash-preview:thinking": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000003,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-pro": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000010,
    },
    maxTokens: 65536,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-pro-exp-03-25": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-pro-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000010,
    },
    maxTokens: 65536,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-2.5-pro-preview-05-06": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000010,
    },
    maxTokens: 65535,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-flash-1.5": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-flash-1.5-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemini-pro-1.5": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000005,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-2-27b-it": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-2-9b-it": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-2-9b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-12b-it": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-12b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-1b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-27b-it": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-27b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-4b-it": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3-4b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "google/gemma-3n-e4b-it:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3-70b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3-8b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.1-405b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000002,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.1-405b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.1-70b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.1-8b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.1-8b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-11b-vision-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-11b-vision-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-1b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-1b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-3b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-3b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 20000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.2-90b-vision-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.3-70b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.3-70b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-3.3-8b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 4028,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-4-maverick": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-4-maverick:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-4-scout": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 1048576,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-4-scout:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-guard-2-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-guard-3-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "meta-llama/llama-guard-4-12b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 163840,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/codestral-2501": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 262144,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/devstral-small": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/devstral-small:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/magistral-medium-2506": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000005,
    },
    maxTokens: 40000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/magistral-medium-2506:thinking": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000005,
    },
    maxTokens: 40000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/magistral-small-2506": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 40000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/ministral-3b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/ministral-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-7b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-7b-instruct-v0.1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 2824,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-7b-instruct-v0.2": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-7b-instruct-v0.3": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-7b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-large": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-large-2407": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-large-2411": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-medium": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000008,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-medium-3": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-nemo": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-nemo:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-saba": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-small": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-small-24b-instruct-2501": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-small-24b-instruct-2501:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-small-3.1-24b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-small-3.1-24b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 96000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mistral-tiny": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mixtral-8x22b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 65536,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/mixtral-8x7b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/pixtral-12b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "mistralai/pixtral-large-2411": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/chatgpt-4o-latest": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.000015,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/codex-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo-0125": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo-0613": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000002,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo-1106": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000002,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo-16k": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000004,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-3.5-turbo-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000002,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000030,
      completion: 0.000060,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4-0314": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000030,
      completion: 0.000060,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4-1106-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000010,
      completion: 0.000030,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4-turbo": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000010,
      completion: 0.000030,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4-turbo-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000010,
      completion: 0.000030,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4.1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000008,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4.1-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000002,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4.1-nano": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4.5-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000075,
      completion: 0.00015,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000010,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-2024-05-13": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.000015,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-2024-08-06": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000010,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-2024-11-20": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000010,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-mini-2024-07-18": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-mini-search-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o-search-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000010,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/gpt-4o:extended": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000006,
      completion: 0.000018,
    },
    maxTokens: 64000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000060,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 65536,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1-mini-2024-09-12": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 65536,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000060,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1-preview-2024-09-12": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.000060,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o1-pro": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00015,
      completion: 0.0006,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o3": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000008,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o3-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o3-mini-high": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o3-pro": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000020,
      completion: 0.000080,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o4-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "openai/o4-mini-high": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000004,
    },
    maxTokens: 100000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2-72b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 4096,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-72b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-72b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-7b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-coder-32b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 16384,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-coder-32b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-vl-7b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-2.5-vl-7b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-max": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000006,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-plus": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-turbo": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-vl-max": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000003,
    },
    maxTokens: 1500,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen-vl-plus": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 1500,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen2.5-vl-32b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000001,
      completion: 0.000001,
    },
    maxTokens: 128000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen2.5-vl-32b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen2.5-vl-72b-instruct": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 32000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen2.5-vl-72b-instruct:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 2048,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-14b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-14b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-235b-a22b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000001,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-235b-a22b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-30b-a3b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-30b-a3b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-32b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-32b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-8b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 20000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwen3-8b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40960,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwq-32b": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwq-32b-preview": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "qwen/qwq-32b:free": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0,
      completion: 0.0,
    },
    maxTokens: 40000,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-2-1212": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000010,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-2-vision-1212": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000002,
      completion: 0.000010,
    },
    maxTokens: 32768,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-3-beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-3-mini-beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000000,
      completion: 0.000000,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.000015,
    },
    maxTokens: 131072,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  },
  "x-ai/grok-vision-beta": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000005,
      completion: 0.000015,
    },
    maxTokens: 8192,
    llm: ["OpenRouter Chat (Langchain)"],
    order: -1,
  }
};

export default AI_MODELS;

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
  /** Indicates if this is a thinking/reasoning model (o1, o3, Claude with extended thinking) */
  isThinking?: boolean;
  /** Input modalities supported by the model */
  inputOptions?: {
    images?: boolean;
    audio?: boolean;
    videos?: boolean;
  };
};


const AI_MODELS: Record<
  string,
  ModelType
> = {
  // ── GPT-5 family ────────────────────────────────────────────────────────────
  // https://platform.openai.com/docs/models
  "gpt-5.1": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00125,
      completion: 0.01,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5.1-2025-11-13": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00125,
      completion: 0.01,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    order: -1,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00125,
      completion: 0.01,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5-2025-08-07": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00125,
      completion: 0.01,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    order: -1,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5-mini": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00025,
      completion: 0.002,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5-mini-2025-08-07": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00025,
      completion: 0.002,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    isThinking: true,
    order: -1,
    inputOptions: {
      images: true,
    },
  },
  "gpt-5-nano": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00005,
      completion: 0.0004,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    inputOptions: {
      images: true,
    },
  },
  "gpt-5-nano-2025-08-07": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00005,
      completion: 0.0004,
    },
    maxTokens: 400000,
    llm: ["OpenAI Chat (Langchain)"],
    order: -1,
    inputOptions: {
      images: true,
    },
  },
  // ────────────────────────────────────────────────────────────────────────────
  "gpt-4o": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.005,
      completion: 0.005,
    },
    maxTokens: 128000,
    llm: ["OpenAI Chat (Langchain)"],
    inputOptions: {
      images: true,
    },
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
  "mistral-large-latest": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.002,
      completion: 0.006,
    },
    maxTokens: 128000,
    llm: ["MistralAI Chat (Langchain)"],
  },

  // ============= Anthropic Claude Models =============
  "claude-3-5-sonnet-latest": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.015,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
  },
  "claude-3-5-sonnet-20241022": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.015,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
    order: -1,
  },
  "claude-3-5-haiku-latest": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0008,
      completion: 0.004,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
  },
  "claude-3-5-haiku-20241022": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0008,
      completion: 0.004,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
    order: -1,
  },
  "claude-3-opus-latest": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.015,
      completion: 0.075,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
  },
  "claude-3-opus-20240229": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.015,
      completion: 0.075,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
    order: -1,
  },
  "claude-3-sonnet-20240229": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.015,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
    order: -1,
  },
  "claude-3-haiku-20240307": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00025,
      completion: 0.00125,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    inputOptions: {
      images: true,
    },
    order: -1,
  },
  // Claude 4 models (Thinking models with extended thinking)
  "claude-sonnet-4-6": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.015,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "claude-opus-4-6": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.015,
      completion: 0.075,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "claude-sonnet-4-20250514": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.003,
      completion: 0.015,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "claude-opus-4-20250514": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.015,
      completion: 0.075,
    },
    maxTokens: 200000,
    llm: ["Chat Anthropic (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },

  // ============= Gemini 2.0+ Models =============
  "gemini-2.0-flash": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0001,
      completion: 0.0004,
    },
    maxTokens: 1000000,
    llm: ["Google GenerativeAI (Langchain)"],
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
  },
  "gemini-2.0-flash-exp": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0,
      completion: 0,
    },
    maxTokens: 1000000,
    llm: ["Google GenerativeAI (Langchain)"],
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
    order: -1,
  },
  "gemini-2.0-flash-thinking-exp": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0,
      completion: 0,
    },
    maxTokens: 1000000,
    llm: ["Google GenerativeAI (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
  },
  "gemini-2.5-pro-preview-05-06": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00125,
      completion: 0.01,
    },
    maxTokens: 1000000,
    llm: ["Google GenerativeAI (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
  },
  "gemini-2.5-flash-preview-05-20": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00015,
      completion: 0.0035,
    },
    maxTokens: 1000000,
    llm: ["Google GenerativeAI (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
  },
  "gemini-exp-1206": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0,
      completion: 0,
    },
    maxTokens: 2000000,
    llm: ["Google GenerativeAI (Langchain)"],
    inputOptions: {
      images: true,
      audio: true,
      videos: true,
    },
    order: -1,
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
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "o1-2024-12-17": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.000015,
      completion: 0.0000075,
    },
    maxTokens: 60000,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
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
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "o1-pro-2025-03-19": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00015,
      completion: 0,
    },
    maxTokens: 600000,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
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
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "o3-2025-04-16": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.00001,
      completion: 0.0000025,
    },
    maxTokens: 40000,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
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
    isThinking: true,
    inputOptions: {
      images: true,
    },
  },
  "o4-mini-2025-04-16": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.000000275,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
    inputOptions: {
      images: true,
    },
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
    isThinking: true,
  },
  "o3-mini-2025-01-31": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
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
    isThinking: true,
  },
  "o1-mini-2024-09-12": {
    encoding: "cl100k_base",
    prices: {
      prompt: 0.0000011,
      completion: 0.00000055,
    },
    maxTokens: 4400,
    llm: ["OpenAI Agent (Langchain)"],
    isThinking: true,
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

  // ── Perplexity family ───────────────────────────────────────────────────────
  // https://docs.perplexity.ai/guides/model-cards
  "sonar": {
    encoding: "cl100k_base",
    prices: { prompt: 0.001, completion: 0.001 },
    maxTokens: 128000,
    llm: ["Perplexity (Langchain)"],
  },
  "sonar-pro": {
    encoding: "cl100k_base",
    prices: { prompt: 0.003, completion: 0.015 },
    maxTokens: 200000,
    llm: ["Perplexity (Langchain)"],
  },
  "sonar-reasoning": {
    encoding: "cl100k_base",
    prices: { prompt: 0.001, completion: 0.005 },
    maxTokens: 128000,
    llm: ["Perplexity (Langchain)"],
    isThinking: true,
  },
  "sonar-reasoning-pro": {
    encoding: "cl100k_base",
    prices: { prompt: 0.002, completion: 0.008 },
    maxTokens: 128000,
    llm: ["Perplexity (Langchain)"],
    isThinking: true,
  },
  "sonar-deep-research": {
    encoding: "cl100k_base",
    prices: { prompt: 0.005, completion: 0.005 },
    maxTokens: 128000,
    llm: ["Perplexity (Langchain)"],
    isThinking: true,
  },

  // ── Together AI family ──────────────────────────────────────────────────────
  // https://docs.together.ai/docs/serverless-models
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": {
    encoding: "cl100k_base",
    prices: { prompt: 0.00088, completion: 0.00088 },
    maxTokens: 131072,
    llm: ["Together AI (Langchain)"],
  },
  "meta-llama/Meta-Llama-3-8B-Instruct-Lite": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0001, completion: 0.0001 },
    maxTokens: 8192,
    llm: ["Together AI (Langchain)"],
    order: -1,
  },
  "deepseek-ai/DeepSeek-V3.1": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0006, completion: 0.0017 },
    maxTokens: 128000,
    llm: ["Together AI (Langchain)"],
  },
  "deepseek-ai/DeepSeek-R1": {
    encoding: "cl100k_base",
    prices: { prompt: 0.003, completion: 0.007 },
    maxTokens: 163839,
    llm: ["Together AI (Langchain)"],
    isThinking: true,
  },
  "Qwen/Qwen3.5-397B-A17B": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0006, completion: 0.0036 },
    maxTokens: 262144,
    llm: ["Together AI (Langchain)"],
    inputOptions: { images: true },
  },
  "Qwen/Qwen3.5-9B": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0001, completion: 0.00015 },
    maxTokens: 262144,
    llm: ["Together AI (Langchain)"],
    inputOptions: { images: true },
  },
  "Qwen/Qwen3-235B-A22B-Instruct-2507-tput": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0002, completion: 0.0006 },
    maxTokens: 262144,
    llm: ["Together AI (Langchain)"],
  },
  "Qwen/Qwen2.5-7B-Instruct-Turbo": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0003, completion: 0.0003 },
    maxTokens: 32768,
    llm: ["Together AI (Langchain)"],
  },
  "openai/gpt-oss-120b": {
    encoding: "cl100k_base",
    prices: { prompt: 0.00015, completion: 0.0006 },
    maxTokens: 128000,
    llm: ["Together AI (Langchain)"],
  },
  "openai/gpt-oss-20b": {
    encoding: "cl100k_base",
    prices: { prompt: 0.00005, completion: 0.0002 },
    maxTokens: 128000,
    llm: ["Together AI (Langchain)"],
  },
  "MiniMaxAI/MiniMax-M2.5": {
    encoding: "cl100k_base",
    prices: { prompt: 0.0003, completion: 0.0012 },
    maxTokens: 228700,
    llm: ["Together AI (Langchain)"],
  },
  "google/gemma-3n-E4B-it": {
    encoding: "cl100k_base",
    prices: { prompt: 0.00002, completion: 0.00004 },
    maxTokens: 32768,
    llm: ["Together AI (Langchain)"],
  },
};

export default AI_MODELS;

import type { Message } from "../../types";

export const MINIMAX_MODELS = {
  m3: "MiniMax-M3",
  m27: "MiniMax-M2.7",
} as const;

export type MiniMaxModel = (typeof MINIMAX_MODELS)[keyof typeof MINIMAX_MODELS];
export type MiniMaxProtocol = "openai" | "anthropic";
export type MiniMaxRegion = "Global" | "China";
export type MiniMaxServiceTier = "standard" | "priority";
export type MiniMaxThinkingMode = "adaptive" | "disabled";

export const MINIMAX_DEFAULT_THINKING_MODES = {
  openai: "adaptive",
  anthropic: "disabled",
} as const;

export const MINIMAX_ENDPOINTS = {
  Global: {
    openai: "https://api.minimax.io/v1",
    anthropic: "https://api.minimax.io/anthropic",
  },
  China: {
    openai: "https://api.minimaxi.com/v1",
    anthropic: "https://api.minimaxi.com/anthropic",
  },
} as const;

export const MINIMAX_DOCS = {
  Global: {
    openai: "https://platform.minimax.io/docs/api-reference/text-openai-api",
    anthropic:
      "https://platform.minimax.io/docs/api-reference/text-anthropic-api",
  },
  China: {
    openai: "https://platform.minimaxi.com/docs/api-reference/text-openai-api",
    anthropic:
      "https://platform.minimaxi.com/docs/api-reference/text-anthropic-api",
  },
} as const;

const standardShortContextPrices = {
  prompt: 0.0003,
  completion: 0.0012,
} as const;

export const MINIMAX_PRICING = {
  [MINIMAX_MODELS.m3]: {
    contextWindow: 1_000_000,
    tiers: [
      {
        serviceTier: "standard",
        inputTokensLte: 512_000,
        prices: standardShortContextPrices,
        cachePrices: { read: 0.00006, write: null },
      },
      {
        serviceTier: "standard",
        inputTokensGt: 512_000,
        prices: { prompt: 0.0006, completion: 0.0024 },
        cachePrices: { read: 0.00012, write: null },
      },
      {
        serviceTier: "priority",
        inputTokensLte: 512_000,
        prices: { prompt: 0.00045, completion: 0.0018 },
        cachePrices: { read: 0.00009, write: null },
      },
      {
        serviceTier: "priority",
        inputTokensGt: 512_000,
        prices: { prompt: 0.0009, completion: 0.0036 },
        cachePrices: { read: 0.00018, write: null },
      },
    ],
  },
  [MINIMAX_MODELS.m27]: {
    contextWindow: 204_800,
    prices: standardShortContextPrices,
    cachePrices: { read: 0.00006, write: 0.000375 },
  },
} as const;

export function getMiniMaxEndpoint(
  region: MiniMaxRegion,
  protocol: MiniMaxProtocol
) {
  return MINIMAX_ENDPOINTS[region][protocol];
}

export function getMiniMaxModelKwargs(
  model: string,
  thinkingMode: MiniMaxThinkingMode = "adaptive",
  serviceTier: MiniMaxServiceTier = "standard",
  modelKwargs: Record<string, unknown> = {}
) {
  if (model !== MINIMAX_MODELS.m3) return modelKwargs;

  return {
    ...modelKwargs,
    thinking: { type: thinkingMode },
    service_tier: serviceTier,
  };
}

export function calculateMiniMaxPrice(
  inputTokens: number,
  outputTokens: number,
  model: string,
  serviceTier: MiniMaxServiceTier = "standard"
) {
  if (model === MINIMAX_MODELS.m3) {
    const tier = MINIMAX_PRICING[MINIMAX_MODELS.m3].tiers.find(
      (candidate) =>
        candidate.serviceTier === serviceTier &&
        ("inputTokensLte" in candidate
          ? inputTokens <= candidate.inputTokensLte
          : inputTokens > candidate.inputTokensGt)
    );
    if (!tier) return 0;

    return (
      (inputTokens * tier.prices.prompt +
        outputTokens * tier.prices.completion) /
      1000
    );
  }

  if (model !== MINIMAX_MODELS.m27) return 0;

  const prices = MINIMAX_PRICING[MINIMAX_MODELS.m27].prices;
  return (
    (inputTokens * prices.prompt + outputTokens * prices.completion) / 1000
  );
}

type ContentPart = Record<string, any>;

function getMediaUrl(part: ContentPart) {
  if (part.type !== "image_url") return undefined;
  if (typeof part.image_url === "string") return part.image_url;
  return part.image_url?.url as string | undefined;
}

function isVideoUrl(url: string) {
  return (
    url.startsWith("data:video/") ||
    url.startsWith("mm_file://") ||
    /\.(mp4|avi|mov|mkv)(?:[?#]|$)/i.test(url)
  );
}

function getAnthropicVideoSource(url: string) {
  const dataUrl = url.match(/^data:(video\/[^;,]+);base64,(.+)$/s);
  if (dataUrl) {
    return {
      type: "base64",
      media_type: dataUrl[1],
      data: dataUrl[2],
    };
  }

  return { type: "url", url };
}

export function normalizeMiniMaxMessages(
  messages: Message[],
  protocol: MiniMaxProtocol
) {
  return messages.map((message) => {
    if (!Array.isArray(message.content)) return message;

    const content = message.content.map((part: ContentPart) => {
      const url = getMediaUrl(part);
      if (!url || !isVideoUrl(url)) return part;

      if (protocol === "openai") {
        const { image_url, ...rest } = part;
        return {
          ...rest,
          type: "video_url",
          video_url:
            typeof image_url === "string" ? { url: image_url } : image_url,
        };
      }

      return {
        type: "container_upload",
        minimax_video_source: getAnthropicVideoSource(url),
      };
    });

    return { ...message, content } as Message;
  });
}

export function rewriteMiniMaxAnthropicRequestBody(
  body: BodyInit | null | undefined
) {
  if (typeof body !== "string") return body;

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return body;
  }

  for (const message of payload.messages ?? []) {
    if (!Array.isArray(message.content)) continue;
    message.content = message.content.map((part: ContentPart) => {
      if (part.type !== "container_upload" || !part.minimax_video_source) {
        return part;
      }
      return { type: "video", source: part.minimax_video_source };
    });
  }

  return JSON.stringify(payload);
}

export function wrapMiniMaxAnthropicFetch(fetchImpl: typeof fetch) {
  return (input: RequestInfo | URL, init?: RequestInit) =>
    fetchImpl(input, {
      ...init,
      body: rewriteMiniMaxAnthropicRequestBody(init?.body),
    });
}

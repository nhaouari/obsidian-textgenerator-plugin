import { describe, expect, it, vi } from "vitest";

import AI_MODELS from "../../lib/models";
import {
  calculateMiniMaxPrice,
  filterMiniMaxModelChoices,
  getMiniMaxEndpoint,
  getMiniMaxModelKwargs,
  MINIMAX_DEFAULT_THINKING_MODES,
  MINIMAX_MODELS,
  MINIMAX_PRICING,
  normalizeMiniMaxMessages,
  rewriteMiniMaxAnthropicRequestBody,
  wrapMiniMaxAnthropicFetch,
} from "./minimaxConfig";

describe("MiniMax provider configuration", () => {
  it("offers Flash first and M3 while retaining an explicit saved choice", () => {
    const models = [
      MINIMAX_MODELS.m27,
      MINIMAX_MODELS.m3,
      MINIMAX_MODELS.flash,
    ];
    for (const provider of [
      "MiniMax OpenAI (Langchain)",
      "MiniMax Anthropic (Langchain)",
    ]) {
      expect(filterMiniMaxModelChoices(models, provider)).toEqual([
        MINIMAX_MODELS.flash,
        MINIMAX_MODELS.m3,
      ]);
      expect(
        filterMiniMaxModelChoices(models, provider, MINIMAX_MODELS.m27)
      ).toEqual([MINIMAX_MODELS.flash, MINIMAX_MODELS.m3, MINIMAX_MODELS.m27]);
      expect(filterMiniMaxModelChoices(models, provider, "custom")).toContain(
        "custom"
      );
      expect(
        filterMiniMaxModelChoices(
          [...models, "abab6.5s-chat", "non-MiniMax"],
          provider
        )
      ).toEqual([MINIMAX_MODELS.flash, MINIMAX_MODELS.m3, "non-MiniMax"]);
      const catalog = Object.entries(AI_MODELS)
        .filter(([, value]) => value.llm.includes(provider as any))
        .map(([id]) => id);
      expect(catalog).toEqual([MINIMAX_MODELS.flash, MINIMAX_MODELS.m3]);
    }
  });

  it("filters refreshed gateway text choices without changing other models or media", () => {
    const models = [
      "other-model",
      "MiniMaxAI/MiniMax-M2.5",
      "MiniMaxAI/MiniMax-M3",
      "MiniMaxAI/MiniMax-M3.1-Flash",
      "MiniMaxAI/MiniMax-H3",
    ];
    expect(
      filterMiniMaxModelChoices(models, "Together AI (Langchain)")
    ).toEqual(["other-model", "MiniMaxAI/MiniMax-M3", "MiniMaxAI/MiniMax-H3"]);
    expect(
      filterMiniMaxModelChoices(
        models,
        "Together AI (Langchain)",
        "MiniMaxAI/MiniMax-M2.5"
      )
    ).toContain("MiniMaxAI/MiniMax-M2.5");
    expect(filterMiniMaxModelChoices(models, "custom-provider")).toBe(models);
    expect(AI_MODELS["MiniMaxAI/MiniMax-M3"]).toMatchObject({
      maxTokens: 524_288,
      prices: { prompt: 0.0003, completion: 0.0012 },
    });
  });

  it("records Flash metadata and prices without assuming cache-write pricing", () => {
    expect(AI_MODELS[MINIMAX_MODELS.flash]).toMatchObject({
      maxTokens: 1_000_000,
      maxOutputTokens: 524_288,
      cachePrices: { read: 0.000015, write: null },
    });
    expect(
      calculateMiniMaxPrice(1_000_000, 1_000, MINIMAX_MODELS.flash)
    ).toBeCloseTo(0.1506);
  });

  it("rejects unsupported Flash effort and preserves explicit legacy kwargs", () => {
    expect(() =>
      getMiniMaxModelKwargs(MINIMAX_MODELS.flash, "adaptive", "standard", {
        reasoning_effort: "none",
      })
    ).toThrow("effort must be");
    const kwargs = {
      thinking: { type: "disabled" },
      service_tier: "priority",
      reasoning_split: false,
    };
    expect(
      getMiniMaxModelKwargs(MINIMAX_MODELS.m27, "adaptive", "standard", kwargs)
    ).toBe(kwargs);
  });
  it("defaults Anthropic-compatible M3 requests to disabled thinking", () => {
    expect(MINIMAX_DEFAULT_THINKING_MODES.anthropic).toBe("disabled");
  });

  it("exposes both protocols in both regions", () => {
    expect(getMiniMaxEndpoint("Global", "openai")).toBe(
      "https://api.minimax.io/v1"
    );
    expect(getMiniMaxEndpoint("China", "openai")).toBe(
      "https://api.minimaxi.com/v1"
    );
    expect(getMiniMaxEndpoint("Global", "anthropic")).toBe(
      "https://api.minimax.io/anthropic"
    );
    expect(getMiniMaxEndpoint("China", "anthropic")).toBe(
      "https://api.minimaxi.com/anthropic"
    );
  });

  it("applies configurable thinking and service tier only to M3", () => {
    expect(
      getMiniMaxModelKwargs(MINIMAX_MODELS.m3, "disabled", "priority")
    ).toEqual({
      thinking: { type: "disabled" },
      service_tier: "priority",
    });
    expect(
      getMiniMaxModelKwargs(MINIMAX_MODELS.m27, "disabled", "priority")
    ).toEqual({});
  });

  it("uses the correct M3 pricing tier and M2.7 fixed pricing", () => {
    expect(
      calculateMiniMaxPrice(500_000, 1_000, MINIMAX_MODELS.m3, "standard")
    ).toBeCloseTo(0.1512);
    expect(
      calculateMiniMaxPrice(600_000, 1_000, MINIMAX_MODELS.m3, "standard")
    ).toBeCloseTo(0.3624);
    expect(
      calculateMiniMaxPrice(500_000, 1_000, MINIMAX_MODELS.m3, "priority")
    ).toBeCloseTo(0.2268);
    expect(
      calculateMiniMaxPrice(600_000, 1_000, MINIMAX_MODELS.m3, "priority")
    ).toBeCloseTo(0.5436);
    expect(
      calculateMiniMaxPrice(100_000, 1_000, MINIMAX_MODELS.m27)
    ).toBeCloseTo(0.0312);
  });

  it("retains M3 and saved legacy M2.7 metadata", () => {
    const m3 = AI_MODELS[MINIMAX_MODELS.m3];
    const m27 = AI_MODELS[MINIMAX_MODELS.m27];

    expect(m3).toMatchObject({
      maxTokens: 1_000_000,
      isThinking: true,
      inputOptions: { images: true, videos: true },
      llm: ["MiniMax OpenAI (Langchain)", "MiniMax Anthropic (Langchain)"],
    });
    expect(m3.priceTiers).toEqual([
      ...MINIMAX_PRICING[MINIMAX_MODELS.m3].tiers,
    ]);
    expect(m27).toMatchObject({
      maxTokens: 204_800,
      isThinking: true,
      prices: { prompt: 0.0003, completion: 0.0012 },
      cachePrices: { read: 0.00006, write: 0.000375 },
      llm: [],
    });
  });

  it("preserves video input for each protocol request format", async () => {
    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "image_url",
            image_url: { url: "data:video/mp4;base64,AAAA" },
          },
        ],
      },
    ];

    const openAIContent = normalizeMiniMaxMessages(messages, "openai")[0]
      .content as any[];
    expect(openAIContent[0]).toMatchObject({
      type: "video_url",
      video_url: { url: "data:video/mp4;base64,AAAA" },
    });

    const anthropicContent = normalizeMiniMaxMessages(messages, "anthropic")[0]
      .content as any[];
    const requestBody = rewriteMiniMaxAnthropicRequestBody(
      JSON.stringify({ messages: [{ content: anthropicContent }] })
    ) as string;
    const parsedRequestBody = JSON.parse(requestBody) as any;
    expect(parsedRequestBody.messages[0].content[0]).toEqual({
      type: "video",
      source: { type: "base64", media_type: "video/mp4", data: "AAAA" },
    });

    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("{}")
    );
    await wrapMiniMaxAnthropicFetch(fetchImpl)("https://example.com", {
      method: "POST",
      body: JSON.stringify({ messages: [{ content: anthropicContent }] }),
    });
    const capturedBody = fetchImpl.mock.calls[0][1]?.body as string;
    expect(JSON.parse(capturedBody) as any).toEqual({
      messages: [
        {
          content: [
            {
              type: "video",
              source: {
                type: "base64",
                media_type: "video/mp4",
                data: "AAAA",
              },
            },
          ],
        },
      ],
    });
  });

  it.each([
    ["openai", "Global"],
    ["openai", "China"],
    ["anthropic", "Global"],
    ["anthropic", "China"],
  ] as const)(
    "captures the %s SDK request for the %s region",
    async (protocol, region) => {
      const [{ ChatOpenAI }, { ChatAnthropic }] = await Promise.all([
        import("@langchain/openai"),
        import("@langchain/anthropic"),
      ]);
      let captured: { url: string; body: Record<string, any> } | undefined;
      const captureFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        captured = {
          url: String(input),
          body: JSON.parse(String(init?.body || "{}")) as Record<string, any>,
        };
        throw new Error("capture-complete");
      };
      const basePath = getMiniMaxEndpoint(region, protocol);
      const modelKwargs = getMiniMaxModelKwargs(
        MINIMAX_MODELS.m3,
        "adaptive",
        "standard"
      ) as any;
      const model =
        protocol === "openai"
          ? new ChatOpenAI({
              apiKey: "test-key",
              model: MINIMAX_MODELS.m3,
              maxTokens: 8,
              maxRetries: 0,
              modelKwargs,
              configuration: { baseURL: basePath, fetch: captureFetch },
            })
          : new ChatAnthropic({
              apiKey: "test-key",
              anthropicApiUrl: basePath,
              model: MINIMAX_MODELS.m3,
              maxTokens: 8,
              maxRetries: 0,
              thinking: modelKwargs.thinking,
              invocationKwargs: {
                service_tier: modelKwargs.service_tier,
              },
              clientOptions: { fetch: captureFetch },
            });

      try {
        await model.invoke("Hello");
      } catch {
        expect(captured).toBeDefined();
      }

      const request = captured as {
        url: string;
        body: Record<string, any>;
      };
      expect(request.url).toBe(
        protocol === "openai"
          ? `${basePath}/chat/completions`
          : `${basePath}/v1/messages`
      );
      expect(request.body).toMatchObject({
        model: MINIMAX_MODELS.m3,
        thinking: { type: "adaptive" },
        service_tier: "standard",
      });
    }
  );
});

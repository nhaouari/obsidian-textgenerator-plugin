import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the Obsidian UI/services are replaced. Provider configuration, message
// conversion, LangChain clients, and SDK serialization run unchanged.
vi.mock("obsidian", () => ({}));
vi.mock("#/ui/icons", () => ({ IconExternalLink: () => null }));
vi.mock("../utils", () => ({
  HeaderEditor: () => null,
  ModelsHandler: () => null,
}));
vi.mock("../refs", async () => ({
  AI_MODELS: (await import("../../lib/models")).default,
  chains: {},
  splitters: {},
  Dropdown: () => null,
  Input: () => null,
  SettingItem: () => null,
  useGlobal: vi.fn(),
}));
vi.mock("#/constants", async () => ({
  AI_MODELS: (await import("../../lib/models")).default,
}));
vi.mock("#/helpers/handlebars-helpers", () => ({ Handlebars: {} }));

import MiniMaxOpenAI, {
  LangchainMiniMaxAnthropicProvider as MiniMaxAnthropic,
} from "./minimaxChat";
import Together from "./togetherChat";
import {
  MINIMAX_MODELS,
  getMiniMaxEndpoint,
  MINIMAX_EFFORTS,
} from "./minimaxConfig";

beforeEach(() => {
  vi.stubGlobal("location", { origin: "app://obsidian.md" });
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function captureRequest(
  protocol: "openai" | "anthropic" | "together",
  saved: Record<string, any> = {},
  request: Record<string, any> = {},
  messages: any[] = [{ role: "user", content: "Hello" }]
) {
  let captured: { url: string; body: any } | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), body: JSON.parse(String(init?.body)) };
    const body =
      protocol === "anthropic"
        ? {
            id: "msg_test",
            type: "message",
            role: "assistant",
            model: captured.body.model,
            content: [{ type: "text", text: "ok" }],
            stop_reason: "end_turn",
            usage: { input_tokens: 1, output_tokens: 1 },
          }
        : {
            id: "chat_test",
            object: "chat.completion",
            model: captured.body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "ok" },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          };
    if (captured.body.stream) {
      const events: any[] =
        protocol === "anthropic"
          ? [
              {
                type: "message_start",
                message: { ...body, content: [], stop_reason: null },
              },
              {
                type: "content_block_start",
                index: 0,
                content_block: { type: "text", text: "" },
              },
              {
                type: "content_block_delta",
                index: 0,
                delta: { type: "text_delta", text: "ok" },
              },
              { type: "content_block_stop", index: 0 },
              {
                type: "message_delta",
                delta: { stop_reason: "end_turn", stop_sequence: null },
                usage: { output_tokens: 1 },
              },
              { type: "message_stop" },
            ]
          : [
              {
                ...body,
                object: "chat.completion.chunk",
                choices: [
                  {
                    index: 0,
                    delta: { role: "assistant", content: "ok" },
                    finish_reason: null,
                  },
                ],
              },
              {
                ...body,
                object: "chat.completion.chunk",
                choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
              },
            ];
      const stream =
        events
          .map(
            (event) =>
              `${protocol === "anthropic" ? `event: ${event.type}\n` : ""}data: ${JSON.stringify(event)}\n\n`
          )
          .join("") + (protocol === "openai" ? "data: [DONE]\n\n" : "");
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(stream));
            controller.close();
          },
        }),
        {
          headers: { "content-type": "text/event-stream" },
        }
      );
    }
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  });
  const Provider =
    protocol === "anthropic"
      ? MiniMaxAnthropic
      : protocol === "together"
        ? Together
        : MiniMaxOpenAI;
  const plugin: any = {
    settings: {
      max_tokens: 128,
      temperature: 0.5,
      LLMProviderOptions: {
        [Provider.id]: { api_key: "offline-fixture", ...saved },
      },
    },
    textGenerator: { proxyService: { getFetch: () => fetch } },
    appendThinkingContent: vi.fn(),
  };
  const provider = new Provider({ plugin });
  await provider.load();
  // LangChain's post-stream usage estimate lazily downloads a tokenizer.
  // Keep it offline without replacing request serialization or stream parsing.
  if (protocol !== "anthropic") {
    const { ChatOpenAICompletions } = await import("@langchain/openai");
    vi.spyOn(ChatOpenAICompletions.prototype, "getNumTokens").mockResolvedValue(
      1
    );
  }
  expect(await provider.generate(messages, request)).toBe("ok");
  expect(fetch).toHaveBeenCalledOnce();
  expect(plugin.settings.LLMProviderOptions[Provider.id]).toEqual({
    api_key: "offline-fixture",
    ...saved,
  });
  if (!captured) throw new Error("No SDK request captured");
  return captured;
}

describe("MiniMax provider HTTP boundary", () => {
  it("offers Flash first in the registered providers' command picker", () => {
    for (const Provider of [MiniMaxOpenAI, MiniMaxAnthropic]) {
      const plugin: any = {
        settings: { LLMProviderOptions: { [Provider.id]: {} } },
        textGenerator: { LLMProvider: { originalId: Provider.id } },
      };
      const provider = new Provider({ plugin });
      expect(provider.getModels().map((model) => model.id)).toEqual([
        MINIMAX_MODELS.flash,
        MINIMAX_MODELS.m3,
      ]);
    }
  });
  it.each([
    ["openai", "Global"],
    ["openai", "China"],
    ["anthropic", "Global"],
    ["anthropic", "China"],
  ] as const)("defaults %s in %s to Flash", async (protocol, region) => {
    const { url, body } = await captureRequest(protocol, { apiRegion: region });
    expect(url).toBe(
      `${getMiniMaxEndpoint(region, protocol)}${protocol === "openai" ? "/chat/completions" : "/v1/messages"}`
    );
    expect(body).toMatchObject({
      model: MINIMAX_MODELS.flash,
      thinking: { type: "adaptive" },
      max_tokens: 128,
    });
    expect(
      protocol === "openai" ? body.reasoning_effort : body.output_config.effort
    ).toBe("max");
    expect(body).not.toHaveProperty(
      protocol === "openai" ? "output_config" : "reasoning_effort"
    );
    expect(body).not.toHaveProperty("service_tier");
    expect(body).not.toHaveProperty("reasoning_split", false);
  });

  it.each(["openai", "anthropic"] as const)(
    "preserves saved M3, legacy, and custom models in %s",
    async (protocol) => {
      for (const model of [
        MINIMAX_MODELS.m3,
        MINIMAX_MODELS.m27,
        "custom-model",
      ]) {
        const { body, url } = await captureRequest(protocol, {
          model,
          basePath: "https://custom.invalid/api",
        });
        expect(body.model).toBe(model);
        expect(url).toContain("https://custom.invalid/api/");
        if (model === MINIMAX_MODELS.m3) {
          expect(body.thinking).toEqual({
            type: protocol === "openai" ? "adaptive" : "disabled",
          });
          expect(body.service_tier).toBe("standard");
        }
      }
    }
  );

  it.each(["openai", "anthropic"] as const)(
    "serializes every Flash effort and removes stale M3 settings in %s",
    async (protocol) => {
      for (const effort of MINIMAX_EFFORTS) {
        const { body } = await captureRequest(protocol, {
          model: MINIMAX_MODELS.flash,
          thinkingMode: "disabled",
          serviceTier: "priority",
          minimaxReasoningEffort: effort,
          modelKwargs: {
            thinking: { type: "disabled" },
            service_tier: "priority",
            reasoning_split: false,
          },
        });
        expect(body.thinking).toEqual({ type: "adaptive" });
        expect(
          protocol === "openai"
            ? body.reasoning_effort
            : body.output_config.effort
        ).toBe(effort);
        expect(body).not.toHaveProperty("service_tier");
        expect(body).not.toHaveProperty("reasoning_split", false);
      }
    }
  );

  it.each(["openai", "anthropic"] as const)(
    "honors request model overrides and M3 controls in %s",
    async (protocol) => {
      const { body } = await captureRequest(
        protocol,
        { model: MINIMAX_MODELS.flash, minimaxReasoningEffort: "xhigh" },
        {
          model: MINIMAX_MODELS.m3,
          thinkingMode: "disabled",
          serviceTier: "priority",
        }
      );
      expect(body).toMatchObject({
        model: MINIMAX_MODELS.m3,
        thinking: { type: "disabled" },
        service_tier: "priority",
      });
      expect(body).not.toHaveProperty("reasoning_effort");
      expect(body).not.toHaveProperty("output_config");
    }
  );

  it.each([
    ["openai", MINIMAX_MODELS.flash],
    ["anthropic", MINIMAX_MODELS.flash],
    ["openai", MINIMAX_MODELS.m3],
    ["anthropic", MINIMAX_MODELS.m3],
  ] as const)(
    "preserves %s image and video payloads for %s",
    async (protocol, model) => {
      const { body } = await captureRequest(protocol, { model }, {}, [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe these" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,AAAA" },
            },
            {
              type: "image_url",
              image_url: { url: "data:video/mp4;base64,AAAA" },
            },
          ],
        },
      ]);
      const content = body.messages[0].content;
      expect(content[0]).toMatchObject({
        type: "text",
        text: "Describe these",
      });
      expect(content[1].type).toBe(
        protocol === "openai" ? "image_url" : "image"
      );
      expect(content[2]).toMatchObject(
        protocol === "openai"
          ? {
              type: "video_url",
              video_url: { url: "data:video/mp4;base64,AAAA" },
            }
          : {
              type: "video",
              source: { type: "base64", media_type: "video/mp4", data: "AAAA" },
            }
      );
    }
  );

  it.each(["openai", "anthropic"] as const)(
    "streams the default Flash request in %s",
    async (protocol) => {
      const { body } = await captureRequest(protocol, {}, { stream: true });
      expect(body).toMatchObject({
        model: MINIMAX_MODELS.flash,
        stream: true,
        thinking: { type: "adaptive" },
      });
    },
    15_000
  );

  it("preserves the verified gateway route and explicit legacy routes", async () => {
    for (const model of [
      "MiniMaxAI/MiniMax-M3",
      "MiniMaxAI/MiniMax-M2.5",
      "custom-model",
    ]) {
      const { url, body } = await captureRequest("together", {
        model,
        basePath: "https://api.together.xyz/v1",
      });
      expect(url).toBe("https://api.together.xyz/v1/chat/completions");
      expect(body.model).toBe(model);
      expect(body).not.toHaveProperty("service_tier");
      expect(body).not.toHaveProperty("thinking");
    }
  });
});

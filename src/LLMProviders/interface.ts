import type { Register } from "#/ui/settings/sections";
import { Message } from "src/types";

export default interface LLMProviderInterface {
  streamable?: boolean;
  id: string;
  generate(
    messages: Message[],
    reqParams: Partial<Omit<LLMConfig, "n">>,
    onToken?: (
      token: string,
      first: boolean
    ) => Promise<string | void | null | undefined>,
    customConfig?: any
  ): Promise<string>;

  generateMultiple(
    messages: Message[],
    reqParams: Partial<LLMConfig>,
    customConfig?: any
  ): Promise<string[]>;

  RenderSettings(props: {
    sectionId: string;
    register: Register;
    self: any;
  }): any;

  calcTokens(
    messages: Message[],
    reqParams: Partial<LLMConfig>
  ): Promise<{ tokens: number; maxTokens: number }>;

  calcPrice(tokens: number, reqParams: Partial<LLMConfig>): Promise<number>;

  getSettings(): Record<string, any>;
}

export interface LLMConfig {
  api_key: string;
  endpoint?: string;
  requestParams: RequestInit;
  otherOptions: any;
  stream: boolean;
  stop?: string[];
  n?: number;
  engine: string;
  max_tokens: number;
  temperature: number;
  frequency_penalty: number;
  llmPredict: boolean;
}

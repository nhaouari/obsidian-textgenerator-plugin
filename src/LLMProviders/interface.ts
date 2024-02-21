import type { LLMChain } from "langchain/chains";
import type { Message } from "src/types";
import type { ContextTemplate, Register } from "./refs";

export default interface LLMProviderInterface {
  streamable?: boolean;
  mobileSupport?: boolean;
  id: string;
  slug?: string;
  provider: string;
  cloned?: boolean;
  /** original id before the cloning */
  originalId: string;


  load(): Promise<any>;

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

  generateBatch(
    batches: { messages: Message[], reqParams: Partial<LLMConfig> }[],
    customConfig?: any,
    onOneFinishs?: (content: string, index: number) => void
  ): Promise<string[]>;

  convertToChain(
    templates: ContextTemplate,
    reqParams: Partial<LLMConfig>,
    customConfig?: any
  ): Promise<LLMChain<string, any>>;

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
  basePath?: string;
  requestParams: RequestInit;
  otherOptions: any;
  stream: boolean;
  stop?: string[];
  n?: number;
  model: string;
  max_tokens: number;
  temperature: number;
  frequency_penalty: number;
  presence_penalty: number;
  llmPredict: boolean;
  bodyParams?: any;
  modelKwargs?: any;
}

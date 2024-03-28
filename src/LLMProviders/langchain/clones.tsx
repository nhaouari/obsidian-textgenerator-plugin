import LangchainOpenAIChatProvider from "./openaiChat";

// added in version 0.5.26-beta
export class LOCClone1 extends LangchainOpenAIChatProvider {
  static provider = "Langchain" as any;

  static id = "OpenAI Chat 1 (Langchain)" as "OpenAI Chat (Langchain)";
  static slug = "openAIChatClone1" as any;
  static displayName = "OpenAI Chat 1";

  id = LOCClone1.id;
  provider = LOCClone1.provider;
}

// added in version 0.5.26-beta
export class LOCClone2 extends LangchainOpenAIChatProvider {
  static provider = "Langchain" as any;

  static id = "OpenAI Chat 2 (Langchain)" as "OpenAI Chat (Langchain)";
  static slug = "openAIChatClone2" as any;
  static displayName = "OpenAI Chat 2";

  id = LOCClone2.id;
  provider = LOCClone2.provider;
}

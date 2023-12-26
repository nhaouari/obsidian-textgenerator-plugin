import LangchainOpenAIChatProvider from "./openaiChat";



export class LOCClone1 extends LangchainOpenAIChatProvider {
    static provider = "Langchain" as any;
    // @ts-ignore
    static id = "OpenAI Chat 1 (Langchain)" as any;
    static slug = "openAIChatClone1" as any;


    id = LangchainOpenAIChatProvider.id;
    provider = LangchainOpenAIChatProvider.provider;
}

export class LOCClone2 extends LangchainOpenAIChatProvider {
    static provider = "Langchain" as any;
    // @ts-ignore
    static id = "OpenAI Chat 2 (Langchain)" as any;
    static slug = "openAIChatClone2" as any;


    id = LangchainOpenAIChatProvider.id;
    provider = LangchainOpenAIChatProvider.provider;
}
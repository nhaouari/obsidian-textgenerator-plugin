import LangchainOpenAIChatProvider from "./openaiChat";



export class LOCClone1 extends LangchainOpenAIChatProvider {
    static provider = "Langchain" as any;
    // @ts-ignore
    static id = "OpenAI Chat 1 (Langchain)" as any;
    static slug = "openAIChatClone1" as any;


    id = LOCClone1.id;
    provider = LOCClone1.provider;
}

export class LOCClone2 extends LangchainOpenAIChatProvider {
    static provider = "Langchain" as any;
    // @ts-ignore
    static id = "OpenAI Chat 2 (Langchain)" as any;
    static slug = "openAIChatClone2" as any;


    id = LOCClone2.id;
    provider = LOCClone2.provider;
}
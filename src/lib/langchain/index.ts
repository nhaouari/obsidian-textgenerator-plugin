import {
  TokenTextSplitter,
  CharacterTextSplitter,
  LatexTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  TextSplitter,
} from "langchain/text_splitter";

export * as chains from "langchain/chains";

export const splitters = {
  TokenTextSplitter,
  CharacterTextSplitter,
  LatexTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  TextSplitter,
};

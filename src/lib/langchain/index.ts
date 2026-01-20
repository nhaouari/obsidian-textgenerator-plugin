// Import text splitters from @langchain/textsplitters in v1
import {
  TokenTextSplitter,
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter,
  TextSplitter,
  LatexTextSplitter,
  MarkdownTextSplitter,
} from "@langchain/textsplitters";

// Import summarization chain from langchain in v1
// The loadSummarizationChain is now part of the main langchain package
// We need to dynamically load it to avoid import issues
export const chains = {
  loadSummarizationChain: (...args: any[]) => {
    // Lazy load to avoid build-time issues
    return import("langchain").then((mod: any) => {
      if (mod.loadSummarizationChain) {
        return mod.loadSummarizationChain(...args);
      }
      // Fallback for older versions
      throw new Error("loadSummarizationChain not available");
    });
  },
};

export const splitters = {
  TokenTextSplitter,
  CharacterTextSplitter,
  LatexTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  TextSplitter,
};

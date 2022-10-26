type Context= {
  includeStaredBlocks:boolean;
  includeFrontmatter:boolean;
  includeHeadings:boolean;
  includeChildren:boolean;
  includeMentions:boolean;
}


type TextGeneratorSettings= {
	api_key: string;
	engine: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	prompt: string;
  promptsPath: string;
	showStatusBar: boolean;
  models: any;
  context:Context;
}

type PromptTemplate =  {
    id: string;
    name: string;
    path: string;
    description: string;
    required_values: string;
    author: string;
    tags: string;
    version: string;
  }
type FileViewMode = 'source' | 'preview' | 'default';
 enum NewTabDirection {
  vertical = "vertical", horizontal = "horizontal"
}

type Model = {
  id: string;
}
export type {
  FileViewMode,
  NewTabDirection,
	TextGeneratorSettings,
	PromptTemplate,
  Model,
  Context
}

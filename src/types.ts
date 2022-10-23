type TextGeneratorSettings= {
	api_key: string;
	engine: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	prompt: string;
    promptsPath: string;
	showStatusBar: boolean;
}

type PromptTemplate =  {
    id: string;
    name: string;
    path: string;
    description: string;
    author: string;
    tags: string;
    version: string;
  }

export type {
	TextGeneratorSettings,
	PromptTemplate
}

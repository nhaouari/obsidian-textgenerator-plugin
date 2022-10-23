type TextGeneratorSettings= {
	api_key: string;
	engine: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	prompt: string;
	showStatusBar: boolean;
}

type Template =  {
    title: string;
    path: string;
    desc: string;
    auth: string;
  }

export type {
	TextGeneratorSettings,
	Template
}

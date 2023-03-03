type Context= {
  includeTitle:boolean;
  includeStaredBlocks:boolean;
  includeFrontmatter:boolean;
  includeHeadings:boolean;
  includeChildren:boolean;
  includeMentions:boolean;
  includeHighlights:boolean;
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
  displayErrorInEditor: boolean;
  models: any;
  context:Context;
  options:
	{
		"generate-text": boolean,
		"generate-text-with-metadata": boolean,
		"insert-generated-text-From-template": boolean,
		"create-generated-text-From-template": boolean,
		"insert-text-From-template": boolean,
		"create-text-From-template": boolean,
		"show-model-From-template": boolean,
		"set_max_tokens": boolean,
		"set-model": boolean,
		"packageManager": boolean,
		"create-template": boolean,
		"get-title": boolean,
    "auto-suggest": boolean,
	},
  autoSuggestOptions: {
		numberOfSuggestions: number,
		triggerPhrase: string,
		stop: string,
	},
}

type TextGeneratorConfiguration = {
  packages: PackageTemplate[];
  installedPackages: InstalledPackage[];
}

type InstalledPackage = {
  packageId:string;
  version:string
  prompts:PromptTemplate[];
  installedPrompts: installedPrompts []
}

type installedPrompts ={
  promptId: string;
  version: string;
}

type PackageTemplate = {
  packageId: string;
  name: string;
  version:  string;
	minTextGeneratorVersion:  string;
	description:  string;
  tags :  string;
  author:  string;
	authorUrl: string;
  repo: string;
  published_at: Date;
  downloads:number;
}

type PromptTemplate =  {
    promptId: string;
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
  PackageTemplate,
  Model,
  Context,
  InstalledPackage,
  TextGeneratorConfiguration
}

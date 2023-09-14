import { logger } from "handlebars";
import { App, TFile, MarkdownView } from "obsidian";

import { parseLinktext, resolveSubpath } from "obsidian";
import { removeRepetitiveObjects } from "src/utils";

type NumberTuple = [number, number];
export interface SearchDetails {
	children: any[];
	childrenEl: HTMLElement;
	collapseEl: HTMLElement;
	collapsed: boolean;
	collapsible: boolean;
	containerEl: HTMLElement;
	content: string;
	dom: any;
	el: HTMLElement;
	extraContext: () => boolean;
	file: TFile;
	info: any;
	onMatchRender: any;
	pusherEl: HTMLElement;
	result: {
		filename?: NumberTuple[];
		content?: NumberTuple[];
	};
}

export default class EmbeddingScope {
	private delay: number;
	constructor(options?: { delay: number }) {
		this.delay = options?.delay ?? 1000;
	}

	async getSearchResults(): Promise<TFile[]> {
		const results = await this.getFoundAfterDelay(true);
		const paths = [...results.keys()];
		return paths;
	}

	getActiveNote(): TFile | null {
		// try {
		//     return app.workspace.getActiveFile() || null;
		// } catch { }

		const activeLeaf = app.workspace.getLeaf();

		if (activeLeaf) {
			// Check if current active view is MarkdownView
			if (activeLeaf.view instanceof MarkdownView) {
				// Get the markdown file
				const file = activeLeaf.view.file;
				return file;
			}
		}
		return null;
	}

	async getChildrenOfActiveNote(): Promise<TFile[]> {
		const activeLeaf = app.workspace.getLeaf();

		if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
			const fileCache = app.metadataCache.getFileCache(
				activeLeaf.view.file
			);
			// Get links from cache
			const links = fileCache?.links;

			// Resolve links to files
			const files = await Promise.all(
				links?.map(async (link) => {
					const { path } = parseLinktext(link.original);
					return (
						app.metadataCache.getFirstLinkpathDest(
							link.link,
							path
						) || null
					);
				}) || []
			);

			// // Filter out non-files
			// const children = files.filter(f => f instanceof TFile) as TFile[];
			// debugger;
			// return children
			return removeRepetitiveObjects(files).filter(Boolean) as TFile[];
		}

		return [];
	}

	getAllNotes(): TFile[] {
		const results = app.vault.getMarkdownFiles();
		const paths = results;
		return paths;
	}

	private async getFoundAfterDelay(
		immediate: boolean
	): Promise<Map<TFile, SearchDetails>> {
		const searchLeaf = app.workspace.getLeavesOfType("search")[0];
		const view = await searchLeaf.open(searchLeaf.view);
		if (immediate) {
			return Promise.resolve(
				// @ts-ignore
				view.dom.resultDomLookup as Map<TFile, SearchDetails>
			);
		}

		return new Promise((resolve) => {
			setTimeout(() => {
				return resolve(
					// @ts-ignore
					view.dom.resultDomLookup as Map<TFile, SearchDetails>
				);
			}, this.delay);
		});
	}
}

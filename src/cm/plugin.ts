import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";

import debug from "debug";

const logger = debug("cm:SpinnersPlugin");

class Spinners extends WidgetType {
	toDOM() {
		const span = document.createElement("span");
		span.addClasses(["loading", "dots"]);
		span.setAttribute("id", "tg-loading");
		return span;
	}
}

export class SpinnersPlugin implements PluginValue {
	decorations: DecorationSet;
	listOfPositions: number[];

	constructor(view: EditorView) {
		logger("SpinnersPlugin constructor");
		this.decorations = this.buildDecorations(view);
		this.listOfPositions = [];
	}

	add(position: number, update: EditorView) {
		logger("add", position, update);
		this.listOfPositions.push(position);
		//@ts-ignore
		this.decorations = this.buildDecorations(update.viewState);
	}

	updatePos(position: number, update: EditorView) {
		this.listOfPositions[0] = position;
		//@ts-ignore
		this.decorations = this.buildDecorations(update.viewState);
	}

	remove(position: number, update: EditorView) {
		logger("remove", position);
		this.listOfPositions = [];
		/*
	const index = this.listOfPositions.indexOf(position);
	this.listOfPositions.splice(index, 1);
	*/
		//@ts-ignore
		this.decorations = this.buildDecorations(update.viewState);
	}

	update(update: ViewUpdate) {
		// logger("update", update);
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	getListPositions() {
		logger("getListPositions", this.listOfPositions);
		return this.listOfPositions;
	}

	destroy() {}

	buildDecorations(view: EditorView): DecorationSet {
		logger("  buildDecorations", view);
		if (!this.listOfPositions) {
			this.listOfPositions = [];
		}
		const builder = new RangeSetBuilder<Decoration>();
		this.listOfPositions.forEach((p) => {
			const indentationWidget = Decoration.widget({
				widget: new Spinners(),
			});
			const line = view.state.doc.lineAt(p);
			builder.add(line.to, line.to, indentationWidget);
		});
		logger("buildDecorations ens");
		return builder.finish();
	}
}

const pluginSpec: PluginSpec<SpinnersPlugin> = {
	decorations: (value: SpinnersPlugin) => value.decorations,
};

export const spinnersPlugin = ViewPlugin.fromClass(SpinnersPlugin, pluginSpec);

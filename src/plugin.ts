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

class Spinners extends WidgetType {
    toDOM() {
      let span= document.createElement('span'); 
      span.addClasses(["loading","dots"]); 
      span.setAttribute('id','tg-loading');
      return span;
    }
  }

class SpinnersPlugin implements PluginValue {
  decorations: DecorationSet;
  listOfPositions: number[];

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
    this.listOfPositions=[];
  }

  add(position:number,update: EditorView){
    this.listOfPositions.push(position);
    console.log({updateadd:update})
    console.log({add: this.getListPositions()})
    this.decorations = this.buildDecorations(update.viewState);

  }

  remove(position:number,update:EditorView) {
    this.listOfPositions=[];
    /*
    const index = this.listOfPositions.indexOf(position);
    this.listOfPositions.splice(index, 1);
    */
    this.decorations = this.buildDecorations(update.viewState);
  }

  update(update: ViewUpdate) {
    console.log({updateupdate:update})
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  getListPositions(){
    return this.listOfPositions;
  }

  destroy() {}

  buildDecorations(view: EditorView): DecorationSet {
    if(!this.listOfPositions){
        this.listOfPositions=[];
    }
    const builder = new RangeSetBuilder<Decoration>();
    this.listOfPositions.forEach(p=>{
        const indentationWidget = Decoration.widget({
                widget: new Spinners (),
        });
        const line = view.state.doc.lineAt(p);
        builder.add(line.to, line.to, indentationWidget);
    })
    return builder.finish();
    }
}

const pluginSpec: PluginSpec<SpinnersPlugin> = {
  decorations: (value: SpinnersPlugin) => value.decorations
};

export const spinnersPlugin = ViewPlugin.fromClass(
  SpinnersPlugin,
  pluginSpec
);

import { AutoSuggest } from './AutoSuggest';
import { TextGeneratorPlugin } from 'src/main';
import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    MarkdownView,
    TFile,
} from 'obsidian';



interface Completition {
    label: string;
    value: string;
}

export class AutoSuggest extends EditorSuggest<Completition> {
    plugin: TextGeneratorPlugin;
    constructor(private app: App, plugin:TextGeneratorPlugin) {
        super(app);
        this.plugin = plugin;
    }

    public onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
        if (!this.plugin.settings.options["auto-suggest"]) {
            return;
        }
    
        const line = editor.getLine(cursor.line).substring(0, cursor.ch);
        const triggerPhrase = this.plugin.settings.autoSuggestOptions.triggerPhrase;
    
        if (!line.endsWith(triggerPhrase)) {
            return;
        }
    
        const currentPart = this.plugin.textGenerator.contextManager.getSelection(editor).replace(this.plugin.settings.autoSuggestOptions.triggerPhrase, "");
        const currentStart = line.lastIndexOf(triggerPhrase);
    
        const result={
            start: {
                ch: currentStart,
                line: cursor.line,
            },
            end: cursor,
            query: currentPart,
        };
    
        return result;
    }

    public async getSuggestions(context: EditorSuggestContext): Promise<Completition[]> {
        const suggestions = await this.getGPTSuggestions(context);
        if (suggestions?.length) {
            return suggestions;
        }
        return [{ label: context.query, value: context.query }];
    }

    public renderSuggestion(value: Completition, el: HTMLElement): void {
        el.setText(value.label);
    }

    public selectSuggestion(value: Completition, evt: MouseEvent | KeyboardEvent): void {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const currentCursorPos = activeView.editor.getCursor();
    
        let replacementValue = value.value.trimStart();
        const newCursorPos = { ch: currentCursorPos.ch + replacementValue.length - 1, line: currentCursorPos.line };

        if (!activeView) {
            return;
        }

        console.log({replacementValue,newCursorPos,context:this.context})
        activeView.editor.replaceRange(
            replacementValue,
            {
                ch: this.context.start.ch+1,
                line: this.context.start.line,
            },
            this.context.end
        );

        activeView.editor.setCursor(newCursorPos);
    }


     private async getGPTSuggestions(context: EditorSuggestContext): Promise<Completition[]> {
        const result: string[] = [];
        try {
            const prompt = `continue the follwing text : 
            ${context.query}
            ` ;
            const re = await this.plugin.textGenerator.generate(prompt,false,this.plugin.settings,"",{bodyParams:{n:parseInt(this.plugin.settings.autoSuggestOptions.numberOfSuggestions),stop:this.plugin.settings.autoSuggestOptions.stop},reqParams:{extractResult : "requestResults?.choices"}})
            let suggestions =re.map((r) => r.message.content);
            suggestions=[...new Set(suggestions)];   
            return suggestions.map((r) => {
            const label= r.replace(/^\n*/g, "").replace(/\n*$/g, "");;
            return {
                label: label,
                value: label.toLowerCase().startsWith(context.query.toLowerCase()) ? label.substring(context.query.length).replace(/^\n*/g, "") : label.replace(/^\n*/g, "")
              }});
        } catch (error) {
            this.plugin.handelError(error);
        }	
    }

}
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
        const line = editor.getLine(cursor.line).substring(0, cursor.ch);

        if (!line.contains(this.plugin.settings.autoSuggestOptions.triggerPhrase)) {
            return;
        }

        const currentPart = line.split(this.plugin.settings.autoSuggestOptions.triggerPhrase).reverse()[0];
        const currentStart = [...line.matchAll(new RegExp(this.plugin.settings.autoSuggestOptions.triggerPhrase, 'g'))].reverse()[0].index;

        const result = {
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
        const suggestions = await this.getMentionSuggestions(context);
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
        const currenCursorPos = activeView.editor.getCursor();
        const replacementValue = value.value;

        console.log({replacementValue})
        const newCursorPos = { ch: currenCursorPos.ch+replacementValue.length-1, line: currenCursorPos.line };

        if (!activeView) {
            return;
        }

        activeView.editor.replaceRange(
            replacementValue,
            {
                ch: this.context.start.ch,
                line: this.context.start.line,
            },
            this.context.end
        );

        activeView.editor.setCursor(newCursorPos);
    }


     private async getMentionSuggestions(context: EditorSuggestContext): Completition[] {
        const result: string[] = [];
        const query = this.plugin.textGenerator.contextManager.getSelection(context.editor).replace(this.plugin.settings.autoSuggestOptions.triggerPhrase, "")
        try {
            const prompt = `continue the follwing text : 
            ${query}
            ` ;
            
            const re = await this.plugin.textGenerator.generate(prompt,false,this.plugin.settings,"",{bodyParams:{n:parseInt(this.plugin.settings.autoSuggestOptions.numberOfSuggestions),stop:this.plugin.settings.autoSuggestOptions.stop},reqParams:{extractResult : "requestResults?.choices"}})
            const suggestions =re.map((r) => r.message.content);
            
            for (let key of suggestions) {
                if (key.toLocaleLowerCase().contains(context.query.toLocaleLowerCase())) {
                    result.push(key);
                }
            }
    
            return result.map((r) => ({ label: r.replace(/^\n*/g,""), value: r.replace(/^\n*/g,"")}));

        } catch (error) {
            this.plugin.handelError(error);
        }	
    }

}
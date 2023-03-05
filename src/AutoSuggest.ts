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
    TFile
} from 'obsidian';


function debounce<T extends unknown[], R>(
    func: (...args: T) => Promise<R>,
    wait: number
  ): (...args: T) => Promise<R> {
    let timeout: NodeJS.Timeout | null;
    console.log({wait});
    return function debouncedFunction(...args: T): Promise<R> {
      const context = this;
  
      return new Promise((resolve, reject) => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
  
        timeout = setTimeout(() => {
          func.apply(context, args)
            .then((result) => resolve(result))
            .catch((error) => reject(error));
        }, wait);
      });
    };
  }

interface Completition {
    label: string;
    value: string;
}

export class AutoSuggest extends EditorSuggest<Completition> {
    plugin: TextGeneratorPlugin;
    process: boolean=true;
    delay :number= 0;
    getSuggestionsDebounced:any
    constructor(private app: App, plugin:TextGeneratorPlugin) {
        super(app);
        this.plugin = plugin;
        this.scope.register([], "Tab", this.scope.keys.find(k=>k.key==="ArrowDown").func);
    }


    public updateSettings() {
        if(this.delay!==this.plugin.settings.autoSuggestOptions.delay || this.getSuggestionsDebounced === undefined) {
            this.delay = this.plugin.settings.autoSuggestOptions.delay;
            this.getSuggestionsDebounced = debounce(async (context: EditorSuggestContext): Promise<Completition[]> => {
                console.log(this.delay);
                try {
                    if (this.process) {
                        const suggestions = await this.getGPTSuggestions(context);
                        return suggestions?.length ? suggestions : [{ label: context.query, value: context.query }];
                    } else {
                        return  [{ label: context.query, value: context.query }];
                    }
                } catch (error) {
                    throw error;
                }
            }, this.delay);
        }
       
    }

    public onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
        if (!this.plugin.settings.options["auto-suggest"] || !this.plugin.settings?.autoSuggestOptions?.status || this.isOpen) {
            this.process=false;
            return;
        }
    
        const line = editor.getLine(cursor.line).substring(0, cursor.ch);
        const triggerPhrase = this.plugin.settings.autoSuggestOptions.triggerPhrase;
    
        if (!line.endsWith(triggerPhrase)) {
            this.process=false;
            return;
        }
        this.process=true;

        const selection = this.plugin.textGenerator.contextManager.getSelection(editor);
        const lastOccurrenceIndex = selection.lastIndexOf(triggerPhrase);
        const currentPart = selection.substr(0, lastOccurrenceIndex) + selection.substr(lastOccurrenceIndex).replace(triggerPhrase, "")

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
    
    

    public getSuggestions(context: EditorSuggestContext): Promise<Completition[]> {
        this.updateSettings();
        console.log({context});
        return new Promise((resolve, reject) => {
            this.getSuggestionsDebounced(context)
                .then((suggestions) => {
                    resolve(suggestions);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    public renderSuggestion(value: Completition, el: HTMLElement): void {
        el.setText(value.label);
    }

    public selectSuggestion(value: Completition, evt: MouseEvent | KeyboardEvent): void {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const currentCursorPos = activeView.editor.getCursor();
    
        let replacementValue = value.value.trimStart()+this.plugin.settings.autoSuggestOptions.stop;
        
        const prevChar = activeView.editor.getRange({ line: this.context.start.line, ch: this.context.start.ch - 1 }, this.context.start);

        if (prevChar && prevChar.trim() !== '' && replacementValue.charAt(0) !== ' ') {
            replacementValue = ' ' + replacementValue;
        } 

        const newCursorPos = { ch: this.context.start.ch + replacementValue.length, line: currentCursorPos.line };
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
        this.processing = false;
    }

     private async getGPTSuggestions(context: EditorSuggestContext): Promise<Completition[]> {
        const result: string[] = [];
        try {
            const prompt = `continue the follwing text :
            ${context.query}
            ` ;

            const additionalParams = {
                showSpinner:false,
            	bodyParams: {
            		n: parseInt(this.plugin.settings.autoSuggestOptions.numberOfSuggestions),
            		stop: this.plugin.settings.autoSuggestOptions.stop
            	},
            	reqParams: {
            		extractResult: "requestResults?.choices"
            	}
            }
            
            const re = await this.plugin.textGenerator.generate(prompt,false,this.plugin.settings,"",additionalParams);
           
           
            let suggestions = [];
            
            if (this.plugin.settings.engine==="gpt-3.5-turbo" ||  this.plugin.settings.engine==="gpt-3.5-turbo-0301") { 
                suggestions =re.map((r) => r.message.content);
            } else {
                suggestions =re.map((r) => r.text);
            }
            
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
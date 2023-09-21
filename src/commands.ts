import { Command, Editor, Notice } from "obsidian";
import TextGeneratorPlugin from "./main";
import { ExampleModal } from "./models/model";
import { PackageManagerUI } from "./ui/package-manager/package-manager-ui";
import { SetMaxTokens } from "./ui/settings/components/set-max-tokens";
import { SetModel } from "./ui/settings/components/set-model";
import { TextExtractorTool } from "./ui/text-extractor-tool";
import debug from "debug";

import { SetLLM } from "./ui/settings/components/set-llm";
import { LLMProviderRegistery } from "./LLMProviders";

const logger = debug("textgenerator:main");

const commands: Command[] = [
  {
    id: "generate-text",
    name: "Generate Text!",
    icon: "GENERATE_ICON",
    hotkeys: [{ modifiers: ["Mod"], key: "j" }],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        await self.textGenerator.generateInEditor({}, false, editor);
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "generate-text-with-metadata",
    name: "Generate Text (use Metadata))!",
    icon: "GENERATE_META_ICON",
    hotkeys: [{ modifiers: ["Mod", "Alt"], key: "j" }],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        await self.textGenerator.generateInEditor({}, true, editor);
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "insert-generated-text-From-template",
    name: "Templates: Generate & Insert ",
    icon: "circle",
    //hotkeys: [{ modifiers: ["Mod"], key: "q"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.generateFromTemplate(
              {},
              result.path,
              true,
              editor,
              true
            );
          },
          "Generate and Insert Template In The Active Note"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },
  {
    id: "generated-text-to-clipboard-From-template",
    name: "Templates: Generate & Copy To Clipboard ",
    icon: "circle",
    //hotkeys: [{ modifiers: ["Mod"], key: "q"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.generateToClipboard(
              {},
              result.path,
              true,
              editor
            );
          },
          "Generate & Copy To Clipboard"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "create-generated-text-From-template",
    name: "Templates: Generate & Create Note",
    icon: "plus-circle",
    //hotkeys: [{ modifiers: ["Mod","Shift"], key: "q"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.generateFromTemplate(
              {},
              result.path,
              true,
              editor,
              false
            );
          },
          "Generate and Create a New Note From Template"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "insert-text-From-template",
    name: "Templates: Insert Template",
    icon: "square",
    //hotkeys: [{ modifiers: ['Alt'], key: "q"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.generateFromTemplate(
              {},
              result.path,
              true,
              editor,
              true
            );
          },
          "Insert Template In The Active Note"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "create-text-From-template",
    name: "Templates: Insert & Create Note",
    icon: "plus-square",
    //hotkeys: [{ modifiers: ["Shift","Alt"], key: "q"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.generateFromTemplate(
              {},
              result.path,
              true,
              editor,
              false,
              {},
              true
            );
          },
          "Create a New Note From Template"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "show-modal-From-template",
    name: "Show modal From Template",
    icon: "layout",
    //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            await self.textGenerator.tempalteToModal({}, result.path, editor);
          },
          "Choose a template"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "set_max_tokens",
    name: "Set max_tokens",
    icon: "separator-horizontal",
    //hotkeys: [{ modifiers: ["Alt"], key: "1" }],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      new SetMaxTokens(
        self.app,
        self,
        self.settings.max_tokens.toString(),
        async (result: string) => {
          self.settings.max_tokens = parseInt(result);
          await self.saveSettings();
          new Notice(`Set Max Tokens to ${result}!`);
          self.updateStatusBar("");
        }
      ).open();
    },
  },

  {
    id: "set-llm",
    name: "Choose a LLM",
    icon: "list-start",
    //hotkeys: [{ modifiers: ["Alt"], key: "2" }],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new SetLLM(
          self.app,
          self,
          async (selectedLLMName) => {
            console.log(selectedLLMName);
            if (!selectedLLMName) return;

            const llm = LLMProviderRegistery.get(selectedLLMName);
            if (llm) {
              self.settings.selectedProvider = selectedLLMName;
            }

            self.textGenerator.setup();
            await self.saveSettings();
          },
          "Choose a LLM"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "packageManager",
    name: "Template Packages Manager",
    icon: "boxes",
    //hotkeys: [{ modifiers: ["Alt"], key: "3" }],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      new PackageManagerUI(self.app, self, async (result: string) => {}).open();
    },
  },

  {
    id: "create-template",
    name: "Create a Template",
    icon: "plus",
    //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        await self.textGenerator.createTemplateFromEditor(editor);
      } catch (error) {
        self.handelError(error);
      }
    },
  },

  {
    id: "get-title",
    name: "Generate a Title",
    icon: "heading",
    //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        const maxLength = 255;
        const prompt = `Generate a title for the current document (do not use * " \\ / < > : | ? .):
          ${editor.getValue().trim().slice(0, maxLength)}
          `;
        const generatedTitle = await self.textGenerator.gen(prompt, {});

        const sanitizedTitle = generatedTitle
          .replace(/[*\\"/<>:|?\.]/g, "")
          .replace(/^\n*/g, "");

        const activeFile = self.app.workspace.getActiveFile();
        if (!activeFile) return logger(`No active file was detected`);
        const renamedFilePath = activeFile.path.replace(
          activeFile.name,
          `${sanitizedTitle}.md`
        );
        await self.app.fileManager.renameFile(activeFile, renamedFilePath);
        logger(`Generated a title: ${sanitizedTitle}`);
      } catch (error) {
        self.handelError(error);
      }
    },
  },
  {
    id: "auto-suggest",
    name: "Turn on or off the auto suggestion",
    icon: "heading",
    //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      self.settings.autoSuggestOptions.isEnabled =
        !self.settings.autoSuggestOptions.isEnabled;
      await self.saveSettings();
      self.AutoSuggestStatusBar();

      if (self.settings.autoSuggestOptions.isEnabled) {
        new Notice(`Auto Suggestion is on!`);
      } else {
        new Notice(`Auto Suggestion is off!`);
      }
    },
  },
  {
    id: "calculate-tokens",
    name: "Estimate tokens for the current document",
    icon: "heading",
    //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      const context = await self.textGenerator.contextManager.getContext(
        editor,
        true
      );
      self.tokensScope.showTokens(await self.tokensScope.estimate(context));
    },
  },
  {
    id: "calculate-tokens-for-template",
    name: "Estimate tokens for a Template",
    icon: "layout",
    //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new ExampleModal(
          self.app,
          self,
          async (result) => {
            const context = await self.textGenerator.contextManager.getContext(
              editor,
              true,
              result.path
            );
            self.tokensScope.showTokens(
              await self.tokensScope.estimate(context)
            );
          },
          "Choose a template"
        ).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },
  {
    id: "text-extractor-tool",
    name: "Text Extractor Tool",
    icon: "layout",
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      try {
        new TextExtractorTool(self.app, self).open();
      } catch (error) {
        self.handelError(error);
      }
    },
  },
  {
    id: "stop-stream",
    name: "Stop Stream",
    icon: "layout",
    async editorCallback(editor: Editor) {
      const self: TextGeneratorPlugin = this;
      if (!self.textGenerator.signalController?.signal.aborted) {
        self.textGenerator.endLoading();
      }
    },
  },

];

export default commands;

import { Command, Editor, Notice } from "obsidian";
import TextGeneratorPlugin from "../main";
import { ExampleModal } from "../models/model";
import { PackageManagerUI } from "../ui/package-manager/package-manager-ui";
import { SetMaxTokens } from "../ui/settings/components/set-max-tokens";
import { TextExtractorTool } from "../ui/text-extractor-tool";

import { SetLLM } from "../ui/settings/components/set-llm";
import { LLMProviderRegistery } from "../LLMProviders";

import debug from "debug";
const logger = debug("textgenerator:main");

export default class Commands {
  plugin: TextGeneratorPlugin;

  static commands: Command[] = [
    {
      id: "generate-text",
      name: "Generate Text!",
      icon: "GENERATE_ICON",
      hotkeys: [{ modifiers: ["Mod"], key: "j" }],
      async editorCallback(editor: Editor) {
        try {
          await this.plugin.textGenerator.generateInEditor({}, false, editor);
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "generate-text-with-metadata",
      name: "Generate Text (use Metadata))!",
      icon: "GENERATE_META_ICON",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "j" }],
      async editorCallback(editor: Editor) {
        try {
          await this.plugin.textGenerator.generateInEditor({}, true, editor);
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "insert-generated-text-From-template",
      name: "Templates: Generate & Insert",
      icon: "circle",
      //hotkeys: [{ modifiers: ["Mod"], key: "q"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              await this.plugin.textGenerator.generateFromTemplate(
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
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "generated-text-to-clipboard-From-template",
      name: "Templates: Generate & Copy To Clipboard ",
      icon: "circle",
      //hotkeys: [{ modifiers: ["Mod"], key: "q"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              await this.plugin.textGenerator.generateToClipboard(
                {},
                result.path,
                true,
                editor
              );
            },
            "Generate & Copy To Clipboard"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "create-generated-text-From-template",
      name: "Templates: Generate & Create Note",
      icon: "plus-circle",
      //hotkeys: [{ modifiers: ["Mod","Shift"], key: "q"}],
      async editorCallback(editor: Editor) {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              await self.plugin.textGenerator.generateFromTemplate(
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
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "search-results-batch-generate-from-template",
      name: "Templates (Batch): From Search Results",
      icon: "plus-circle",
      //hotkeys: [{ modifiers: ["Mod","Shift"], key: "q"}],
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              const files =
                await self.plugin.textGenerator.embeddingsScope.getSearchResults();

              if ((await files).length) {
                return self.plugin.handelError(
                  "You need at least one search result"
                );
              }

              await self.plugin.textGenerator.generateBatchFromTemplate(
                files,
                {},
                result.path,
                true
              );
            },
            "Generate and create multiple notes from template"
          ).open();
        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "insert-text-From-template",
      name: "Templates: Insert Template",
      icon: "square",
      //hotkeys: [{ modifiers: ['Alt'], key: "q"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              await this.plugin.textGenerator.generateFromTemplate(
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
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "create-text-From-template",
      name: "Templates: Insert & Create Note",
      icon: "plus-square",
      //hotkeys: [{ modifiers: ["Shift","Alt"], key: "q"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              await this.plugin.textGenerator.generateFromTemplate(
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
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "show-modal-From-template",
      name: "Show modal From Template",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              await this.plugin.textGenerator.tempalteToModal(
                {},
                result.path,
                editor
              );
            },
            "Choose a template"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "set_max_tokens",
      name: "Set max_tokens",
      icon: "separator-horizontal",
      //hotkeys: [{ modifiers: ["Alt"], key: "1" }],
      async editorCallback(editor: Editor) {
        new SetMaxTokens(
          this.plugin.app,
          this.plugin,
          this.plugin.settings.max_tokens.toString(),
          async (result: string) => {
            this.plugin.settings.max_tokens = parseInt(result);
            await this.plugin.saveSettings();
            new Notice(`Set Max Tokens to ${result}!`);
            this.plugin.updateStatusBar("");
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
        try {
          new SetLLM(
            this.plugin.app,
            this.plugin,
            async (selectedLLMName) => {
              console.log(selectedLLMName);
              if (!selectedLLMName) return;

              const llm = LLMProviderRegistery.get(selectedLLMName);
              if (llm) {
                this.plugin.settings.selectedProvider = selectedLLMName;
              }

              this.plugin.textGenerator.setup();
              await this.plugin.saveSettings();
            },
            "Choose a LLM"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "packageManager",
      name: "Template Packages Manager",
      icon: "boxes",
      //hotkeys: [{ modifiers: ["Alt"], key: "3" }],
      async editorCallback(editor: Editor) {
        new PackageManagerUI(
          this.plugin.app,
          this.plugin,
          async (result: string) => {}
        ).open();
      },
    },

    {
      id: "create-template",
      name: "Create a Template",
      icon: "plus",
      //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
      async editorCallback(editor: Editor) {
        try {
          await this.plugin.textGenerator.createTemplateFromEditor(editor);
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "get-title",
      name: "Generate a Title",
      icon: "heading",
      //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
      async editorCallback(editor: Editor) {
        try {
          const maxLength = 255;
          const prompt = `Generate a title for the current document (do not use * " \\ / < > : | ? .):
				${editor.getValue().trim().slice(0, maxLength)}
				`;
          const generatedTitle = await this.plugin.textGenerator.gen(
            prompt,
            {}
          );

          const sanitizedTitle = generatedTitle
            .replace(/[*\\"/<>:|?\.]/g, "")
            .replace(/^\n*/g, "");

          const activeFile = this.plugin.app.workspace.getActiveFile();
          if (!activeFile) return logger(`No active file was detected`);
          const renamedFilePath = activeFile.path.replace(
            activeFile.name,
            `${sanitizedTitle}.md`
          );
          await this.plugin.app.fileManager.renameFile(
            activeFile,
            renamedFilePath
          );
          logger(`Generated a title: ${sanitizedTitle}`);
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "auto-suggest",
      name: "Turn on or off the auto suggestion",
      icon: "heading",
      //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
      async editorCallback(editor: Editor) {
        this.plugin.settings.autoSuggestOptions.isEnabled =
          !this.plugin.settings.autoSuggestOptions.isEnabled;
        await this.plugin.saveSettings();
        this.plugin.AutoSuggestStatusBar();

        if (this.plugin.settings.autoSuggestOptions.isEnabled) {
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
        const context =
          await this.plugin.textGenerator.contextManager.getContext(
            editor,
            true,
            {
              estimatingMode: true,
            }
          );
        this.plugin.tokensScope.showTokens(
          await this.plugin.tokensScope.estimate(context)
        );
      },
    },

    {
      id: "calculate-tokens-for-template",
      name: "Estimate tokens for a Template",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async editorCallback(editor: Editor) {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              const context =
                await this.plugin.textGenerator.contextManager.getContext(
                  editor,
                  true,
                  result.path,
                  {
                    estimatingMode: true,
                  }
                );
              this.plugin.tokensScope.showTokens(
                await this.plugin.tokensScope.estimate(context)
              );
            },
            "Choose a template"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "text-extractor-tool",
      name: "Text Extractor Tool",
      icon: "layout",
      async editorCallback(editor: Editor) {
        try {
          new TextExtractorTool(this.plugin.app, this.plugin).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "stop-stream",
      name: "Stop Stream",
      icon: "layout",
      async editorCallback(editor: Editor) {
        if (!this.plugin.textGenerator.signalController?.signal.aborted) {
          this.plugin.textGenerator.endLoading();
        }
      },
    },

  ];

  commands: Command[] = Commands.commands.map((cmd) => ({
    ...cmd,
    editorCallback: cmd.editorCallback?.bind(this),
  }));

  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;
  }

  async addCommands() {
    // call the function before testing for onload document, just to make sure it is getting called event tho the document is already loaded
    const cmds = this.commands.filter(
      (cmd) =>
        this.plugin.settings.options[
          cmd.id as keyof typeof this.plugin.settings.options
        ] === true
    );

    const files = await this.plugin.getFilesOnLoad();
    const templates = this.plugin.textGenerator.getTemplates(
      // get files, it will be empty onLoad, that's why we are using this function
      files
    );
    console.log({ files, templates });

    this.plugin.textGenerator.contextManager.templatePaths = {};
    templates.forEach((template) => {
      if (template.id) {
        const ss = template.path.split("/");
        this.plugin.textGenerator.contextManager.templatePaths[
          ss[ss.length - 2] + "/" + template.id
        ] = template.path;
      }
    });

    console.log({
      templatePaths: this.plugin.textGenerator.contextManager.templatePaths,
    });

    const templatesWithCommands = templates.filter((t) => t?.commands);
    logger("Templates with commands ", { templatesWithCommands });

    templatesWithCommands.forEach((template) => {
      //
      template.commands?.forEach((command) => {
        logger("Tempate commands ", { template, command });
        const cmd: Command = {
          id: `${template.path.split("/").slice(-2, -1)[0]}-${command}-${
            template.id
          }`,
          name: `${template.id || template.name}: ${command.toUpperCase()}`,
          editorCallback: async (editor: Editor) => {
            try {
              switch (command) {
                case "generate":
                  await this.plugin.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    true
                  );
                  break;
                case "insert":
                  await this.plugin.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    true,
                    {},
                    true
                  );
                  break;
                case "generate&create":
                  await this.plugin.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    false
                  );
                  break;
                case "insert&create":
                  await this.plugin.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    false,
                    {},
                    true
                  );
                  break;
                case "modal":
                  await this.plugin.textGenerator.tempalteToModal(
                    {},
                    template.path,
                    editor
                  );
                  break;
                case "clipboard":
                  await this.plugin.textGenerator.generateToClipboard(
                    {},
                    template.path,
                    true,
                    editor
                  );
                  break;
                case "estimate":
                  {
                    const context =
                      await this.plugin.textGenerator.contextManager.getContext(
                        editor,
                        true,
                        template.path,
                        {
                          estimatingMode: true,
                        }
                      );
                    this.plugin.tokensScope.showTokens(
                      await this.plugin.tokensScope.estimate(context)
                    );
                  }
                  break;
                default:
                  console.error("command name not found");
                  break;
              }
            } catch (error) {
              this.plugin.handelError(error);
            }
          },
        };
        logger("command ", { cmd, template });
        cmds.push(cmd);
      });
    });

    cmds.forEach(async (command) => {
      this.plugin.addCommand({
        ...command,
        editorCallback: command.editorCallback?.bind(this),
        callback: command.callback?.bind(this),
      });
    });
  }
}

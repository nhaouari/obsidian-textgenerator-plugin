import { Command, Editor, Notice } from "obsidian";
import TextGeneratorPlugin from "../main";
import { ExampleModal } from "../models/model";
import { PackageManagerUI } from "../ui/package-manager/package-manager-ui";
import { SetMaxTokens } from "../ui/settings/components/set-max-tokens";
import { TextExtractorTool } from "../ui/text-extractor-tool";

import { SetLLM } from "../ui/settings/components/set-llm";
import { LLMProviderRegistery } from "../LLMProviders";

import debug from "debug";
import { VIEW_TOOL_ID } from "#/ui/tool";
import { VIEW_Playground_ID } from "#/ui/playground";
import ContentManagerCls from "#/content-manager";
const logger = debug("textgenerator:main");

export default class Commands {
  plugin: TextGeneratorPlugin;

  static commands: Command[] = [
    {
      id: "generate-text",
      name: "Generate Text!",
      icon: "GENERATE_ICON",
      hotkeys: [{ modifiers: ["Mod"], key: "j" }],
      async callback() {
        const self: Commands = this;
        try {
          const activeView = await self.getActiveView();
          const CM = ContentManagerCls.compile(activeView)
          await this.plugin.textGenerator.generateInEditor({}, false, CM);
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
      async callback() {
        const self: Commands = this;
        try {
          const activeView = await self.getActiveView();
          const CM = ContentManagerCls.compile(activeView)
          await this.plugin.textGenerator.generateInEditor({}, true, CM);
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
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              if (!result.path) throw "Nothing was selected";

              const self: Commands = this;
              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await self.plugin.textGenerator.generateFromTemplate({
                  params: {},
                  templatePath: result.path,
                  filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                  insertMetadata: true,
                  editor: CM,
                  activeFile: true,
                });
              } catch (error) {
                this.plugin.handelError(error);
              }
            },
            "Generate and Insert Template In The Active Note"
          ).open();
        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "generated-text-to-clipboard-From-template",
      name: "Templates: Generate & Copy To Clipboard ",
      icon: "circle",
      //hotkeys: [{ modifiers: ["Mod"], key: "q"}],
      async callback() {
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              const self: Commands = this;
              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await this.plugin.textGenerator.generateToClipboard(
                  {},
                  result.path,
                  true,
                  CM
                );
              } catch (error: any) {
                self.plugin.handelError(error);
              }
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
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              if (!result.path) throw "Nothing was selected";

              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await self.plugin.textGenerator.generateFromTemplate({
                  params: {},
                  templatePath: result.path,
                  filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                  insertMetadata: true,
                  editor: CM,
                  activeFile: false,
                });
              } catch (error: any) {
                self.plugin.handelError(error);
              }

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
              if (!result.path) throw "Nothing was selected";
              const files =
                await self.plugin.textGenerator.embeddingsScope.getSearchResults();

              if (!files.length)
                return self.plugin.handelError(
                  "You need at least one search result"
                );

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
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              if (!result.path) throw "Nothing was selected";

              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await self.plugin.textGenerator.generateFromTemplate({
                  params: {},
                  templatePath: result.path,
                  filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                  insertMetadata: true,
                  editor: CM,
                  activeFile: true,
                });
              } catch (error: any) {
                self.plugin.handelError(error);
              }


            },
            "Insert Template In The Active Note"
          ).open();
        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "create-text-From-template",
      name: "Templates: Insert & Create Note",
      icon: "plus-square",
      //hotkeys: [{ modifiers: ["Shift","Alt"], key: "q"}],
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              if (!result.path) throw "Nothing was selected";


              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await self.plugin.textGenerator.generateFromTemplate({
                  params: {},
                  templatePath: result.path,
                  filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                  insertMetadata: true,
                  editor: CM,
                  activeFile: false,
                  insertMode: true,
                });

              } catch (error) {
                self.plugin.handelError(error);
              }
            },
            "Create a New Note From Template"
          ).open();
        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "show-modal-From-template",
      name: "Show modal From Template",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {

              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                await self.plugin.textGenerator.tempalteToModal({
                  params: {},
                  templatePath: result.path,
                  editor: CM,
                  filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                });

              } catch (error) {
                self.plugin.handelError(error);
              }

            },
            "Choose a template"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "open-template-as-tool",
      name: "Open Template as Tool",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            this.plugin.app,
            this.plugin,
            async (result) => {
              self.plugin.activateView(VIEW_TOOL_ID, {
                templatePath: result.path,
                title: result.name,
                editor: self.plugin.app.workspace.activeEditor?.editor,
                openInPopout: true,
              });
            },
            "Choose a template"
          ).open();
        } catch (error) {
          this.plugin.handelError(error);
        }
      },
    },

    {
      id: "open-playground",
      name: "Open Template Playground",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async callback() {
        const self: Commands = this;
        try {
          self.plugin.activateView(VIEW_Playground_ID, {
            editor: self.plugin.app.workspace.activeEditor?.editor,
            openInPopout: false,
          });
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
      async callback() {
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
      async callback() {
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
      async callback() {
        new PackageManagerUI(
          this.plugin.app,
          this.plugin,
          async (result: string) => { }
        ).open();
      },
    },

    {
      id: "create-template",
      name: "Create a Template",
      icon: "plus",
      //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
      async callback() {
        const self: Commands = this;

        try {
          const activeView = await self.getActiveView();
          const CM = ContentManagerCls.compile(activeView);

          await self.plugin.textGenerator.createTemplateFromEditor(CM);
        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "get-title",
      name: "Generate a Title",
      icon: "heading",
      //hotkeys: [{ modifiers: ["Alt"], key: "c"}],
      async editorCallback(editor, mx) {
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

          if (!mx.file) return logger(`No active file was detected`);
          const renamedFilePath = mx.file.path.replace(
            mx.file.name,
            `${sanitizedTitle}.md`
          );
          await this.plugin.app.fileManager.renameFile(
            mx.file,
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
      async callback() {
        const self: Commands = this;

        try {
          const activeView = await self.getActiveView();
          const CM = ContentManagerCls.compile(activeView);

          const context =
            await self.plugin.textGenerator.contextManager.getContext({
              editor: CM,
              filePath: self.plugin.app.workspace.activeEditor?.file?.path,
              insertMetadata: true,
              addtionalOpts: {
                estimatingMode: true,
              },
            });
          self.plugin.tokensScope.showTokens(
            await self.plugin.tokensScope.estimate(context)
          );

        } catch (error) {
          self.plugin.handelError(error);
        }
      },
    },

    {
      id: "calculate-tokens-for-template",
      name: "Estimate tokens for a Template",
      icon: "layout",
      //hotkeys: [{ modifiers: ["Alt"], key: "4"}],
      async callback() {
        const self: Commands = this;
        try {
          new ExampleModal(
            self.plugin.app,
            self.plugin,
            async (result) => {
              try {
                const activeView = await self.getActiveView();
                const CM = ContentManagerCls.compile(activeView);

                const context =
                  await self.plugin.textGenerator.contextManager.getContext({
                    editor: CM,
                    filePath: self.plugin.app.workspace.activeEditor?.file?.path,
                    insertMetadata: true,
                    templatePath: result.path,
                    addtionalOpts: {
                      estimatingMode: true,
                    },
                  });

                self.plugin.tokensScope.showTokens(
                  await self.plugin.tokensScope.estimate(context)
                );
              } catch (error) {
                self.plugin.handelError(error);
              }
            },
            "Choose a template"
          ).open();
        } catch (error) {
          self.plugin.handelError(error);
        }

      }
    },

    {
      id: "text-extractor-tool",
      name: "Text Extractor Tool",
      icon: "layout",
      async callback() {
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
      async callback() {
        if (!this.plugin.textGenerator.signalController?.signal.aborted) {
          this.plugin.textGenerator.endLoading();
        }
      },
    },
    {
      id: "reload",
      name: "reload Plugin",
      icon: "layout",
      async callback() {
        const self: TextGeneratorPlugin = this;

        self.reload();
      },
    },
  ];

  commands: Command[] = Commands.commands.map((cmd) => ({
    ...cmd,
    editorCallback: cmd.editorCallback?.bind(this),
    callback: cmd.callback?.bind(this),
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

    const templates = await this.plugin.textGenerator.updateTemplatesCache();

    const templatesWithCommands = templates.filter((t) => t?.commands);
    logger("Templates with commands ", { templatesWithCommands });

    const ToolsOnlyCallBack = ['tool']

    templatesWithCommands.forEach((template) => {
      //
      template.commands?.forEach((command) => {
        logger("Tempate commands ", { template, command });
        const cmd: Command = {
          id: `${template.path.split("/").slice(-2, -1)[0]}-${command}-${template.id
            }`,
          name: `${template.id || template.name}: ${command.toUpperCase()}`,
          editorCallback: !ToolsOnlyCallBack.contains(command)
            ? async (editor, mx) => {
              const self: Commands = this;

              const activeView = await self.getActiveView();

              const CM = ContentManagerCls.compile(activeView)

              try {
                switch (command) {
                  case "generate":
                    await self.plugin.textGenerator.generateFromTemplate({
                      params: {},
                      templatePath: template.path,
                      insertMetadata: true,
                      editor: CM,
                      activeFile: true,
                    });
                    break;
                  case "insert":
                    await self.plugin.textGenerator.generateFromTemplate({
                      params: {},
                      templatePath: template.path,
                      insertMetadata: true,
                      editor: CM,
                      activeFile: true,
                      insertMode: true,
                    });
                    break;
                  case "generate&create":
                    await self.plugin.textGenerator.generateFromTemplate({
                      params: {},
                      templatePath: template.path,
                      insertMetadata: true,
                      editor: CM,
                      activeFile: false,
                    });
                    break;
                  case "insert&create":
                    await self.plugin.textGenerator.generateFromTemplate({
                      params: {},
                      templatePath: template.path,
                      insertMetadata: true,
                      editor: CM,
                      activeFile: false,
                      insertMode: true,
                    });
                    break;
                  case "modal":
                    await self.plugin.textGenerator.tempalteToModal({
                      params: {},
                      templatePath: template.path,
                      editor: CM,
                      filePath: mx.file?.path,
                    });
                    break;
                  case "clipboard":
                    await self.plugin.textGenerator.generateToClipboard(
                      {},
                      template.path,
                      true,
                      CM
                    );
                    break;
                  case "estimate":
                    {
                      const context =
                        await this.plugin.textGenerator.contextManager.getContext(
                          {
                            editor: CM,
                            filePath: mx.file?.path,
                            insertMetadata: true,
                            templatePath: template.path,
                            addtionalOpts: {
                              estimatingMode: true,
                            },
                          }
                        );
                      this.plugin.tokensScope.showTokens(
                        await this.plugin.tokensScope.estimate(context)
                      );
                    }
                    break;
                  default:
                    console.error("command name not found", command);
                    break;
                }
              } catch (error) {
                this.plugin.handelError(error);
              }
            }
            : undefined,

          callback: async () => {
            const self: Commands = this;
            try {
              switch (command) {
                case "tool":
                  self.plugin.activateView(VIEW_TOOL_ID, {
                    templatePath: template.path,
                    title: template.id || template.name,
                    openInPopout: true,
                    editor: self.plugin.app.workspace.activeEditor?.editor,
                  });
                  break;

                default:
                  console.error(
                    "command does not work outside of an editor",
                    command
                  );
                  break;
              }
            } catch (error) {
              self.plugin.handelError(error);
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

  async getActiveView() {
    if (!this.plugin.app.workspace.activeLeaf) throw "activeLeaf not found";
    const activeView = this.plugin.app.workspace.activeLeaf.view;

    if (!activeView) {
      throw 'No active view to trigger the command.'
    }
    return activeView;
  }
}

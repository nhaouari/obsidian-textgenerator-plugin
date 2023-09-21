// import { TextExtractorTool } from "./ui/text-extractor-tool";
// import Tesseract from "tesseract.js";
import {
  addIcon,
  Notice,
  Plugin,
  MarkdownView,
  Editor,
  MarkdownRenderer,
  MarkdownPostProcessorContext,
  getIcon,
  Command,
  TFile,
} from "obsidian";
import { TextGeneratorSettings } from "./types";
import { containsInvalidCharacter, numberToKFormat } from "./utils";
import { GENERATE_ICON, GENERATE_META_ICON } from "./constants";
import TextGeneratorSettingTab from "./ui/settings/settings-page";
import { SetMaxTokens } from "./ui/settings/components/set-max-tokens";
import TextGenerator from "./text-generator";
import PackageManager from "./ui/package-manager/package-manager";
import { PackageManagerUI } from "./ui/package-manager/package-manager-ui";
import { EditorView } from "@codemirror/view";
import { spinnersPlugin, SpinnersPlugin } from "./cm/plugin";
import PrettyError from "pretty-error";
import ansiToHtml from "ansi-to-html";
import { AutoSuggest } from "./auto-suggest";
import { ModelSuggest } from "./modal-suggest";
import debug from "debug";

import DEFAULT_SETTINGS from "./default-settings";
import commands from "./commands";

import TokensScope from "./scope/tokens";

import "./LLMProviders";
import get from "lodash.get";
import set from "lodash.set";

const { safeStorage } = require("electron").remote;
const logger = debug("textgenerator:main");

export default class TextGeneratorPlugin extends Plugin {
  settings: TextGeneratorSettings;
  textGenerator: TextGenerator;
  tokensScope: TokensScope;
  packageManager: PackageManager;
  processing: boolean;
  defaultSettings: TextGeneratorSettings;
  textGeneratorIconItem: HTMLElement;
  autoSuggestItem: HTMLElement;
  statusBarTokens: HTMLElement;
  notice: Notice;
  commands: typeof commands;
  statusBarItemEl: HTMLElement;
  spinner?: SpinnersPlugin;

  updateStatusBar(text: string, processing = false) {
    let text2 = "";
    if (text.length > 0) {
      text2 = `: ${text}`;
    }
    if (this.settings.showStatusBar) {
      this.textGeneratorIconItem.innerHTML = "";
      this.statusBarTokens.innerHTML = "";

      if (processing) {
        const span = document.createElement("span");
        span.addClasses(["loading", "dots"]);
        span.setAttribute("id", "tg-loading");
        span.style.width = "16px";
        span.style.alignContent = "center";
        this.textGeneratorIconItem.append(span);
        this.textGeneratorIconItem.title = "Generating Text...";
        if (this.notice) this.notice.hide();
        this.notice = new Notice(`Processing...`, 100000);
      } else {
        const icon = getIcon("bot");
        if (icon) this.textGeneratorIconItem.append(icon);
        this.textGeneratorIconItem.title = "Text Generator";
        this.textGeneratorIconItem.addClass("mod-clickable");
        this.textGeneratorIconItem.addEventListener("click", async () => {
          // @ts-ignore
          await this.app.setting.open();
          // @ts-ignore
          await this.app.setting
            .openTabById("obsidian-textgenerator-plugin")
            .display();
        });

        if (this.notice) {
          this.notice.hide();
          if (text.length > 0) {
            new Notice(text);
          }
        }
      }
      this.statusBarTokens.addClass("mod-clickable");
      const statusBarTokens = this.statusBarTokens.createEl("span");
      statusBarTokens.textContent = `${numberToKFormat(
        this.settings.max_tokens
      )}`;
      statusBarTokens.title = "Max Tokens for Output";
      statusBarTokens.addClass("mod-clickable");
      statusBarTokens.addEventListener("click", () => {
        new SetMaxTokens(
          this.app,
          this,
          this.settings.max_tokens.toString(),
          async (result: string) => {
            this.settings.max_tokens = parseInt(result);
            await this.saveSettings();
            new Notice(`Set Max Tokens to ${result}!`);
            this.updateStatusBar("");
          }
        ).open();
      });
    }
  }

  updateSpinnerPos() {
    if (!this.spinner) return;
    const activeView = this.getActiveView();
    if (!activeView) return;
    const editor = activeView.editor;
    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;

    const pos = editor.getCursor("to");

    this.spinner.updatePos(editor.posToOffset(pos), editorView);

    this.app.workspace.updateOptions();
  }

  startProcessing(showSpinner = true) {
    this.updateStatusBar(``, true);
    this.processing = true;
    const activeView = this.getActiveView();
    if (!activeView || !showSpinner) return;
    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;
    this.spinner = editorView.plugin(spinnersPlugin) || undefined;

    this.updateSpinnerPos();
  }

  endProcessing(showSpinner = true) {
    this.updateStatusBar(``);
    this.processing = false;
    const activeView = this.getActiveView();
    if (activeView && showSpinner && this.spinner) {
      const editor = activeView.editor;
      // @ts-expect-error, not typed
      const editorView = activeView.editor.cm as EditorView;

      this.spinner?.remove(
        editor.posToOffset(editor.getCursor("to")),
        editorView
      );
    }
  }

  formatError(error: any) {
    const pe = new PrettyError();
    const convert = new ansiToHtml();
    let formattedError = convert.toHtml(pe.render(error));
    const lines = formattedError.split("\n");
    const formattedLines = lines.map((line) => `> ${line}`);
    formattedError = `> [!failure]- Failure \n${formattedLines.join("\n")} \n`;
    const errorContainer = document.createElement("div");
    errorContainer.classList.add("error-container");
    errorContainer.innerHTML = formattedError;

    return errorContainer;
  }

  async handelError(error: any) {
    if (error.message) {
      new Notice("🔴 " + error.message);
    } else {
      new Notice(
        "🔴 Error: Text Generator Plugin: An error has occurred. Please check the console by pressing CTRL+SHIFT+I or turn on display errors in the editor within the settings for more information."
      );
    }

    console.error(error);
    try {
      //this.updateStatusBar(`Error check console`);
      const activeView = this.getActiveView();
      if (activeView && this.settings.displayErrorInEditor) {
        // @ts-ignore
        activeView.editor.cm.contentDOM.appendChild(this.formatError(error));
      }
    } catch (err2: any) {
      // if it can't add error to activeView, then it doesn't matter, it shouldn't show a second error
      logger("handelError", err2);
    }

    setTimeout(() => this.updateStatusBar(``), 5000);
  }

  getActiveView() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      new Notice("The file type should be Markdown!");
      return null;
    }

    return activeView;
  }

  AutoSuggestStatusBar() {
    this.autoSuggestItem.innerHTML = "";
    if (!this.settings.autoSuggestOptions.showStatus) return;

    const languageIcon = this.settings.autoSuggestOptions.isEnabled
      ? getIcon("zap")
      : getIcon("zap-off");

    if (languageIcon) this.autoSuggestItem.append(languageIcon);

    this.autoSuggestItem.title =
      "Text Generator Enable or disable Auto-suggest";

    this.autoSuggestItem.addClass("mod-clickable");
  }

  AddAutoSuggestStatusBar() {
    this.AutoSuggestStatusBar();

    this.autoSuggestItem.addEventListener("click", (event) => {
      this.settings.autoSuggestOptions.isEnabled =
        !this.settings.autoSuggestOptions.isEnabled;
      this.saveSettings();
      this.AutoSuggestStatusBar();
      if (this.settings.autoSuggestOptions.isEnabled) {
        new Notice(`Auto Suggestion is on!`);
      } else {
        new Notice(`Auto Suggestion is off!`);
      }
    });
  }

  async onload() {
    logger("loading textGenerator plugin");

    addIcon("GENERATE_ICON", GENERATE_ICON);
    addIcon("GENERATE_META_ICON", GENERATE_META_ICON);

    this.defaultSettings = DEFAULT_SETTINGS;
    await this.loadSettings();

    // This adds a settings tab so the user can configure various aspects of the plugin
    const settingTab = new TextGeneratorSettingTab(this.app, this);
    this.addSettingTab(settingTab);
    this.textGenerator = new TextGenerator(this.app, this);
    this.packageManager = new PackageManager(this.app, this);

    this.tokensScope = new TokensScope(this);
    await this.tokensScope.setup();

    this.registerEditorExtension(spinnersPlugin);
    this.app.workspace.updateOptions();

    this.textGeneratorIconItem = this.addStatusBarItem();
    this.statusBarTokens = this.addStatusBarItem();
    this.autoSuggestItem = this.addStatusBarItem();
    this.statusBarItemEl = this.addStatusBarItem();

    this.updateStatusBar(``);
    if (this.settings.autoSuggestOptions.showStatus) {
      this.AddAutoSuggestStatusBar();
    }

    const blockTgHandler = async (
      source: string,
      container: HTMLElement,
      { sourcePath: path }: MarkdownPostProcessorContext
    ) => {
      setTimeout(async () => {
        try {
          const { inputTemplate, outputTemplate, inputContent } =
            this.textGenerator.contextManager.splitTemplate(source);

          const activeView = this.getActiveView();
          const context = {
            ...(activeView
              ? await this.textGenerator.contextManager.getTemplateContext(
                  activeView.editor,
                  "",
                  inputContent
                )
              : {}),
          };

          const markdown = inputTemplate(context);

          await MarkdownRenderer.renderMarkdown(
            markdown,
            container,
            path,
            // @ts-ignore
            undefined
          );
          this.addTGMenu(container, markdown, source, outputTemplate);
        } catch (e) {
          console.warn(e);
        }
      }, 100);
    };

    this.commands = commands.map((command) => ({
      ...command,
      editorCallback: command.editorCallback?.bind(this),
    }));

    this.registerMarkdownCodeBlockProcessor("tg", async (source, el, ctx) =>
      blockTgHandler(source, el, ctx)
    );
    this.registerEditorSuggest(new AutoSuggest(this.app, this));
    if (this.settings.options["modal-suggest"]) {
      this.registerEditorSuggest(new ModelSuggest(this.app, this) as any);
    }

    // This creates an icon in the left ribbon.
    this.addRibbonIcon(
      "GENERATE_ICON",
      "Generate Text!",
      async (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        const activeFile = this.app.workspace.getActiveFile();
        const activeView = this.getActiveView();
        if (activeView !== null) {
          const editor = activeView.editor;
          try {
            await this.textGenerator.generateInEditor({}, false, editor);
          } catch (error) {
            this.handelError(error);
          }
        }
      }
    );


    this.addRibbonIcon(
      "boxes",
      "Text Generator: Templates Packages Manager",
      async (evt: MouseEvent) => {
        new PackageManagerUI(
          this.app,
          this,
          async (result: string) => {}
        ).open();
      }
    );

    /*const ribbonIconEl3 = this.addRibbonIcon(
			"square",
			"Download webpage as markdown",
			async (evt: MouseEvent) => {
				console.log(await navigator.clipboard.readText());
			}
		);
		*/

    // registers
    await this.addCommands();

    await this.packageManager.load();
  }

  async loadSettings() {
    const loadedSettings = await this.loadData();

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
    };

    this.settings.LLMProviderOptions ??= {};
    this.settings.LLMProviderOptionsKeysHashed ??= {};

    this.loadApikeys();
  }

  async onunload() {
  }

  async activateView(id: string) {
    this.app.workspace.detachLeavesOfType(id);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: id,
      active: true,
    });

    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(id)[0]);
  }

  async saveSettings() {
    await this.saveData(
      this.removeApikeys(this.settings as typeof this.settings)
    );
  }

  getFilesOnLoad(): Promise<TFile[]> {
    return new Promise(async (resolve, reject) => {
      let testFiles = app.vault.getFiles();
      if (testFiles.length === 0) {
        let retryTimes = 30;
        const timer = setInterval(() => {
          testFiles = app.vault.getFiles();
          retryTimes--;

          if (retryTimes <= 0) {
            clearInterval(timer);
            reject("Couldn't retrive files");
          }

          if (testFiles.length > 0) {
            clearInterval(timer);
            resolve(testFiles);
          }
        }, 3 * 1000);
      } else resolve(testFiles);
    });
  }

  async addCommands() {
    // call the function before testing for onload document, just to make sure it is getting called event tho the document is already loaded
    const cmds = this.commands.filter(
      (cmd) =>
        this.settings.options[cmd.id as keyof typeof this.settings.options] ===
        true
    );

    const templates = this.textGenerator.getTemplates(
      // get files, it will be empty onLoad, that's why we are using this function
      await this.getFilesOnLoad()
    );

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
                  await this.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    true
                  );
                  break;
                case "insert":
                  await this.textGenerator.generateFromTemplate(
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
                  await this.textGenerator.generateFromTemplate(
                    {},
                    template.path,
                    true,
                    editor,
                    false
                  );
                  break;
                case "insert&create":
                  await this.textGenerator.generateFromTemplate(
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
                  await this.textGenerator.tempalteToModal(
                    {},
                    template.path,
                    editor
                  );
                  break;
                case "clipboard":
                  await this.textGenerator.generateToClipboard(
                    {},
                    template.path,
                    true,
                    editor
                  );
                  break;
                case "estimate":
                  {
                    const context =
                      await this.textGenerator.contextManager.getContext(
                        editor,
                        true,
                        template.path
                      );
                    this.tokensScope.showTokens(
                      await this.tokensScope.estimate(context)
                    );
                  }
                  break;
                default:
                  console.error("command name not found");
                  break;
              }
            } catch (error) {
              this.handelError(error);
            }
          },
        };
        logger("command ", { cmd, template });
        cmds.push(cmd);
      });
    });

    cmds.forEach((command) => {
      this.addCommand(command);
    });
  }

  createRunButton(label: string, svg: string) {
    const button = document.createElement("div");
    button.classList.add("clickable-icon");
    button.setAttribute("aria-label", label);
    //aria-label-position="right"
    button.innerHTML = svg;

    return button;
  }

  addTGMenu(
    el: HTMLElement,
    markdown: string,
    source: string,
    outputTemplate: any
  ) {
    const div = document.createElement("div");
    div.classList.add("tgmenu", "flex", "justify-end");
    const generateSVG = `<svg viewBox="0 0 100 100" class="svg-icon GENERATE_ICON"><defs><style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:4px;}</style></defs><g id="Layer_2" data-name="Layer 2"><g id="VECTOR"><rect class="cls-1" x="74.98" y="21.55" width="18.9" height="37.59"></rect><path class="cls-1" d="M38.44,27.66a8,8,0,0,0-8.26,1.89L24.8,34.86a25.44,25.44,0,0,0-6,9.3L14.14,56.83C11.33,64.7,18.53,67.3,21,60.9" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="74.98 25.58 56.61 18.72 46.72 15.45"></polyline><path class="cls-1" d="M55.45,46.06,42.11,49.43,22.76,50.61c-8.27,1.3-5.51,11.67,4.88,12.8L46.5,65.78,53,68.4a23.65,23.65,0,0,0,17.9,0l6-2.46" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M37.07,64.58v5.91A3.49,3.49,0,0,1,33.65,74h0a3.49,3.49,0,0,1-3.45-3.52V64.58" transform="translate(-1.93 -15.75)"></path><path class="cls-1" d="M48,66.58v5.68a3.4,3.4,0,0,1-3.34,3.46h0a3.4,3.4,0,0,1-3.34-3.45h0V65.58" transform="translate(-1.93 -15.75)"></path><polyline class="cls-1" points="28.75 48.05 22.66 59.3 13.83 65.61 14.41 54.5 19.11 45.17"></polyline><polyline class="cls-1" points="25.17 34.59 43.75 0.25 52.01 5.04 36.39 33.91"></polyline><line class="cls-1" x1="0.25" y1="66.92" x2="13.83" y2="66.92"></line></g></g></svg>`;

    const button = this.createRunButton("Generate Text", generateSVG);
    button.addEventListener("click", async () => {
      const activeView = this.getActiveView();
      if (activeView)
        await this.textGenerator.generatePrompt(
          markdown,
          false,
          activeView?.editor,
          outputTemplate
        );

      logger(`addTGMenu Generate Text`, {
        markdown: markdown,
        source: source,
      });
    });

    const createTemplateSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const buttonMakeTemplate = this.createRunButton(
      "Create a new Template",
      createTemplateSVG
    );
    buttonMakeTemplate.addEventListener("click", async () => {
      await this.textGenerator.createTemplate(source, "newTemplate");
      logger(`addTGMenu MakeTemplate`, {
        markdown: markdown,
        source: source,
      });
    });

    div.appendChild(buttonMakeTemplate);
    div.appendChild(button);
    el.parentElement?.appendChild(div);
  }

  loadApikeys() {
    // check if user have LLMProviderOptionsKeysHashed object (upgrading from older version)
    this.settings.LLMProviderOptionsKeysHashed ??= {};

    this.settings.api_key = this.getDecryptedKey(
      this.settings.api_key_encrypted,
      this.settings.api_key
    );
    Object.entries(this.settings?.LLMProviderOptionsKeysHashed).forEach(
      ([pth, hashed]) => {
        set(
          this.settings.LLMProviderOptions,
          pth,
          this.getDecryptedKey(
            hashed,
            get(this.settings.LLMProviderOptions, pth) as any
          )
        );
      }
    );
  }

  encryptAllKeys() {
    // check if user have LLMProviderOptionsKeysHashed object (upgrading from older version)
    this.settings.LLMProviderOptionsKeysHashed ??= {};

    const keyList: string[] = [];

    this.settings.api_key_encrypted = this.getEncryptedKey(
      this.settings.api_key
    );

    // get all secret keys
    Object.entries(this.settings?.LLMProviderOptions).forEach(([key1, l1]) => {
      if (typeof l1 != "object") return;
      Object.entries(l1).forEach(([key2, l2]) => {
        if (key2.toLowerCase().includes("key") && typeof l2 == "string") {
          keyList.push(`${key1}.${key2}`);
        }
      });
    });

    keyList.forEach((pth) => {
      const keyval = get(
        this.settings?.LLMProviderOptions,
        pth
      ) as never as string;

      if (!keyval) return;

      const encrypted = this.getEncryptedKey(keyval);
      this.settings.LLMProviderOptionsKeysHashed[pth] = encrypted;
    });
  }

  removeApikeys(settings: typeof this.settings): typeof this.settings {
    const LLMProviderOptions = JSON.parse(
      JSON.stringify(settings?.LLMProviderOptions)
    ) as typeof this.settings.LLMProviderOptions;

    // get all secret keys
    Object.entries(LLMProviderOptions).forEach(([key1, l1]) => {
      if (typeof l1 != "object") return;
      Object.entries(l1).forEach(([key2, l2]) => {
        if (key2.toLowerCase().includes("key") && typeof l2 == "string") {
          set(LLMProviderOptions, `${key1}.${key2}`, "");
        }
      });
    });

    return {
      ...settings,
      api_key: "",
      LLMProviderOptions,
    };
  }

  getDecryptedKey(keyBuffer: Buffer | undefined, oldVal: string) {
    // @ts-ignore
    const buff = Buffer.from(keyBuffer?.data || []);
    const str = (buff || Buffer.from("", "utf8")).toString("utf8");

    try {
      //  -- incase of old version < 0.3.20, first run.
      // if (safeStorage?.isEncryptionAvailable() && !str.length && oldVal.length) {
      // 	return this.setApiKey(oldVal)
      // }
      //  --

      if (
        !safeStorage?.isEncryptionAvailable() ||
        !str.length ||
        !this.settings.encrypt_keys
      ) {
        return containsInvalidCharacter(str) ? "**FAILED TO DECRYPT**" : str;
      }

      const decrypted = safeStorage.decryptString(buff) as string;
      return containsInvalidCharacter(decrypted)
        ? "**FAILED TO DECRYPT KEYS**"
        : decrypted;
    } catch (err: any) {
      console.log("error happened", err, keyBuffer);
      return "";
    }
  }

  getEncryptedKey(apiKey: string) {
    if (!safeStorage?.isEncryptionAvailable() || !this.settings.encrypt_keys) {
      return Buffer.from(apiKey, "utf8");
    }

    return safeStorage.encryptString(apiKey) as Buffer;
  }

  resetSettingsToDefault() {
    this.settings = DEFAULT_SETTINGS;
    this.saveSettings();
  }
}

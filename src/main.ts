// import { TextExtractorTool } from "./ui/text-extractor-tool";
// import Tesseract from "tesseract.js";
import {
  addIcon,
  Notice,
  Plugin,
  MarkdownView,
  getIcon,
  TFile,
  Platform,
  EditorPosition,
} from "obsidian";
import type { TextGeneratorSettings } from "./types";
import { containsInvalidCharacter, numberToKFormat } from "./utils";
import {
  DecryptKeyPrefix,
  GENERATE_ICON,
  GENERATE_META_ICON,
} from "./constants";
import TextGeneratorSettingTab from "./ui/settings/settings-page";
import { SetMaxTokens } from "./ui/settings/components/set-max-tokens";
import TextGenerator from "./services/text-generator";
import PackageManager from "./ui/package-manager/package-manager";
import { PackageManagerUI } from "./ui/package-manager/package-manager-ui";
import { EditorView } from "@codemirror/view";
import { spinnersPlugin, SpinnersPlugin } from "./cm/plugin";
import PrettyError from "pretty-error";
import ansiToHtml from "ansi-to-html";
import { AutoSuggest } from "./services/auto-suggest";
import { SlashSuggest } from "./services/slash-suggest";
import debug from "debug";

import DEFAULT_SETTINGS from "./default-settings";
import Commands from "./scope/commands";

import TokensScope from "./scope/tokens";

import "./LLMProviders";
import get from "lodash.get";
import set from "lodash.set";
import { ExampleModal } from "./models/model";
import { ToolView, VIEW_TOOL_ID } from "./ui/tool";
import { randomUUID } from "crypto";
import VersionManager from "./scope/versionManager";

import { registerAPI } from "@vanakat/plugin-api";
import { PlaygroundView, VIEW_Playground_ID } from "./ui/playground";
import ContentManagerCls from "./scope/content-manager";
import ContextManager from "./scope/context-manager";
import TGBlock from "./services/tgBlock";

// @ts-ignore
let safeStorage: Electron.SafeStorage;

if (Platform.isDesktop) {
  // @ts-ignore
  safeStorage = require("electron")?.remote?.safeStorage;
}

const logger = debug("textgenerator:main");

export default class TextGeneratorPlugin extends Plugin {
  settings: TextGeneratorSettings;
  textGenerator: TextGenerator;
  packageManager: PackageManager;
  versionManager: VersionManager;
  contextManager: ContextManager;
  contentManager: typeof ContentManagerCls = ContentManagerCls;
  tokensScope: TokensScope;
  autoSuggest?: AutoSuggest;
  processing: boolean;
  defaultSettings: TextGeneratorSettings;
  textGeneratorIconItem: HTMLElement;

  statusBarTokens: HTMLElement;
  notice: Notice;
  commands: Commands;
  statusBarItemEl: HTMLElement;
  spinner?: SpinnersPlugin;
  temp: Record<string, any> = {};

  async onload() {
    try {
      logger("loading textGenerator plugin");
      addIcon("GENERATE_ICON", GENERATE_ICON);
      addIcon("GENERATE_META_ICON", GENERATE_META_ICON);

      this.defaultSettings = DEFAULT_SETTINGS;
      await this.loadSettings();

      // register managers
      this.versionManager = new VersionManager(this);
      await this.versionManager.load();

      this.contextManager = new ContextManager(app, this);
      this.packageManager = new PackageManager(this.app, this);

      // Register Services
      // text generator
      this.textGenerator = new TextGenerator(this.app, this);
      await this.textGenerator.load();

      // auto suggest
      if (this.settings.autoSuggestOptions?.isEnabled)
        this.autoSuggest = new AutoSuggest(this.app, this);


      // modal suggest
      if (this.settings.slashSuggestOptions?.isEnabled) {
        this.registerEditorSuggest(new SlashSuggest(this.app, this));
      }


      // This adds a settings tab so the user can configure various aspects of the plugin
      this.addSettingTab(new TextGeneratorSettingTab(this.app, this));

      // register scopes
      this.commands = new Commands(this);
      this.tokensScope = new TokensScope(this);
      await this.tokensScope.setup();

      // add loading spinner
      this.registerEditorExtension(spinnersPlugin);

      this.app.workspace.updateOptions();

      // add status bar items
      this.textGeneratorIconItem = this.addStatusBarItem();
      this.statusBarTokens = this.addStatusBarItem();
      this.statusBarItemEl = this.addStatusBarItem();

      this.updateStatusBar(``);

      if (this.settings.autoSuggestOptions.showStatus)
        this.autoSuggest?.AddStatusBar();


      // registering different views
      // Playground view
      this.registerView(
        VIEW_Playground_ID,
        (leaf) => new PlaygroundView(leaf, this)
      );

      // "open template as tool" view
      this.registerView(VIEW_TOOL_ID, (leaf) => new ToolView(leaf, this));

      // register events such as right click
      if (this.settings.options["generate-in-right-click-menu"])
        this.registerEvent(
          this.app.workspace.on(
            "editor-menu",
            async (menu) => {
              menu.addItem((item) => {
                item.setIcon("GENERATE_META_ICON");
                item.setTitle("Generate");
                item.onClick(async () => {
                  try {
                    if (this.processing) return this.textGenerator.signalController?.abort();
                    const activeView = await this.getActiveView();
                    const CM = ContentManagerCls.compile(activeView, this)
                    await this.textGenerator.generateInEditor({}, false, CM);
                  } catch (error) {
                    this.handelError(error);
                  }
                });
              });
            }
          )
        );

      if (this.settings.options["batch-generate-in-right-click-files-menu"])
        this.registerEvent(
          this.app.workspace.on(
            "files-menu",
            async (menu, files, source, leaf) => {
              menu.addItem((item) => {
                item.setIcon("GENERATE_META_ICON");
                item.setTitle("Generate");
                item.onClick(() => {
                  try {
                    new ExampleModal(
                      this.app,
                      this,
                      async (result) => {
                        if (!result.path)
                          return this.handelError("couldn't find path");
                        await this.textGenerator.generateBatchFromTemplate(
                          files.filter(
                            // @ts-ignore
                            (f) => !f.children && f.path.endsWith(".md")
                          ) as TFile[],
                          {},
                          result.path,
                          true
                        );
                      },
                      "Generate and Create a New Note From Template"
                    ).open();
                  } catch (error) {
                    this.handelError(error);
                  }
                });
              });
            }
          )
        );

      // tg codeblock
      if (this.settings.options["tg-block-processor"]) {
        new TGBlock(this)
      }


      // This creates an icon in the left ribbon.
      this.addRibbonIcon(
        "GENERATE_ICON",
        "Generate Text!",
        async (evt: MouseEvent) => {
          // Called when the user clicks the icon.
          // const activeFile = this.app.workspace.getActiveFile();
          const activeView = this.getActiveViewMD();
          if (activeView !== null) {
            const CM = ContentManagerCls.compile(activeView, this)
            try {
              await this.textGenerator.generateInEditor({}, false, CM);
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
            async (result: string) => { }
          ).open();
        }
      );

      // add commands
      await this.commands.addCommands();
      try {
        await this.packageManager.load();
      } catch (err: any) {
        console.trace("error in packageManager", err);
      }

      registerAPI("tg", this.textGenerator, this as any);
    } catch (err: any) {
      this.handelError(err);
    }

    try {
      this.registerObsidianProtocolHandler(`text-gen`, async (params) => {
        console.log(params.intent, this.actions, this.actions[params.intent])
        this.actions[params.intent]?.(params)
      });
    } catch (err: any) {
      this.handelError(err);
    }
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TOOL_ID);
    this.app.workspace.detachLeavesOfType(VIEW_Playground_ID);
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

  async saveSettings() {
    await this.saveData(
      this.removeApikeys(this.settings as typeof this.settings)
    );
  }

  async activateView(id: string, state?: any) {
    if (state?.openInPopout) {
      const leaf = this.app.workspace.getRightLeaf(true);

      await leaf.setViewState({
        type: id,
        active: true,
        state: { ...state, id: randomUUID() },
      });

      await new Promise((s) => setTimeout(s, 500));

      this.app.workspace.setActiveLeaf(leaf);
      this.app.workspace.moveLeafToPopout(leaf);

      return;
    }

    this.app.workspace.detachLeavesOfType(id);

    const leaf = await this.app.workspace.getRightLeaf(false);

    await leaf.setViewState({
      type: id,
      active: true,
      state: { ...state, id: randomUUID() },
    });

    await new Promise((s) => setTimeout(s, 500));

    this.app.workspace.revealLeaf(leaf);
  }

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
        span.addClasses(["plug-tg-loading", "dots"]);
        span.setAttribute("id", "tg-loading");
        span.style.width = "16px";
        span.style.alignContent = "center";
        this.textGeneratorIconItem.append(span);
        this.textGeneratorIconItem.title = "Generating Text...";
        if (this.notice) this.notice.hide();
        this.notice = new Notice(`Processing...\n${text}`, 100000);
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

  updateSpinnerPos(cur?: EditorPosition) {
    if (!this.spinner) return;
    const activeView = this.getActiveViewMD(false);
    if (!activeView) return;
    const editor = activeView.editor;
    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;

    const pos = cur || editor.getCursor("to");

    this.spinner.updatePos(editor.posToOffset(pos), editorView);

    this.app.workspace.updateOptions();
  }

  startProcessing(showSpinner = true) {
    this.updateStatusBar(``, true);
    this.processing = true;

    if (!showSpinner) return;

    const activeView = this.getActiveViewMD(false);
    if (!activeView) return;

    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;
    this.spinner = editorView.plugin(spinnersPlugin) || undefined;

    this.updateSpinnerPos();
  }

  endProcessing(showSpinner = true) {
    this.updateStatusBar(``);
    this.processing = false;

    if (!showSpinner || !this.spinner) return;
    const activeView = this.getActiveViewMD(false);
    if (!activeView) return;

    const editor = activeView.editor;
    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;

    this.spinner?.remove(
      editor.posToOffset(editor.getCursor("to")),
      editorView
    );
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
    if (error?.length || error?.message) {
      new Notice("🔴 " + (typeof error == "string" ? error : error.message));
    } else {
      new Notice(
        "🔴 Error: Text Generator Plugin: An error has occurred. Please check the console by pressing CTRL+SHIFT+I or turn on display errors in the editor within the settings for more information."
      );
    }

    console.error(error);
    try {
      //this.updateStatusBar(`Error check console`);
      if (this.settings.displayErrorInEditor) {
        const activeView = this.getActiveViewMD(false);
        if (activeView) {
          // @ts-ignore
          activeView.editor.cm.contentDOM.appendChild(this.formatError(error));
        }
      }
    } catch (err2: any) {
      // if it can't add error to activeView, then it doesn't matter, it shouldn't show a second error
      logger("handelError", err2);
    }

    setTimeout(() => this.updateStatusBar(``), 5000);
  }


  getFilesOnLoad(): Promise<TFile[]> {
    return new Promise(async (resolve, reject) => {
      let testFiles = app.vault.getFiles();
      if (testFiles.length === 0) {
        let retryTimes = 30;
        const timer = setInterval(() => {
          console.log("attempting to get files", retryTimes)
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

  createRunButton(label: string, svg: string) {
    const button = document.createElement("div");
    button.classList.add("clickable-icon");
    button.setAttribute("aria-label", label);
    //aria-label-position="right"
    button.innerHTML = svg;

    return button;
  }

  loadApikeys() {
    // check if user have LLMProviderOptionsKeysHashed object (upgrading from older version)
    this.settings.LLMProviderOptionsKeysHashed ??= {};

    if (this.settings.api_key_encrypted)
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
      ) as never as string || "";

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

  getDecryptedKey(keyBuffer: any, oldVal: string) {
    try {
      if (
        (keyBuffer as string)?.startsWith?.(DecryptKeyPrefix) ||
        !safeStorage?.isEncryptionAvailable() ||
        !this.settings.encrypt_keys
      ) {
        throw "disabled decryption";
      }

      const buff = Buffer.from(keyBuffer?.data || []);

      const decrypted = safeStorage.decryptString(buff) as string;

      return containsInvalidCharacter(decrypted)
        ? "**FAILED TO DECRYPT KEYS**"
        : decrypted;
    } catch (err: any) {
      // console.log(err);
      const [inCaseDecryptionFails, key] =
        keyBuffer?.split?.(DecryptKeyPrefix) || [];
      return inCaseDecryptionFails?.length || containsInvalidCharacter(key)
        ? "**FAILED TO DECRYPT**"
        : key;
    }
  }

  getEncryptedKey(apiKey: string) {
    if (!safeStorage?.isEncryptionAvailable() || !this.settings.encrypt_keys) {
      return `${DecryptKeyPrefix}${apiKey}`;
    }

    return safeStorage.encryptString(apiKey) as Buffer;
  }


  getApiKeys() {
    const keys: Record<string, string | undefined> = {};
    for (const k in this.settings.LLMProviderOptions) {
      if (Object.prototype.hasOwnProperty.call(this.settings.LLMProviderOptions, k)) {
        keys[this.textGenerator.LLMRegestry.UnProviderSlugs[k]] = this.settings.LLMProviderOptions[k]?.api_key;
      }
    }
    return keys;
  }

  resetSettingsToDefault() {
    this.settings = DEFAULT_SETTINGS;
    this.saveSettings();
  }

  /** Reloads the plugin */
  async reload() {
    // @ts-ignore
    await this.app.plugins.disablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    await this.app.plugins.enablePlugin("obsidian-textgenerator-plugin");
    // @ts-ignore
    this.app.setting.openTabById("obsidian-textgenerator-plugin").display();
  }

  actions: Record<string, any> = {}
  registerAction<T>(action: `${string}`, cb: (params: T) => void): any {
    return this.actions[action] = cb;
  }

  getRelativePathTo(path: string) {
    let k = this.settings.promptsPath;
    let d = k.split("/");

    if (k.endsWith("/")) d.pop();

    let basePath: string = "";

    if (d.length > 1) d.pop();

    basePath = d.join("/");

    return `${basePath}/${path}`
  }

  async getActiveView() {
    if (!this.app.workspace.activeLeaf) throw "activeLeaf not found";
    const activeView = this.app.workspace.activeLeaf.view;

    if (!activeView) {
      throw 'No active view.'
    }
    return activeView;
  }

  getActiveViewMD(makeNotice = true) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView) return activeView;

    if (makeNotice && !this.app.workspace.getActiveViewOfType(ToolView))
      new Notice("The file type should be Markdown!");

    return null;
  }


  getTextGenPath(path?: string) {
    let basePath = this.settings.textGenPath?.length ? this.settings.textGenPath : this.defaultSettings.textGenPath;

    if (!basePath.endsWith("/") && !path?.startsWith("/")) basePath += "/";

    return `${basePath}${path}`
  }
}
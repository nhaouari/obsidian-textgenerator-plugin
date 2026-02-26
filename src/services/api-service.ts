// import { TemplateModalUI } from "../ui/template-modal-ui";
// import { App, Notice, Editor, RequestUrlParam, EditorPosition } from "obsidian";
import TextGeneratorPlugin from "../main";
import ReqFormatter from "../utils/api-request-formatter";
import type { InputContext } from "../scope/context-manager";
import debug from "debug";
import { Message, TextGeneratorSettings } from "../types";
import { Handlebars } from "../helpers/handlebars-helpers";
import { Platform } from "obsidian";
import LLMProviderInterface from "../LLMProviders/interface";
import LLMProviderRegistry from "../LLMProviders/registery";
import { defaultProvidersMap } from "../LLMProviders";
import providerOptionsValidator from "../LLMProviders/providerOptionsValidator";
import { ProxyService } from "./proxy-service";
const logger = debug("textgenerator:TextGenerator");

export default class RequestHandler {
  plugin: TextGeneratorPlugin;
  reqFormatter: ReqFormatter;
  signalController?: AbortController;

  LLMProvider: LLMProviderInterface = undefined as any;
  LLMRegestry: LLMProviderRegistry<LLMProviderInterface> = undefined as any;

  proxyService: ProxyService;

  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;
    this.reqFormatter = new ReqFormatter(
      plugin.app,
      plugin,
      this.plugin.contextManager
    );

    this.proxyService = new ProxyService();
    this.load();
  }

  async unload() {
    this.signalController?.abort();
    await this.proxyService?.stop();
  }

  async load() {
    try {
      await this.loadLLMRegistry();
      await this.loadllm();
    } catch (err: any) {
      this.plugin.handelError(err);
    }
  }

  async loadLLMRegistry() {
    // default llm Providers;
    const llmProviders: Record<any, any> = { ...defaultProvidersMap };

    // get Customones and merge them with the default ones
    for (const llmId in this.plugin.settings.LLMProviderProfiles) {
      const llm = this.plugin.settings.LLMProviderProfiles[llmId];
      const parent = defaultProvidersMap[llm.extends as any];

      if (!parent) continue;

      class clone extends parent {
        static provider = parent.provider;

        static id = llmId;
        static slug = llm.name;

        cloned = true;
        static cloned = true;
        static displayName = llm.name;

        id = clone.id;
        provider = clone.provider;
      }

      llmProviders[llmId] = clone;
    }

    this.LLMRegestry = new LLMProviderRegistry(llmProviders);
    await this.LLMRegestry.load();
  }

  async addLLMCloneInRegistry(props: {
    /** id */
    id: string;
    /** name */
    name: string;
    /** from where it extends from (default Provider) */
    extends: string;
    extendsDataFrom?: string;
  }) {
    this.plugin.settings.LLMProviderProfiles ??= {};

    this.plugin.settings.LLMProviderProfiles[props.id] = {
      extends: props.extends,
      name: props.name,
    };

    this.plugin.settings.LLMProviderOptions[props.id] = {
      ...this.plugin.settings.LLMProviderOptions[
      props.extendsDataFrom || props.extends
      ],
    };

    await this.plugin.saveSettings();
    await this.loadLLMRegistry();
  }

  async deleteLLMCloneFromRegistry(id: string) {
    delete this.plugin.settings.LLMProviderProfiles[id];
    delete this.plugin.settings.LLMProviderOptions[id];
    await this.plugin.saveSettings();
    await this.loadLLMRegistry();
  }

  async loadllm(name: string = this.plugin.settings.selectedProvider || "") {
    const llmList = this.LLMRegestry.getList();

    const llm = this.LLMRegestry.get(name) || this.LLMRegestry.get(llmList[0]);

    if (llm && llm.id !== this.LLMProvider?.id) {
      if (Platform.isMobile && llm.mobileSupport == false)
        throw `Mobile is not supported for the "${llm?.id}" LLM provider`;

      // @ts-ignore
      const instance = new llm({
        plugin: this.plugin,
      });

      await instance.load();

      this.LLMProvider = instance;
    }
    return this.LLMProvider;
  }

  async gen(
    prompt: string,
    settings: Partial<typeof this.plugin.settings> = {}
  ) {
    logger("gen ", {
      prompt,
      pluginSettings: this.plugin.settings,
      settings,
    });

    const promp: Message["content"] = await Handlebars.compile(
      this.plugin.contextManager.overProcessTemplate(prompt)
    )({
      ...settings,
      templatePath: "default/default",
    });

    try {
      const { reqParams, bodyParams, provider, allParams } =
        await this.reqFormatter.getRequestParameters(
          {
            ...this.LLMProvider.getSettings(),
            ...settings,
            //@ts-ignore
            prompt: promp,
          },
          false
        );

      await providerOptionsValidator(
        this.LLMProvider.provider,
        provider.providerOptions
      );

      const result = provider.providerOptions.estimatingMode
        ? bodyParams.messages.map((m) => m.content).join(",")
        : provider.providerOptions.disableProvider
          ? ""
          : await this.LLMProvider.generate(
            bodyParams.messages,
            {
              ...allParams,
              ...bodyParams,
              requestParams: {
                // body: JSON.stringify(bodyParams),
                ...reqParams,
                signal: this.signalController?.signal,
              },
              otherOptions:
                this.plugin.settings.LLMProviderOptions[this.LLMProvider.id],
              stream: false,
              llmPredict: bodyParams.messages?.length == 1 && !this.plugin.settings.advancedOptions?.includeAttachmentsInRequest,
            },
            undefined,
            provider.providerOptions
          );

      // Remove leading/trailing newlines
      //   result = result.trim();

      // output template, template used AFTER the generation happens

      return result;
    } catch (error) {
      logger("gen  error", error);
      return Promise.reject(error);
    }
  }

  async streamGenerate(
    context: InputContext,
    insertMetadata = false,
    params: Partial<TextGeneratorSettings> = {},
    templatePath = "",
    additionnalParams: {
      showSpinner?: boolean;
      /** when using custom signal, it will not use textgenerator processing, loading or throw an error when 2 generations */
      signal?: AbortSignal;
      reqParams?: RequestInit | undefined;
      bodyParams?: any;
    } = {
        showSpinner: true,
        signal: undefined,
      }
  ) {
    try {
      console.log("calling stream generate")
      logger("generate", {
        context,
        insertMetadata,
        params,
        templatePath,
        additionnalParams,
      });

      if (this.plugin.processing && !additionnalParams.signal) {
        logger("streamGenerate error", "There is another generation process");
        throw "There is another generation process";
      }

      const { options, template } = context;

      const prompt = (typeof template != "undefined" && !context.context
        ? template.inputTemplate(options)
        : context.context) as string;


      const { reqParams, bodyParams, provider, allParams } =
        await this.reqFormatter.getRequestParameters(
          {
            ...context.options,
            ...params,
            prompt,
          },
          insertMetadata,
          templatePath,
          additionnalParams
        );

      await providerOptionsValidator(
        this.LLMProvider.provider,
        provider.providerOptions
      );

      if (!additionnalParams.signal)
        this.startLoading(additionnalParams.showSpinner);

      if (!this.LLMProvider?.streamable) {
        logger("streamGenerate error", "LLM not streamable");
        throw "LLM not streamable";
      }

      //const stream = await this.streamRequest(reqParams);
      const stream = async (
        onToken: Parameters<typeof this.LLMProvider.generate>[2],
        onError?: (error: any) => void
      ): Promise<string> => {
        try {
          const innerContext = {
            ...allParams,
            ...bodyParams,
            requestParams: {
              // body: JSON.stringify(bodyParams),
              ...reqParams,
              signal:
                additionnalParams.signal ||
                this.signalController?.signal,
            },
            otherOptions: this.LLMProvider.getSettings(),
            streaming: true,
            llmPredict: bodyParams.messages?.length == 1 && !this.plugin.settings.advancedOptions?.includeAttachmentsInRequest,
          } as any;

          const k =
            provider.providerOptions.estimatingMode ||
              provider.providerOptions.disableProvider
              ? ""
              : await this.LLMProvider.generate(
                bodyParams.messages,
                innerContext,
                onToken,
                provider.providerOptions
              );

          // output template, template used AFTER the generation happens


          const t = (provider.providerOptions.output?.length
            ? await Handlebars.compile(
              provider.providerOptions.output.replaceAll("\\n", "\n"),
              {
                noEscape: true,
              }
            ) : await template?.outputTemplate)

          delete innerContext.LLMProviderOptions;
          delete innerContext.LLMProviderOptionsKeysHashed;
          delete innerContext.LLMProviderProfiles;

          return t?.({
            requestResults: k,
            ...options,
            output: k,
            inputContext: innerContext,
          }) || k

        } catch (err: any) {
          onError?.(err);
          return err.message;
        }
      };

      logger("streamGenerate end", {
        stream,
      });

      return stream;
    } catch (error) {
      logger("streamGenerate error", error);
      return Promise.reject(error);
    }
  }

  async batchGenerate(
    context: InputContext[],
    insertMetadata = false,
    params: Partial<typeof this.plugin.settings> = this.plugin.settings,
    templatePath = "",
    additionnalParams = {
      showSpinner: true,
      insertMode: false,
    },
    onOneFinishs?: (content: string, index: number) => void
  ) {
    try {
      logger("chain", {
        context,
        insertMetadata,
        params,
        templatePath,
        additionnalParams,
      });

      if (this.plugin.processing) {
        logger("generate error", "There is another generation process");
        return Promise.reject(new Error("There is another generation process"));
      }

      this.startLoading();

      const batches = await Promise.all(
        context.map(async (ctxt) => {
          return this.reqFormatter.getRequestParameters(
            {
              ...ctxt.options,
              ...params,
              prompt:
                typeof ctxt.template != "undefined" && !ctxt.context
                  ? await ctxt.template.inputTemplate(ctxt.options)
                  : ctxt.context,
            },
            insertMetadata,
            templatePath
          );
        })
      );

      console.log(batches[0]);

      if (batches[0].provider.providerOptions.disableProvider)
        return await Promise.all(
          batches.map(async (b, i) => {
            const conf = {
              ...context[i].options,
              output: "",
              requestResults: "",
              inputContext: { ...b.allParams },
            };

            delete conf.inputContext.LLMProviderOptions;
            delete conf.inputContext.LLMProviderOptionsKeysHashed;
            delete conf.inputContext.LLMProviderProfiles;

            onOneFinishs?.(
              (await context[0].template?.outputTemplate?.(conf)) || "",
              i
            );
          })
        );
      else
        return await this.LLMProvider.generateBatch(
          batches.map((batch) => {
            return {
              messages: batch.bodyParams.messages,
              reqParams: {
                ...batch.allParams,
                ...batch.bodyParams,
                requestParams: {
                  // body: JSON.stringify(bodyParams),
                  ...batch.reqParams,
                  signal: this.signalController?.signal,
                },
                otherOptions:
                  this.plugin.settings.LLMProviderOptions[this.LLMProvider.id],
                stream: false,
                llmPredict: batch.bodyParams.messages?.length == 1,
              },
            };
          }),

          onOneFinishs
        );
    } catch (err: any) {
      this.endLoading();
      this.plugin.handelError(err);
    } finally {
      this.endLoading();
    }
  }

  async generate(
    context: InputContext,
    insertMetadata = false,
    params: Partial<
      typeof this.plugin.settings & { disableProvider: boolean }
    > = this.plugin.settings,
    templatePath = "",
    // @TODO: fix this types
    additionnalParams: any = {
      showSpinner: true,
      insertMode: false,
      dontCheckProcess: false,
    }
  ) {
    try {
      console.log("calling generate")
      logger("generate", {
        context,
        insertMetadata,
        params,
        templatePath,
        additionnalParams,
      });

      const { options, template } = context;

      if (!additionnalParams.dontCheckProcess && this.plugin.processing) {
        logger("generate error", "There is another generation process");
        return Promise.reject(new Error("There is another generation process"));
      }

      const prompt = (typeof template != "undefined" && !context.context?.trim()
        ? await template.inputTemplate(options)
        : context.context) as string;

      const { reqParams, bodyParams, provider, allParams } =
        await this.reqFormatter.getRequestParameters(
          {
            ...context.options,
            ...params,
            prompt,
          },
          insertMetadata,
          templatePath
        );

      await providerOptionsValidator(
        this.LLMProvider.provider,
        provider.providerOptions
      );

      this.startLoading(additionnalParams?.showSpinner);

      const innerContext = {
        ...allParams,
        ...bodyParams,
        requestParams: {
          // body: JSON.stringify(bodyParams),
          ...reqParams,
          signal: this.signalController?.signal,
        },
        otherOptions:
          this.plugin.settings.LLMProviderOptions[this.LLMProvider.id],
        stream: this.LLMProvider.streamable,
        llmPredict: bodyParams.messages?.length == 1 && !this.plugin.settings.advancedOptions?.includeAttachmentsInRequest,
      }

      let result =
        provider.providerOptions.estimatingMode ||
          provider.providerOptions.disableProvider
          ? ""
          : await this.LLMProvider.generate(
            bodyParams.messages,
            innerContext,
            undefined,
            provider.providerOptions
          );

      // Remove leading/trailing newlines
      //   result = result.trim();

      // output template, template used AFTER the generation happens

      const conf = {
        ...options,
        output: result,
        requestResults: result,
        inputContext: innerContext
      };

      delete conf.inputContext.LLMProviderOptions;
      delete conf.inputContext.LLMProviderOptionsKeysHashed;
      delete conf.inputContext.LLMProviderProfiles;

      result = provider.providerOptions.output
        ? await Handlebars.compile(
          provider.providerOptions.output.replaceAll("\\n", "\n"),
          {
            noEscape: true,
          }
        )(conf)
        : result;

      const res = (await template?.outputTemplate?.({
        ...conf,
        output: result,
      }))

      result = res
        || result;

      logger("generate end", {
        result,
      });

      return result;
    } catch (error) {
      logger("generate error", error);
      this.endLoading(additionnalParams?.showSpinner);
      return Promise.reject(error);
    } finally {
      this.endLoading(additionnalParams?.showSpinner);
    }
  }

  protected startLoading(showSpinner?: boolean) {
    this.signalController = new AbortController();
    this.plugin.startProcessing(showSpinner);
  }

  endLoading(showSpinner?: boolean) {
    this.signalController?.abort();
    this.signalController = undefined;
    this.plugin.endProcessing(showSpinner);
  }
}

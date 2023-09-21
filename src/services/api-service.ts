// import { TemplateModalUI } from "../ui/template-modal-ui";
// import { App, Notice, Editor, RequestUrlParam, EditorPosition } from "obsidian";
import TextGeneratorPlugin from "../main";
import ReqFormatter from "../api-request-formatter";
import ContextManager, { InputContext } from "../context-manager";
import debug from "debug";
import LLMProviderInterface from "src/LLMProviders/interface";
import { LLMProviderRegistery } from "src/LLMProviders";
import { TextGeneratorSettings } from "../types";
import Handlebars from "handlebars";
const logger = debug("textgenerator:TextGenerator");

export default class RequestHandler {
  plugin: TextGeneratorPlugin;
  reqFormatter: ReqFormatter;
  contextManager: ContextManager;
  signalController?: AbortController;

  LLMProvider: LLMProviderInterface;

  constructor(plugin: TextGeneratorPlugin) {
    this.plugin = plugin;
    this.contextManager = new ContextManager(app, plugin);
    this.reqFormatter = new ReqFormatter(app, plugin, this.contextManager);

    this.setup();
  }

  setup() {
    this.loadllm();
  }

  async loadllm(name: string = this.plugin.settings.selectedProvider || "") {
    console.log("loading llm", name);
    const llmList = LLMProviderRegistery.getList();

    const llm =
      LLMProviderRegistery.get(name) || LLMProviderRegistery.get(llmList[0]);

    if (llm)
      // @ts-ignore
      this.LLMProvider = new llm({
        plugin: this.plugin,
      });
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

    const { reqParams, bodyParams, provider, allParams } =
      this.reqFormatter.getRequestParameters(
        {
          prompt,
        },
        false,
        ""
      );

    if (provider.selectedProvider !== this.LLMProvider.id)
      await this.loadllm(provider.selectedProvider);

    if (!this.LLMProvider.streamable) {
      logger("streamGenerate error", "LLM not streamable");
      throw "LLM not streamable";
    }

    try {
      const result = await this.LLMProvider.generate(
        bodyParams["messages"],
        {
          requestParams: {
            signal: this.signalController?.signal,
            ...reqParams,
          },
          ...allParams,
          stream: false,
          llmPredict: bodyParams["messages"]?.length == 1,
          otherOptions: this.plugin.settings.LLMProviderOptions,
        },
        undefined,
        provider.providerOptions
      );

      logger("gen results", {
        result,
      });

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
    additionnalParams: any = {
      showSpinner: true,
    }
  ) {
    try {
      logger("generate", {
        context,
        insertMetadata,
        params,
        templatePath,
        additionnalParams,
      });

      console.log("generating with stream");

      if (this.plugin.processing) {
        logger("streamGenerate error", "There is another generation process");
        throw "There is another generation process";
      }

      const { options, template } = context;

      this.startLoading(additionnalParams.showSpinner);

      const { reqParams, bodyParams, provider, allParams } =
        this.reqFormatter.getRequestParameters(
          {
            ...params,
            prompt:
              typeof template != "undefined"
                ? template.inputTemplate(options)
                : context.context,
          },
          insertMetadata,
          templatePath,
          additionnalParams
        );

      if (provider.selectedProvider !== this.LLMProvider.id)
        await this.loadllm(provider.selectedProvider);

      if (!this.LLMProvider.streamable) {
        logger("streamGenerate error", "LLM not streamable");
        throw "LLM not streamable";
      }

      //const stream = await this.streamRequest(reqParams);
      const stream = async (
        onToken: Parameters<typeof this.LLMProvider.generate>[2]
      ) => {
        try {
          const k = await this.LLMProvider.generate(
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
              streaming: true,
              llmPredict: bodyParams.messages?.length == 1,
            } as any,
            onToken,
            provider.providerOptions
          );

          // output template, template used AFTER the generation happens
          return (
            (provider.providerOptions.output?.length
              ? Handlebars.compile(
                  provider.providerOptions.output.replaceAll("\\n", "\n"),
                  {
                    noEscape: true,
                  }
                )
              : template?.outputTemplate)?.({ ...options, output: k }) || k
          );
        } catch (err: any) {
          this.plugin.handelError(err.message);
          this.endLoading(additionnalParams?.showSpinner);
        } finally {
          this.endLoading(additionnalParams?.showSpinner);
        }
      };

      logger("streamGenerate end", {
        stream,
      });

      return stream;
    } catch (error) {
      this.endLoading(additionnalParams.showSpinner);
      logger("streamGenerate error", error);
      return Promise.reject(error);
    }
  }

  async generate(
    context: InputContext,
    insertMetadata = false,
    params: Partial<typeof this.plugin.settings> = this.plugin.settings,
    templatePath = "",
    additionnalParams = {
      showSpinner: true,
      insertMode: false,
    }
  ) {
    try {
      logger("generate", {
        context,
        insertMetadata,
        params,
        templatePath,
        additionnalParams,
      });

      const { options, template } = context;

      if (this.plugin.processing) {
        logger("generate error", "There is another generation process");
        return Promise.reject(new Error("There is another generation process"));
      }

      this.startLoading(additionnalParams?.showSpinner);
      console.log(
        typeof template != "undefined"
          ? template.inputTemplate(options)
          : context.context
      );

      const { reqParams, bodyParams, provider, allParams } =
        this.reqFormatter.getRequestParameters(
          {
            ...params,
            prompt:
              typeof template != "undefined"
                ? template.inputTemplate(options)
                : context.context,
          },
          insertMetadata,
          templatePath
        );

      if (provider.selectedProvider !== this.LLMProvider.id)
        await this.loadllm(provider.selectedProvider);

      if (!this.LLMProvider.streamable) {
        logger("streamGenerate error", "LLM not streamable");
        throw "LLM not streamable";
      }

      let result = await this.LLMProvider.generate(
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
          llmPredict: bodyParams.messages?.length == 1,
        },
        undefined,
        provider.providerOptions
      );

      // Remove leading/trailing newlines
      //   result = result.trim();

      // output template, template used AFTER the generation happens
      console.log({ result });
      result =
        (provider.providerOptions.output?.length
          ? Handlebars.compile(
              provider.providerOptions.output.replaceAll("\\n", "\n"),
              {
                noEscape: true,
              }
            )
          : template?.outputTemplate)?.({ ...options, output: result }) ||
        result;

      console.log("output", provider.providerOptions.output, {
        result,
        options,
      });

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

import { Notice, normalizePath } from "obsidian";
import handlebars from "handlebars";
import { pull } from "langchain/hub";

import asyncHelpers from "../lib/async-handlebars-helper";
import { compileLangMessages } from "#/utils";

export const Handlebars = asyncHelpers(handlebars);
import type ContextManager from "#/context-manager";
import {
  ContentExtractor,
  ExtractorSlug,
  Extractors,
} from "#/extractors/content-extractor";

export default function Helpersfn(self: ContextManager) {
  const Helpers = {
    length: function (str: string) {
      return str.length;
    },

    substring: function (string: string, start: number, end: number) {
      const subString = string.substring(start, end);
      return new Handlebars.SafeString(subString);
    },

    replace: function (string: string, search: string, replace: string) {
      const replacedString = string.replace(new RegExp(search, "g"), replace);
      return new Handlebars.SafeString(replacedString);
    },

    date: function () {
      const currentDate = new Date().toLocaleString();
      return new Handlebars.SafeString(currentDate);
    },

    truncate: function (string: string, length: number) {
      if (string.length > length) {
        return new Handlebars.SafeString(string.substring(0, length) + "...");
      } else {
        return new Handlebars.SafeString(string);
      }
    },

    tail: function (string: string, length: number) {
      if (string.length > length) {
        return new Handlebars.SafeString(
          "..." + string.substring(string.length - length)
        );
      } else {
        return new Handlebars.SafeString(string);
      }
    },

    split: function (string: string, separator: string) {
      const splitArray = string.split(separator);
      return splitArray;
    },

    join: function (array: Array<string>, separator: string) {
      const joinedString = array.join(separator);
      return new Handlebars.SafeString(joinedString);
    },

    unique: function (array: Array<string>) {
      const uniqueArray = [...new Set(array)];
      return new Handlebars.SafeString(JSON.stringify(uniqueArray));
    },

    trim: function (string: string) {
      const trimmedString = string.trim();
      return new Handlebars.SafeString(trimmedString);
    },

    getRandomFile: async function getRandomFile(
      str = "",
      minLength = 100,
      maxLength = 1500
    ) {
      let files: any[] = self.app.vault.getMarkdownFiles();

      if (str) {
        const filteredFiles = files.filter(
          (file: any) => file.path.includes(str) && file.stat.size >= minLength
        );
        if (filteredFiles.length === 0) {
          throw new Error(`No files match the pattern ${str}`);
        }
        files = filteredFiles;
      }

      const randomIndex = Math.floor(Math.random() * files.length);
      const filePath = normalizePath(
        `${files[randomIndex].vault.adapter.basePath}\\${files[randomIndex].path}`
      );

      let content = await self.app.vault.adapter.read(filePath);
      const fileName = files[randomIndex].name;

      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + "...";
      }

      const output = `filename: ${fileName}\n content: ${content}`;
      return output;
    },

    eq: function (value1: any, value2: any) {
      return value1 === value2;
    },

    stringify: function (context: any) {
      return JSON.stringify(context);
    },

    parse: function (context: any) {
      return JSON.parse(context);
    },

    escp: async function (context: any) {
      let t = context?.fn ? await context?.fn(context.data.root) : "" + context;

      while (t?.contains("\n")) {
        t = t?.replaceAll("\n", " ");
      }

      while (t?.contains("\\n")) {
        t = t?.replaceAll("\\n", " ");
      }

      while (t?.contains("\\")) {
        t = t?.replaceAll("\\", " ");
      }

      const k = JSON.stringify(t);
      return k.substring(1, k.length - 1);
    },

    escp2: async function (context: any) {
      const t = await Helpers.escp(context);

      return await Helpers.trim(t);
    },

    error: async function (context: any) {
      throw new Error(context);
    },

    notice: function (context: any, duration: any) {
      new Notice(context, typeof duration == "object" ? undefined : +duration);
    },

    async log(...vars: any[]) {
      if (vars[vars.length - 1].fn)
        vars[vars.length - 1] = (await vars[vars.length - 1].fn?.(this)) || "";
      else delete vars[vars.length - 1];

      // try to json parse them
      vars.forEach((v, i) => {
        try {
          vars[i] = JSON.parse(v);
        } catch {
          // empty
        }
      });
      console.log(...vars);
      return "";
    },

    async run(...vars: any[]) {
      const options: { data: { root: any }; fn: any } = vars.pop();

      if (!options.data.root.templatePath) {
        console.log({ t: this, options, vars });
        throw new Error("templatePath was not found in run command");
      }

      const p = options.data.root.templatePath?.split("/");
      const parentPackageId = p[p.length - 2];

      const firstVar = vars.shift();
      const id: string = firstVar?.contains("/")
        ? firstVar
        : `${parentPackageId}/${firstVar}`;

      const otherVariables = vars;

      if (!self.plugin.textGenerator.templatePaths[id])
        throw new Error(
          `template with packageId/promptId ${id} was not found.`
        );

      const TemplateMetadata = self.getFrontmatter(
        self.getMetaData(self.plugin.textGenerator.templatePaths[id])
      );

      let varname = id;
      let innerResult = {};

      if (!options.fn) {
        varname ||= otherVariables[1];
        const innerTxt = otherVariables[0];
        try {
          innerResult = innerTxt.trim().startsWith("{")
            ? JSON.parse(innerTxt)
            : {
                [otherVariables.length > 1 ? varname : "tg_selection"]:
                  innerTxt,
              };
        } catch (err: any) {
          innerResult = {
            [otherVariables.length > 1 ? varname : "tg_selection"]: innerTxt,
          };
          console.warn(
            "couldn't parse data passed to ",
            id,
            {
              content: innerTxt,
            },
            err
          );
        }
      } else {
        varname = otherVariables[0];
        const innerTxt =
          (await await options.fn?.({
            ...this,
            ...TemplateMetadata,
          })) || "{}";

        try {
          innerResult = innerTxt.trim().startsWith("{")
            ? JSON.parse(innerTxt)
            : {
                [otherVariables.length > 1 ? varname : "tg_selection"]:
                  innerTxt,
              };
        } catch (err: any) {
          innerResult = {
            [otherVariables.length > 1 ? varname : "tg_selection"]: innerTxt,
          };
          console.warn(
            "couldn't parse data passed to ",
            id,
            {
              content: innerTxt,
            },
            err
          );
        }
      }

      options.data.root[
        otherVariables.length >= 1 ? "VAR:" + otherVariables[0] : id
      ] = await self.plugin.textGenerator.templateGen(id, {
        additionalProps: {
          ...options.data.root,
          ...TemplateMetadata,
          disableProvider: false,
          ...innerResult,
        },
      });

      return "";
    },

    async get(templateId: string, additionalOptions: { data: { root: any } }) {
      const p = additionalOptions.data.root.templatePath?.split("/");
      const parentPackageId = Object.keys(ExtractorSlug).includes(templateId)
        ? "extractions"
        : p[p.length - 2];

      const id: string = templateId?.contains("/")
        ? // if it has a slash that means it already have the packageId
          templateId
        : // checking for vars
        Object.keys(additionalOptions.data.root || {}).includes(
            "VAR:" + templateId
          )
        ? "VAR:" + templateId
        : // make packageId/templateId
          `${parentPackageId}/${templateId}`;

      return additionalOptions.data.root[id];
    },

    async extract(...vars: any[]) {
      const options: { data: { root: any }; fn: any } = vars.pop();

      const p = options.data.root.templatePath?.split("/");

      const firstVar = vars.shift();
      const id: string = firstVar?.contains("/")
        ? firstVar
        : `extractions/${firstVar}`;

      const otherVariables = vars;

      const TemplateMetadata = self.getFrontmatter(
        self.getMetaData(self.plugin.textGenerator.templatePaths[id])
      );

      if (!(firstVar in ExtractorSlug))
        throw new Error(`Extractor ${firstVar} Not found`);

      const cntn =
        otherVariables[0] ||
        (await await options.fn?.({
          ...this,
          ...TemplateMetadata,
        }));

      const ce = new ContentExtractor(self.app, self.plugin);

      ce.setExtractor(
        ExtractorSlug[
          firstVar as keyof typeof ExtractorSlug
        ] as keyof typeof Extractors
      );

      const res = await ce.convert(cntn);

      options.data.root[id] = res;

      return options.data.root[id];
    },

    async runLang(...vars: any[]) {
      const options: { data: { root: any }; fn: any } = vars.pop();

      const firstVar = vars.shift();

      const whatToGet: "system" | "prompt" = vars.shift();

      const inJson = {
        ...options.data.root,
        ...JSON.parse(await options.fn(this)),
      };

      const data: { system: string; messages: string[]; prompt?: string } =
        await langPull(firstVar);

      data.system = await Handlebars.compile(data.system)(inJson);

      data.messages = await Promise.all(
        data.messages.map(async (msg) => await Handlebars.compile(msg)(inJson))
      );

      data.prompt = data.messages[data.messages?.length - 1] || "";

      console.log({
        data,
        l: JSON.stringify({
          // ...inJson,
          ...data,
        }),
      });

      switch (whatToGet) {
        case "system":
          return data.system;

        case "prompt":
          return data.prompt;

        default:
          return JSON.stringify({
            // ...inJson,
            ...data,
          });
      }
    },

    async pullLang(rep: string) {
      return JSON.stringify(await langPull(rep));
    },
  } as const;

  return Helpers;
}

export async function langPull(rep: string) {
  const k = (await pull(rep)).toJSON() as unknown as {
    kwargs: {
      messages?: {
        prompt: {
          inputVariables: string[];
          template: string;
        };
      }[];
      template?: string;
      input_variables: string[];
      template_format?: string;
    };
  };

  if (k.kwargs.template_format && k.kwargs.template_format != "f-string")
    throw new Error("only accepts templates with format f-string for now.");

  console.log({
    k,
    res:
      k.kwargs.messages ||
      (k.kwargs.template
        ? [
            {
              prompt: {
                template: k.kwargs.template,
                inputVariables: k.kwargs.input_variables,
              },
            },
          ]
        : []),
  });

  const data = compileLangMessages(
    k.kwargs.messages ||
      (k.kwargs.template
        ? [
            {
              prompt: {
                template: k.kwargs.template,
                inputVariables: k.kwargs.input_variables,
              },
            },
          ]
        : [])
  );

  return data;
}

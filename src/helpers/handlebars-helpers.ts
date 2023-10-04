import { Notice, normalizePath } from "obsidian";
import handlebars from "handlebars";

import asyncHelpers from "../lib/async-handlebars-helper";

export const Handlebars = asyncHelpers(handlebars);

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

  getRandomFile: function getRandomFile(
    str = "",
    minLength = 100,
    maxLength = 1500
  ) {
    let files: any[] = this.app.vault.getMarkdownFiles();

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

    let content = this.app.vault.adapter.fs.readFileSync(filePath, "utf8");
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
    console.log({ t });
    while (t?.contains("\n") || t?.contains("\\")) {
      t = t?.replaceAll("\n", " ")?.replaceAll("\\", " ");
    }

    return t;
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

  log: async function (...vars: any[]) {
    vars[vars.length - 1] = (await vars[vars.length - 1].fn?.(this)) || "";
    console.log(...vars);
  },

  //   run: async (templateId: string) => {
  //     const self: ContextManager = this as any;
  //     console.log({ self });
  //     return self.plugin.textGenerator.templateGen(templateId, {});
  //   },
};

export default Helpers;

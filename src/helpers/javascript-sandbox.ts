import { Notice } from "obsidian";
import handlebars from "handlebars";
import { pull } from "langchain/hub";

import asyncHelpers from "../lib/async-handlebars-helper";
import { createFileWithInput, createFolder } from "#/utils";

import { pluginApi } from "@vanakat/plugin-api";

export const Handlebars = asyncHelpers(handlebars);
import {
  ContentExtractor,
  ExtractorSlug,
  Extractors,
} from "#/extractors/content-extractor";
import { isMap, isSet } from "util/types";
import Read from "#/extractors";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";
import JSON5 from "json5";

import * as langchain from "#/lib/langchain";
import TextGeneratorPlugin from "#/main";

import { PluginManager } from "../lib/live-plugin-manager";

const manager = new PluginManager({
  npmInstallMode: "useCache"
});

export default async function runJSInSandbox(
  script: string,
  self: { plugin: TextGeneratorPlugin } & Record<any, any>
) {
  let mainNotice: any;

  const sandbox: Record<any, any> = {
    JSON5,
    lodashGet,
    lodashSet,
    pluginApi,
    Notice,
    pull,
    langchain,
    isMap,
    isSet,
    globalThis: {},
    ...self,

    notice(context: any, duration: any) {
      if (mainNotice) mainNotice.hide();
      return (mainNotice = new Notice(
        context,
        typeof duration == "object" ? undefined : +duration
      ));
    },
    async deleteFile(path: string) {
      return await self.plugin.app.vault.adapter.remove(path);
    },
    async error(context: any) {
      await self.plugin.handelError(context);
      throw new Error(context);
    },
    async extract(id: string, cntn: string, other: any) {
      const ce = new ContentExtractor(self.app, self.plugin);

      ce.setExtractor(
        ExtractorSlug[
        id as keyof typeof ExtractorSlug
        ] as keyof typeof Extractors
      );

      return await ce.convert(cntn, other);
    },

    async write(path: string, data: string) {
      return await createFileWithInput(path, data, self.plugin.app);
    },

    async append(path: string, data: string) {
      const dirMatch = path.match(/(.*)[/\\]/);
      let dirName = "";
      if (dirMatch) dirName = dirMatch[1];

      if (!(await self.app.vault.adapter.exists(dirName)))
        await createFolder(dirName, app);

      return await self.plugin.app.vault.adapter.append(path, `\n${data}`);
    },

    async read(path: string) {
      return await Read(path, self.plugin);
    },

    manager
  };

  const functions = Object.keys(sandbox).filter((k) =>
    ["function", "object"].includes(typeof sandbox[k])
  );
  // Create a function from the code
  const func = new Function(
    ...functions,
    `return new Promise((s,r)=>{(async ()=>{
      ${script}
      })().then(s).catch(r)})`
  );

  // Execute the function in the sandboxed environment
  return await func.call(sandbox, ...functions.map((k) => sandbox[k]));
}

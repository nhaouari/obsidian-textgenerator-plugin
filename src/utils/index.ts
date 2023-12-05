/* eslint-disable no-control-regex */
import { App, ViewState, WorkspaceLeaf, TFile } from "obsidian";
import {
  AsyncReturnType,
  FileViewMode,
  Message,
  NewTabDirection,
} from "../types";
import debug from "debug";
const logger = debug("textgenerator:setModel");

export function makeId(length: number) {
  logger("makeId");
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  logger("makeId end", result);
  return result;
}
/**
 * Copied from Quick Add  https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/engine/QuickAddEngine.ts#L15
 * @param folder
 */
export async function createFolder(folder: string, app: App): Promise<void> {
  logger("createFolder", folder);
  const folderExists = await app.vault.adapter.exists(folder);

  if (!folderExists) {
    await this.app.vault.createFolder(folder);
  }
  logger("createFolder end");
}

/**
 *  Copied from Quick Add https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/engine/QuickAddEngine.ts#L50
 * @param filePath
 * @param fileContent
 * @returns
 */
export async function createFileWithInput(
  filePath: string,
  fileContent: string,
  app: App
): Promise<TFile> {
  logger("createFileWithInput", filePath, fileContent);
  const dirMatch = filePath.match(/(.*)[/\\]/);
  let dirName = "";
  if (dirMatch) dirName = dirMatch[1];

  if (!(await app.vault.adapter.exists(dirName)))
    await createFolder(dirName, app);

  return await app.vault.create(filePath, fileContent);
}

/*
 * Copied from Quick Add  https://github.com/chhoumann/quickadd/blob/2d2297dd6b2439b2b3f78f3920900aa9954f89cf/src/utility.ts#L150
 */

export async function openFile(
  app: App,
  file: TFile,
  optional?: {
    openInNewTab?: boolean;
    direction?: NewTabDirection;
    mode?: FileViewMode;
    focus?: boolean;
  }
) {
  logger("openFile", file, optional);
  let leaf: WorkspaceLeaf;

  if (optional?.openInNewTab && optional?.direction) {
    leaf = app.workspace.splitActiveLeaf(optional.direction);
  } else {
    leaf = app.workspace.getUnpinnedLeaf();
  }

  await leaf.openFile(file);

  if (optional?.mode || optional?.focus) {
    await leaf.setViewState(
      {
        ...leaf.getViewState(),
        state:
          optional.mode && optional.mode !== "default"
            ? { ...leaf.view.getState(), mode: optional.mode }
            : leaf.view.getState(),
        popstate: true,
      } as ViewState,
      { focus: optional?.focus }
    );
  }
  logger("openFile end");
}

export function removeYAML(content: string) {
  logger("removeYAML", content);

  // Use a non-greedy match for the content between ---
  const match = content.match(/^---([\s\S]*?)---/m);

  if (match && match.index === 0) {
    // If the match starts at the beginning of the content, remove it
    const newContent = content.slice(match[0].length);
    logger("removeYAML", newContent);
    return newContent;
  } else {
    // If there is no match or it doesn't start at the beginning, return the original content
    logger("removeYAML", content);
    return content;
  }
}


export function removeExtensionFromName(name: string) {
  logger("removeExtension", name);
  const arr = name.contains(".") ? name.split(".") : [name, ""];
  arr.pop();
  const res = arr.join(".");
  logger("removeExtension", res);
  return res;
}

export function numberToKFormat(number: number) {
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + "k";
  } else {
    return number.toString();
  }
}

export function transformStringsToChatFormat(arr: string[]) {
  const roles = ["user", "assistant"]; // define the roles
  const result: { role: string; content: string }[] = []; // initialize the result array
  for (let i = 0; i < arr.length; i++) {
    result.push({
      role: roles[i % 2], // alternate between the two roles
      content: arr[i],
    });
  }

  return result;
}

// Adapted from Stackoverflow: https://stackoverflow.com/a/6969486/19687
export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export async function getContextAsString(
  context: Record<string, string | string[]>,
  template?: string
) {
  if (template) {
    const ctxt = Handlebars.compile(template)(context);
    return ctxt;
  }

  let contextString = "";

  for (const key in context) {
    if (!context[key] || key == "content") continue;

    contextString += `${key}:`;

    // Check if value is an array and join with \n
    if (Array.isArray(context[key])) {
      contextString += `${(context[key] as string[]).join("\n")}\n`;
    } else {
      contextString += `${context[key]}\n`;
    }
  }
  return contextString;
}

export function removeRepetitiveObjects<T>(objects: T[], key = "path"): T[] {
  const uniqueObjects: { [key: string]: T } = {};
  for (const obj of objects) {
    const objKey: any = obj?.[key as keyof typeof obj];
    if (!(objKey in uniqueObjects)) {
      uniqueObjects[objKey] = obj;
    }
  }

  return Object.values(uniqueObjects).filter(Boolean) as T[];
}

import {
  HumanMessage,
  AIMessage,
  BaseMessage,
  SystemMessage,
} from "langchain/schema";

export function mapMessagesToLangchainMessages(
  messages: Message[]
): BaseMessage[] {
  return messages.map((msg) => {
    switch (msg.role?.toLocaleLowerCase()) {
      case "system":
        return new SystemMessage(msg.content);
      case "assistant":
        return new AIMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}

export function containsInvalidCharacter(inputString: string) {
  const invalidCharRegex = /[^\x00-\x7F]+/g;
  return invalidCharRegex.test(inputString);
}

export function cleanConfig<T>(options: T): T {
  const cleanedOptions: any = {}; // Create a new object to store the cleaned properties

  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      const value = options[key];

      // Check if the value is not an empty string
      if (typeof value !== "string" || value !== "") {
        cleanedOptions[key] = value; // Copy non-empty properties to the cleaned object
      }
    }
  }

  return cleanedOptions;
}

export async function processPromisesSetteledBatch<
  T extends () => Promise<any>
>(
  items: Array<AsyncReturnType<T>>,
  limit: number
): Promise<PromiseSettledResult<any>[]> {
  let results: PromiseSettledResult<Awaited<AsyncReturnType<T>>>[] = [];
  for (let batchNum = 0; batchNum < items.length; batchNum += limit) {
    const end =
      batchNum + limit > items.length ? items.length : batchNum + limit;

    const slicedResults = await Promise.allSettled(items.slice(batchNum, end));

    results = [...results, ...slicedResults];
  }

  return results;
}

export function promiseForceFullfil(item: any) {
  // return the failed reson
  return item.status == "fulfilled" ? item.value : `FAILED: ${item?.reason}`;
}

import { SystemMessagePromptTemplate } from "langchain/prompts";
import get from "lodash.get";
import { Handlebars } from "#/helpers/handlebars-helpers";

export function compilePrompt(prompt: string, vars: string[]) {
  let newPrompt = prompt;

  for (const v of vars) {
    newPrompt = newPrompt.replaceAll(`{${v}}`, `{{${v}}}`);
  }

  return newPrompt;
}

export function compileLangMessages(
  msgs: {
    prompt: {
      inputVariables: string[];
      template: string;
    };
  }[]
) {
  const messages: string[] = [];
  let system = "";
  msgs.forEach((msg) => {
    console.log(msg);
    if (msg instanceof SystemMessagePromptTemplate) {
      system += compilePrompt(msg.prompt.template, msg.prompt.inputVariables);
    } else {
      messages.push(
        compilePrompt(msg.prompt.template, msg.prompt.inputVariables)
      );
    }
  });

  return {
    messages,
    system,
  };
}

export function trimBy<T>(objects: T[], propertyName: string): T[] {
  const uniqueValues = new Set();
  const result: T[] = [];

  for (const obj of objects) {
    const value = get(obj, propertyName);

    if (!uniqueValues.has(value)) {
      uniqueValues.add(value);
      result.push(obj);
    }
  }

  return result;
}


export function replaceScriptBlocksWithMustachBlocks(templateString: string) {
  if (!templateString) return "";
  // Regular expressions for matching the script tags
  const startScriptRegex = /{{\s*#script\s*}}/g;
  const endScriptRegex = /{{\s*\/script\s*}}/g;
  const quadErrorRegex = /{{{{{{\s*\/script\s*}}}}}}/g;

  // Replace all occurrences of {{#script}} and {{/script}} with {{{{script}}}} and {{{{/script}}}} respectively
  let updatedTemplateString = templateString
    .replace(startScriptRegex, '{{{{script}}}}')
    .replace(endScriptRegex, '{{{{/script}}}}');

  // Handle the case where {{{{/script}}}} is already present
  updatedTemplateString = updatedTemplateString.replace(quadErrorRegex, '{{{{/script}}}}');

  return updatedTemplateString;
}


export function nFormatter(n?: number, digits = 1) {
  const num = n || 0;
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function (item) {
    return num >= item.value;
  });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}



export function unpromisifyAsyncFunction<T>(
  asyncFunction: Promise<T>
): T {
  let isAsyncComplete = false;
  let result: T;

  // Call the provided asynchronous function
  asyncFunction.then(asyncResult => {
    result = asyncResult;
    isAsyncComplete = true;
  });

  // Use a while loop to wait for the asynchronous operation to complete
  while (!isAsyncComplete) {
    syncWait(10)
  }

  // Return the result synchronously
  // @ts-ignore
  return result;
}

const syncWait = (ms: number) => {
  const end = Date.now() + ms
  while (Date.now() < end) continue
}
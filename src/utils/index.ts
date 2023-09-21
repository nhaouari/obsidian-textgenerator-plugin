/* eslint-disable no-control-regex */
import { App, ViewState, WorkspaceLeaf, TFile } from "obsidian";
import { FileViewMode, Message, NewTabDirection } from "../types";
import debug from "debug";
const logger = debug("textgenerator:setModel");

export function makeid(length: number) {
  logger("makeid");
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  logger("makeid end", result);
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
  const newContent = content.replace(/---(.|\n)*---/, "");
  logger("removeYAML", newContent);
  return newContent;
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
  const result = []; // initialize the result array
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

export function getContextAsString(
  context: Record<string, string | string[]>,
  withKey = ["title"]
) {
  let contextString = "";
  for (const key in context) {
    if (withKey.includes(key)) {
      contextString += `${key}:`;
    }
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

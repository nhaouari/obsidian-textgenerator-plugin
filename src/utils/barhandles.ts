import { contextVariablesObj } from "#/scope/context-manager";
import Helpersfn from "#/helpers/handlebars-helpers";
import set from "lodash.set";

const helpers: Record<string, any> = Helpersfn({} as any);
const helpersArr: string[] = Object.keys(helpers)

const ignoredVariables = ["output", "this", "true", "false", "script"];
const defaultHelpers = ["if", "unless", "with", "each", "package"];

export const getHBValues = (text: string) => {
  text = removeScriptOccurrences(text);

  const re = /{{[{]?[{]?(.*?)[}]?[}]?}}/g;
  const tags: string[] = [];
  let matches: any;
  while ((matches = re.exec(text))) {
    if (matches) {
      tags.push(matches[1]);
    }
  }
  const root: any = {};
  let context: any = root;
  const stack: any = [];
  const setVar = (variable: string, val: any) => {
    // Dot Notation Breakdown
    if (variable.match(/\.*\./) && !variable.match(/\s/)) {
      const notation = variable.split(".");
      set(context, notation, "");
    } else {
      context[variable.trim()] = val;
    }
  };

  main: for (const tag of tags) {
    if (
      // if its a inside variable
      tag.startsWith("vars.") ||
      // if its a string
      tag.startsWith("'") ||
      tag.startsWith('"') ||
      // if its a number
      "" + +tag == tag ||
      // if its a helper
      defaultHelpers.includes(tag) ||
      // if its a ignored variable name
      ignoredVariables.includes(tag) ||
      // if its a helper
      helpers[tag]
    ) {
      continue;
    }

    if (tag.startsWith("/")) {
      // context = stack.pop();
      continue;
    }

    if (tag.startsWith("! ")) {
      continue;
    }

    if (tag == "else") {
      continue;
    }

    for (const helper of helpersArr) {
      if (tag.startsWith(`${helper} `) || tag.startsWith(`#${helper} `)) {
        const vars = extractVariablesAndStrings(tag).slice(1);
        tags.push(...vars);
        continue main;
      }
    }

    for (const helper of defaultHelpers) {
      if (tag.startsWith(`${helper} `) || tag.startsWith(`#${helper} `)) {
        const vars = extractVariablesAndStrings(tag).slice(1);
        tags.push(...vars);
        continue main;
      }
    }

    if (tag.includes(".")) {
      const m = tag.split(".")[0];

      tags.push(m);

      // context = stack.pop();
      continue;
    }

    if ("#^".includes(tag[0])) {
      if (contextVariablesObj[tag.substring(1)]) {
        setVar(tag.substring(1), true);
        stack.push(context);
        continue;
      } else continue;
    }

    if (tag.startsWith("/")) {
      context = stack.pop();
      continue;
    }

    setVar(tag, "");
  }

  return Object.keys(root) as string[];
};

function extractVariableNames(inputString: string) {
  const pattern = /'([^']*)'|"([^"]*)"/g;
  const quotedParts = inputString.match(pattern) || [];

  // Replacing quoted parts with empty strings
  quotedParts.forEach((quotedPart) => {
    inputString = inputString.replace(quotedPart, "");
  });

  const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const variableNames = inputString.match(variablePattern) || [];

  return variableNames;
}


function extractVariablesAndStrings(input: string): string[] {
  const results: string[] = [];
  let currentToken = '';
  let withinQuotes = false;
  let currentQuote = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"' || char === "'") {
      if (withinQuotes && char === currentQuote) {
        currentToken += char;
        results.push(currentToken);
        currentToken = '';
        withinQuotes = false;
      } else if (!withinQuotes) {
        withinQuotes = true;
        currentQuote = char;
        currentToken += char;
      }
    } else if (char === ' ' && !withinQuotes) {
      if (currentToken) {
        results.push(currentToken);
      }
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    results.push(currentToken);
  }

  return results;
}

function removeScriptOccurrences(text: string): string {
  const pattern = /\{\{#script\}\}[\s\S]*?\{\{\/script\}\}/g;
  const pattern2 = /\{\{\{\{script\}\}\}\}[\s\S]*?\{\{\{\{\/script\}\}\}\}/g;
  return text.replace(pattern2, "").replace(pattern, "");
}
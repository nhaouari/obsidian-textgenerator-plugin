import Helpersfn from "#/helpers/handlebars-helpers";
import set from "lodash.set";

const helpers: string[] = Object.keys(Helpersfn({} as any));

const ignoredVariables = ["output", "this", "true", "false"];
const defaultHelpers = ["if", "unless", "with", "each"];

export const getHBValues = (text: string) => {
  const re = /{{[{]?(.*?)[}]?}}/g;
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
    console.log({ tag, tags });

    if (
      // if its a inside variable
      tag.startsWith("VAR_") ||
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
      helpers.includes(tag)
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

    for (const helper of helpers) {
      if (tag.startsWith(`${helper} `) || tag.startsWith(`#${helper} `)) {
        const vars = tag.split(" ").slice(1);
        tags.push(...vars);
        continue main;
      }
    }

    for (const helper of defaultHelpers) {
      if (tag.startsWith(`${helper} `) || tag.startsWith(`#${helper} `)) {
        const vars = tag.split(" ").slice(1);
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
      //   setVar(tag.substr(1), true);
      //   stack.push(context);
      continue;
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

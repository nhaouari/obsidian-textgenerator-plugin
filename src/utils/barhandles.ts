import set from "lodash.set";

const ignoredVariables = ["output"];

export const getHBValues = (text: string) => {
  const re = /{{[{]?(.*?)[}]?}}/g;
  const tags: any = [];
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

  for (const tag of tags) {
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

    if (tag.startsWith("get ") || tag.startsWith("#get ")) {
      //   context = stack.pop();
      continue;
    }

    if (tag.startsWith("log ") || tag.startsWith("#log")) {
      //   context = stack.pop();
      continue;
    }

    if (tag.startsWith("error ") || tag.startsWith("#error")) {
      //   context = stack.pop();
      continue;
    }

    if (tag.startsWith("notice ") || tag.startsWith("#notice")) {
      //   context = stack.pop();
      continue;
    }

    if (tag.startsWith("escp ") || tag.startsWith("escp2 ")) {
      const vars = tag.split(" ").slice(1);
      for (const v of vars) {
        setVar(v, true);
      }
      stack.push(context);
      continue;
    }

    if ("#^".includes(tag[0])) {
      //   setVar(tag.substr(1), true);
      //   stack.push(context);
      continue;
    }

    if (tag.startsWith("#if")) {
      const vars = tag.split(" ").slice(1);
      for (const v of vars) {
        setVar(v, true);
      }
      stack.push(context);
      continue;
    }

    if (
      tag.startsWith("run ") ||
      tag.startsWith("#run ") ||
      tag.startsWith("extract ") ||
      tag.startsWith("#extract ")
    ) {
      if (tag.split(" ").length > 2) {
        const arr = (tag.split(" ") as string[]) || [];
        arr.shift();
        arr.shift();
        const v = arr.join(" ");
        const newContext = {};
        context[v] = newContext;
        stack.push(context);
        context = newContext;
      }
      //   context = stack.pop();
      continue;
    }

    if (tag.startsWith("#with ")) {
      const v = tag.split(" ")[1];
      const newContext = {};
      context[v] = newContext;
      stack.push(context);
      context = newContext;
      continue;
    }

    if (tag.startsWith("/with")) {
      context = stack.pop();
      continue;
    }

    if (tag.startsWith("#unless ")) {
      const v = tag.split(" ")[1];
      setVar(v, true);
      stack.push(context);
      continue;
    }

    if (tag.startsWith("/unless")) {
      context = stack.pop();
      continue;
    }

    if (tag.startsWith("#each ")) {
      const v = tag.split(" ")[1];
      const newContext = {};
      context[v] = [newContext];
      stack.push(context);
      context = newContext;
      continue;
    }

    if (tag.startsWith("/each")) {
      context = stack.pop();
      continue;
    }

    if (tag.startsWith("/")) {
      context = stack.pop();
      continue;
    }

    setVar(tag, "");
  }

  return Object.keys(root).filter(
    (v) => !ignoredVariables.includes(v)
  ) as string[];
};

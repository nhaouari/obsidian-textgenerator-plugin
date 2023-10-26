import { Command, Editor } from "obsidian";
import TextGeneratorPlugin from "../../main";
import React, { useEffect, useMemo, useState } from "react";
import { InputContext, contextVariablesObj } from "../../context-manager";
import { PlaygroundView } from ".";
import CopyButton from "../components/copyButton";
import useStateView from "../context/useStateView";
import MarkDownViewer from "../components/Markdown";
import useGlobal from "../context/global";
import { Handlebars } from "#/helpers/handlebars-helpers";
import clsx from "clsx";
import AvailableVars from "../components/availableVars";
import { makeId } from "#/utils";

export default function ChatComp(props: {
  plugin: TextGeneratorPlugin;
  setCommands: (commands: Command[]) => void;
  view: PlaygroundView;
  onEvent: (cb: (name: string) => void) => void;
}) {
  const [input, setInput] = useStateView<string>("", "input", props.view);

  const [answer, setAnswer] = useStateView("", "answer", props.view);

  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState("");

  const [abortController, setAbortController] = useState(new AbortController());

  const firstTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const createTemplate = () => {
    props.plugin.textGenerator.createTemplate(
      firstTextareaRef.current?.value || "",
      "new_template_" + makeId(4), {
      disableProvider: true
    }
    );
  };

  useEffect(() => {
    let onGoing = true;
    props.onEvent((name: string) => {
      if (onGoing)
        switch (name) {
          case "Pin":
            props.view.leaf.togglePinned();
            break;
          case "OnTop": {
            props.view.toggleAlwaysOnTop();
            break;
          }
          case "popout":
            props.view.app.workspace.moveLeafToPopout(props.view.leaf);
            break;

          case "createTemplate":
            createTemplate();
            break;

          default:
            throw new Error(
              `event ${name}, not implemented in the tool react component.`
            );
        }
    });

    return () => {
      onGoing = false;
    };
  }, []);

  useEffect(() => {
    setWarn(
      input.includes("{{run") || input.includes("{{#run")
        ? "It might consume tokens because of the run command"
        : ""
    );
  }, [input]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    try {
      // @ts-ignore
      const editor = app.workspace.getLeaf().view?.editor as Editor;

      const context =
        await props.plugin.textGenerator.contextManager.getContext({
          insertMetadata: false,
          editor: editor,
          templateContent: input,
          addtionalOpts: {
            content: editor?.getValue(),
          },
        });

      console.log({
        editor,
        context,
      });

      const result = await Handlebars.compile(input)({
        ...context.options,
        templatePath: "default/default"
      });

      console.log({ result });

      setAnswer(result);
    } catch (err: any) {
      console.error(err);
      setAnswer(
        `ERR: ${err?.message?.replace("stack:", "\n\n\n\nMore Details") || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const stopLoading = (e: any) => {
    e.preventDefault();
    abortController.abort();
    setAbortController(new AbortController());
    setLoading(false);
  };

  return (
    <form className="flex h-full w-full flex-col gap-2" onSubmit={handleSubmit}>
      <div
        className={clsx(
          "min-h-[200px] flex w-full resize-y flex-col justify-end gap-2 overflow-x-hidden overflow-y-scroll pb-2",
          {
            "dz-tooltip dz-tooltip-bottom": warn,
          }
        )}
      >
        <textarea
          dir="auto"
          ref={firstTextareaRef}
          rows={2}
          placeholder="Template"
          className={clsx(
            "markdown-source-view min-h-16 h-full w-full resize-y rounded border border-gray-300 p-2 outline-2 focus:border-blue-500 focus:outline-none",
            {
              "focus:border-yellow-400": warn,
            }
          )}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.shiftKey && e.code == "Enter") return handleSubmit(e);
          }}
          value={input}
        />
      </div>
      <div className="">
        <AvailableVars vars={contextVariablesObj} />
      </div>
      <div className="flex justify-end gap-3 pr-3">
        <span className="text-xs opacity-50">{warn}</span>
        {loading ? (
          <button
            onClick={stopLoading}
            className="rounded bg-red-500 px-6 py-2 font-semibold hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="rounded bg-blue-500 px-6 py-2 font-semibold hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
          >
            Preview
          </button>
        )}
        {answer && <CopyButton textToCopy={answer} justAButton />}
      </div>
      <div className="min-h-16 w-full">
        {answer ? (
          <MarkDownViewer className="h-full w-full select-text overflow-y-auto">
            {answer}
          </MarkDownViewer>
        ) : (
          <div className="h-full text-sm opacity-50">(empty)</div>
        )}
      </div>
    </form>
  );
}

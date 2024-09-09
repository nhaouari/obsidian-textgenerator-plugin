import { Command, Editor } from "obsidian";
import TextGeneratorPlugin from "../../main";
import React, { useEffect, useMemo, useState } from "react";
import { contextVariablesObj } from "../../scope/context-manager";
import { PlaygroundView } from ".";
import CopyButton from "../components/copyButton";
import useStateView from "../context/useStateView";
import MarkDownViewer from "../components/Markdown";
import useHoldingKey from "../components/useHoldingKey";
import { Handlebars } from "#/helpers/handlebars-helpers";
import clsx from "clsx";
import AvailableVars from "../components/availableVars";
import { makeId } from "#/utils";
import ContentManagerCls from "#/scope/content-manager";
import CodeEditor from "../components/codeEditor";

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
      "new_template_" + makeId(4),
      {
        disableProvider: true,
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
    const wasHoldingCtrl = holding.ctrl;

    event.preventDefault();
    setLoading(true);
    try {
      const templateContent = input;

      const editor = ContentManagerCls.compile(
        props.plugin.app.workspace.getLeaf().view,
        props.plugin,
        {
          templateContent
        }
      );

      const selection = await props.plugin.contextManager.getSelection(editor);
      const selections =
        await props.plugin.contextManager.getSelections(editor);


      const context = await props.plugin.contextManager.getContext({
        insertMetadata: false,
        editor: editor,
        templateContent,
        addtionalOpts: {
          content: editor?.getValue(),
          selections: selections.length < 1 ? [selection] : selections,
          selection,
        },
      });

      const inputContext = {
        ...props.plugin.textGenerator.LLMProvider.getSettings(),
        requestParams: {
          signal: abortController.signal,
        },
      }

      const result = await props.plugin.contextManager.execDataview(
        await Handlebars.compile(
          props.plugin.contextManager.overProcessTemplate(templateContent)
        )({
          ...context.options,
          templatePath: "default/default",
          inputContext
        })
      );

      if (wasHoldingCtrl) {
        setAnswer(
          await props.plugin.textGenerator.LLMProvider.generate(
            [
              {
                role: "human",
                content: result,
              },
            ],
            inputContext,
            async (token, first) => {
              if (first) setAnswer("");
              setAnswer((a) => a + token);
            }
          )
        );
      } else setAnswer(result);
    } catch (err: any) {
      console.error(err);
      setAnswer(
        `ERR: ${err?.message?.replace("stack:", "\n\n\n\nMore Details") ||
        err.message ||
        err
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const holding = useHoldingKey();

  const stopLoading = (e: any) => {
    e.preventDefault();
    abortController.abort();
    setAbortController(new AbortController());
    setLoading(false);
  };

  return (
    <form
      className="plug-tg-flex plug-tg-h-full plug-tg-w-full plug-tg-flex-col plug-tg-gap-2"
      onSubmit={handleSubmit}
    >

      <div className={clsx(
        "plug-tg-flex plug-tg-min-h-[200px] plug-tg-w-full plug-tg-resize-y plug-tg-flex-col plug-tg-justify-end plug-tg-gap-2 plug-tg-overflow-x-hidden plug-tg-overflow-y-scroll plug-tg-bg-gray-400/10 plug-tg-pb-2 plug-tg-outline-1",
        {
          "plug-tg-tooltip plug-tg-tooltip-bottom": warn,
        }
      )}>
        <CodeEditor value={input} setValue={(str) => setInput(str)} />
      </div>
      {/* <textarea
          dir="auto"
          ref={firstTextareaRef}
          rows={2}
          placeholder="Template"
          className={clsx(
            "markdown-source-view plug-tg-min-h-16 plug-tg-h-full plug-tg-w-full plug-tg-resize-y plug-tg-rounded plug-tg-border plug-tg-border-gray-300 plug-tg-p-2 plug-tg-outline-2 focus:plug-tg-border-blue-500 focus:plug-tg-outline-none",
            "plug-tg-input plug-tg-w-full plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-outline-none",
            {
              "focus:border-yellow-400": warn,
            }
          )}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.shiftKey && e.code == "Enter") return handleSubmit(e);
          }}
          value={input}
        /> */}
      <div>
        <AvailableVars vars={contextVariablesObj} />
      </div>
      <div className="plug-tg-flex plug-tg-justify-end plug-tg-gap-3 plug-tg-pr-3">
        <span className="plug-tg-text-xs plug-tg-opacity-50">{warn}</span>
        {loading ? (
          <button
            onClick={stopLoading}
            className="plug-tg-rounded plug-tg-bg-red-500 plug-tg-px-6 plug-tg-py-2 plug-tg-font-semibold hover:plug-tg-bg-red-600 focus:plug-tg-outline-none focus:plug-tg-ring-4 focus:plug-tg-ring-blue-300/50"
          >
            Stop
          </button>
        ) : holding.ctrl ? (
          <button
            type="submit"
            data-tip="unhold ctrl to use preview"
            className="plug-tg-tooltip plug-tg-tooltip-bottom plug-tg-rounded plug-tg-bg-blue-500 plug-tg-px-6 plug-tg-py-2 plug-tg-font-semibold hover:plug-tg-bg-blue-600 focus:plug-tg-outline-none focus:plug-tg-ring-4 focus:plug-tg-ring-blue-300/50"
          >
            Run
          </button>
        ) : (
          <button
            type="submit"
            data-tip="hold ctrl to use run"
            className="plug-tg-tooltip plug-tg-tooltip-bottom plug-tg-rounded plug-tg-bg-blue-500 plug-tg-px-6 plug-tg-py-2 plug-tg-font-semibold hover:plug-tg-bg-blue-600 focus:plug-tg-outline-none focus:plug-tg-ring-4 focus:plug-tg-ring-blue-300/50"
          >
            Preview
          </button>
        )}
        {answer && <CopyButton textToCopy={answer} justAButton />}
      </div>
      <div className="plug-tg-min-h-16 plug-tg-w-full">
        {answer ? (
          <MarkDownViewer
            className="plug-tg-h-full plug-tg-w-full plug-tg-select-text plug-tg-overflow-y-auto"
            editable
          >
            {answer}
          </MarkDownViewer>
        ) : (
          <div className="plug-tg-h-full plug-tg-text-sm plug-tg-opacity-50">
            (empty)
          </div>
        )}
      </div>
    </form>
  );
}

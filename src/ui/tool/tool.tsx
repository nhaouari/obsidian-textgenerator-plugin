import { Command, Editor } from "obsidian";
import TextGeneratorPlugin from "../../main";
import React, { useEffect, useMemo, useState } from "react";
import { InputContext } from "../../context-manager";
import safeAwait from "safe-await";
import { VIEW_TOOL_ID, ToolView } from ".";
import CopyButton from "../components/copyButton";
import useStateView from "../context/useStateView";
import MarkDownViewer from "../components/Markdown";

export default function ChatComp(props: {
  plugin: TextGeneratorPlugin;
  setCommands: (commands: Command[]) => void;
  view: ToolView;
  onEvent: (cb: (name: string) => void) => void;
}) {
  const [selectedTemplatePath, setSelectedTemplatePath] = useState(
    props.view?.getState()?.templatePath
  );

  const config = useMemo<{
    templatePath: string;
    context: InputContext;
    editor?: Editor;
  }>(() => props.view?.getState(), []);

  const [vals, setVals] = useStateView<Record<string, any>>(
    {},
    "vals",
    props.view
  );

  const vars = Object.keys(vals);

  const [answer, setAnswer] = useStateView("", "answer", props.view);

  const [loading, setLoading] = useState(false);

  const [abortController, setAbortController] = useState(new AbortController());

  const firstTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [meta, setMeta] = useStateView<{ name?: string; description?: string }>(
    {},
    "meta",
    props.view
  );

  const openSource = () => {
    props.view.app.workspace.openLinkText(
      "",
      props.view.getState().templatePath,
      true
    );
  };

  useEffect(() => {
    (async () => {
      // make sure that tempPath is accesible, it takes a random amount of time
      // before the view state gets updated with the right values.
      await new Promise((s) => {
        const inter = setInterval(() => {
          const tp = props.view?.getState()?.templatePath;
          if (tp) {
            clearInterval(inter);
            s(tp);
          }
        }, 500);
      });
      setSelectedTemplatePath(props.view?.getState()?.templatePath);
    })();
  }, []);

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

          case "source":
            openSource();
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
    if (!selectedTemplatePath) return;
    (async () => {
      await props.view.leaf.setViewState({
        state: { ...config, templatePath: selectedTemplatePath },
        type: VIEW_TOOL_ID,
      });

      const metadata = props.plugin.textGenerator.getMetadata(
        selectedTemplatePath || ""
      );

      setMeta(metadata);

      const templateFile = props.plugin.app.vault.getAbstractFileByPath(
        selectedTemplatePath || ""
      );

      const [errortemplateContent, templateContent] = templateFile?.path
        ? await safeAwait(
          //@ts-ignore
          props.plugin.app.vault.adapter.read(templateFile?.path)
        )
        : ["", ""];

      if (errortemplateContent) {
        return Promise.reject(errortemplateContent);
      }

      if (!templateContent) {
        return Promise.reject(
          `templateContent is undefined(${selectedTemplatePath}, ${templateFile?.name})`
        );
      }

      const { inputContent, outputContent, preRunnerContent } =
        props.plugin.textGenerator.contextManager.splitTemplate(
          templateContent
        );

      // const variables = this.contextManager
      //   .extractVariablesFromTemplate(inputContent)
      //   .filter((variable) => !variable.includes("."));



      const variables = props.plugin.textGenerator.contextManager.getHBVariablesOfTemplate(
        preRunnerContent, inputContent, outputContent)

      const templateContext =
        await props.plugin.textGenerator.contextManager.getTemplateContext({
          editor: config.editor,
          templatePath: config.templatePath,
          filePath: props.plugin.app.workspace.activeEditor?.file?.path,
        });

      setVals((vs) => {
        for (const v of variables) {
          if (typeof vs[v] == "undefined") vs[v] = templateContext[v] || "";
        }
        return { ...vs };
      });
    })();
  }, [selectedTemplatePath]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    try {
      const context =
        await props.plugin.textGenerator.contextManager.getContext({
          insertMetadata: false,
          templatePath: selectedTemplatePath,
          editor: config.editor,
          addtionalOpts: vals,
        });

      const strm = await props.plugin.textGenerator.streamGenerate(
        context,
        false,
        {},
        context.templatePath,
        {
          showSpinner: false,
          signal: abortController.signal,
        }
      );

      const allText =
        (await strm?.(
          async (cntnt, first) => {
            const content = cntnt;
            //   console.log({ content, first });
            if (first) setAnswer(content);
            else setAnswer((a) => a + content);
            return content;
          },
          (err) => {
            throw err;
          }
        )) || "";

      setAnswer(allText);
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

  const handleChange = (varName: string) => (event: any) => {
    setVals((vals) => {
      const values = { ...vals };
      vals[varName] = event.target?.value;
      return values;
    });
  };

  const stopLoading = (e: any) => {
    e.preventDefault();
    abortController.abort();
    setAbortController(new AbortController());
    setLoading(false);
  };

  return (
    <form className="flex h-full w-full flex-col gap-2" onSubmit={handleSubmit}>
      <div className="min-h-16 flex w-full resize-y flex-col justify-end gap-6 overflow-y-scroll pb-2">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-full flex-col gap-4">
            {vars.map((label, index) => (
              <div key={label} className="">
                <div className="flex flex-col">
                  <textarea
                    dir="auto"
                    ref={index === 0 ? firstTextareaRef : null}
                    rows={2}
                    placeholder={label}
                    className="markdown-source-view w-full resize-y rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                    onChange={handleChange(label)}
                    onKeyDown={(e) => {
                      if (e.shiftKey) return;

                      if (e.code == "Enter") handleSubmit(e);
                    }}
                    value={vals[label]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pr-3">
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
            Generate
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

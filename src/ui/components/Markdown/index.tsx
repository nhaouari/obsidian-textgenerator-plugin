import React from "react";
import { useEffect, useRef } from "react";

import { MarkdownRenderer } from "obsidian";
import TextGeneratorPlugin from "#/main";
import useGlobal from "#/ui/context/global";
import clsx from "clsx";

export default function MarkDownViewer(props: {
  children: string;
  className?: string;
  plugin?: TextGeneratorPlugin;
  editable?: boolean;
}) {
  // Create an array of refs for each insight item
  const ref = useRef<HTMLDivElement>(null);
  let Global: ReturnType<typeof useGlobal>;

  try {
    Global = useGlobal();
  } catch {
    // empty
  }

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    MarkdownRenderer.render(
      Global?.plugin.app || app,
      props.children,
      ref.current,
      "",
      props.plugin || Global.plugin
    );
  }, [props.children, ref.current]);

  return (
    <div
      className={clsx("markdown-source-view", props.className)}
      ref={ref}
      contentEditable={props.editable}
      onClick={(e) => e.preventDefault()}
    ></div>
  );
}

import React, { useMemo, useState } from "react";
import CopyButton from "./copyButton";
import clsx from "clsx";

export default function AvailableVars(props: {
  vars: Record<
    string,
    {
      example: string;
      hint?: string;
    }
  >;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const varsArr = useMemo(() => Object.keys(props.vars), []);
  return (
    <>
      <details className="plug-tg-collapse plug-tg-collapse-arrow">
        <summary className="plug-tg-collapse-title plug-tg-opacity-50">
          Examples
        </summary>
        <div className="plug-tg-collapse-content plug-tg-h-full plug-tg-max-h-32 plug-tg-overflow-y-auto plug-tg-overflow-x-hidden">
          <div className="plug-tg-flex plug-tg-h-full plug-tg-flex-wrap plug-tg-gap-2">
            {varsArr.map((v: any) => {
              return (
                <div
                  key={v}
                  className={clsx(
                    "plug-tg-text-xs",
                    hovered == v ? "plug-tg-opacity-100" : "plug-tg-opacity-95"
                  )}
                  onMouseEnter={() => setHovered(v)}
                >
                  <CopyButton
                    justADiv
                    key={v}
                    className="plug-tg-cursor-pointer plug-tg-select-all"
                    textToCopy={props.vars[v].example}
                  >
                    {`{{${v}}}`}
                  </CopyButton>
                </div>
              );
            })}
          </div>
        </div>
        {hovered && (
          <div className="plug-tg-pb-3 plug-tg-text-xs">
            <span className="plug-tg-opacity-60">{hovered}</span>:{" "}
            {props.vars[hovered as string].hint ||
              props.vars[hovered as string].example}
          </div>
        )}
      </details>
    </>
  );
}

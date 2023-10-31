import React, { useMemo, useState } from "react";
import CopyButton from "./copyButton";

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
      <details className="dz-collapse dz-collapse-arrow">
        <summary className="dz-collapse-title opacity-50">
          Examples
        </summary>
        <div className="dz-collapse-content h-full max-h-32 overflow-y-auto overflow-x-hidden">
          <div className="flex h-full flex-wrap gap-2">
            {varsArr.map((v: any) => {
              return (
                <div
                  key={v}
                  className="text-xs"
                  onMouseEnter={() => setHovered(v)}
                >
                  <CopyButton
                    justADiv
                    key={v}
                    className="cursor-pointer select-all"
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
          <div className="pb-3 text-xs ">
            <span className="opacity-60">{hovered}</span>:{" "}
            {props.vars[hovered as string].hint ||
              props.vars[hovered as string].example}
          </div>
        )}
      </details>
    </>
  );
}

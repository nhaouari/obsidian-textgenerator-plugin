import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Register } from "../sections";
export default function SettingsSection(props: {
  title: string;
  alwaysOpen?: boolean;
  collapsed?: boolean;
  hideTitle?: boolean;
  children?: any;
  className?: any;
  hidden?: boolean;
  triggerResize?: boolean;
  register: Register;
  id: string;
}) {
  const [_collapsed, setCollapsed] = useState(true);
  const collapsed = !props.alwaysOpen && _collapsed;
  useEffect(() => {
    props.register.register(props.id, props.title, "");
  }, [props.id]);

  useEffect(
    () => setCollapsed(!props.register.searchTerm.length),
    [props.register.searchTerm.length]
  );

  return (
    <div
      className={clsx("dz-collapse", props.className, {
        "opacity-50 max-h-16": collapsed,
        "dz-collapse-open": !collapsed,
        hidden: props.hidden || !props.register.activeSections[props.id],
      })}
    >
      {!props.hideTitle && (
        <div className="dz-collapse-title cursor-pointer">
          <div
            className="flex w-full flex-wrap items-center justify-between text-left font-medium "
            data-accordion-target="#accordion-flush-body-1"
            aria-expanded="true"
            aria-controls="accordion-flush-body-1"
            onClick={() => setCollapsed((o) => !o)}
          >
            <h3>{props.title}</h3>
            {!props.alwaysOpen && (
              <svg
                data-accordion-icon
                className={clsx("h-3 w-3 shrink-0 transition-transform", {
                  "-rotate-180": !collapsed,
                  "-rotate-90": collapsed,
                })}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5 5 1 1 5"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className={clsx("dz-collapse-content h-full w-full")}>
        {props.children}
      </div>
    </div>
  );
}

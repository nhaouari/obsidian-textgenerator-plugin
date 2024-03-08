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
    props.register.register(props.id, props.title, props.id);
  }, [props.id]);

  useEffect(
    () => setCollapsed(!props.register.searchTerm.length),
    [props.register.searchTerm.length]
  );

  return (
    <div
      className={clsx("plug-tg-collapse", props.className, {
        "plug-tg-max-h-16 plug-tg-opacity-50": collapsed,
        "plug-tg-collapse-open": !collapsed,
        "plug-tg-hidden":
          props.hidden || !props.register.activeSections[props.id],
      })}
    >
      {!props.hideTitle && (
        <div
          className={clsx(
            "plug-tg-group  plug-tg-cursor-pointer plug-tg-px-2",
            {
              "hover:plug-tg-bg-gray-100/10": collapsed,
            }
          )}
        >
          <div
            className="plug-tg-flex plug-tg-w-full plug-tg-flex-wrap plug-tg-items-center plug-tg-justify-between plug-tg-text-left plug-tg-font-medium"
            data-accordion-target="#accordion-flush-body-1"
            aria-expanded="true"
            aria-controls="accordion-flush-body-1"
            onClick={() => setCollapsed((o) => !o)}
          >
            <h3>{props.title}</h3>
            {!props.alwaysOpen && (
              <svg
                data-accordion-icon
                className={clsx(
                  "plug-tg-h-3 plug-tg-w-3 plug-tg-shrink-0 plug-tg-transition-all",
                  {
                    "-plug-tg-rotate-180": !collapsed,
                    "plug-tg-upsidedown": collapsed,
                    "plug-tg-hidden group-hover:plug-tg-block": collapsed,
                  }
                )}
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

      <div
        className={clsx(
          "plug-tg-collapse-content plug-tg-h-full plug-tg-w-full"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

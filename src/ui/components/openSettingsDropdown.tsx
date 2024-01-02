import React, { useEffect } from "react";
import { IconDotsVertical } from "@tabler/icons-react";
import { useBoolean } from "usehooks-ts";
import clsx from "clsx";
export default function OpenSettingsDropdown(props: { children?: any }) {
  const { value: isOpen, toggle, setFalse: close } = useBoolean(false);

  useEffect(() => {
    if (!isOpen) return;
    const listener = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        if (e.target.closest(".dropdown")) return;
        close();
      }
    };

    window.addEventListener("click", listener);

    return () => window.removeEventListener("click", listener);
  }, [isOpen]);

  return (
    <div className="plug-tg-dropdown plug-tg-dropdown-end plug-tg-dropdown-open plug-tg-relative plug-tg-select-none">
      <label tabIndex={0} className="plug-tg-cursor-pointer" onClick={toggle}>
        <IconDotsVertical
          size={24}
          className={clsx("hover:plug-tg-text-blue-300", {
            "plug-tg-text-blue-700 dark:plug-tg-text-blue-300": isOpen,
          })}
        />
      </label>
      {isOpen && (
        <div className="plug-tg-w-38 plug-tg-border-faint plug-tg-bg-accent-light plug-tg-menu plug-tg-absolute plug-tg-right-0 plug-tg-top-full plug-tg-rounded-lg plug-tg-bg-[var(--background-primary)] plug-tg-p-2 plug-tg-shadow">
          {props.children}
        </div>
      )}
    </div>
  );
}

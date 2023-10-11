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
    <div className="dz-dropdown dz-dropdown-end dz-dropdown-open relative select-none">
      <label tabIndex={0} className="cursor-pointer" onClick={toggle}>
        <IconDotsVertical
          size={24}
          className={clsx("hover:text-blue-300", {
            "text-blue-700 dark:text-blue-300": isOpen,
          })}
        />
      </label>
      {isOpen && (
        <div className="w-38 border-faint bg-accent-light dz-menu absolute right-0 top-full rounded-lg bg-[var(--background-primary)] p-2 shadow">
          {props.children}
        </div>
      )}
    </div>
  );
}

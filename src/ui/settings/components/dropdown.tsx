"use client";
import clsx from "clsx";
import React, { useMemo } from "react";
import { useEffect } from "react";
import { useBoolean } from "usehooks-ts";

export default function Dropdown<T extends string>(props: {
  value?: T | any;
  values: T[] | readonly T[];
  defaultValue?: string;
  setValue: (_newvaL: T) => void;
  righty?: boolean;
  className?: any;
  aliases?: Record<any, string>
}) {
  const { value: isOpen, toggle, setFalse: close } = useBoolean(false);
  const slugs = useMemo(() => {
    return props.values.map((v) => {
      const val = v
      return val == "Default" ? "Custom" : val;
    });
  }, [props.values]);

  useEffect(() => {
    if (!isOpen) return;
    const listener = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        if (e.target.closest(".dropdown")) return;
        close();
      }
    };

    document.addEventListener("click", listener);

    return () => document.removeEventListener("click", listener);
  }, [isOpen]);

  return (
    <>
      <select
        className={clsx(
          "plug-tg-select plug-tg-cursor-pointer plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-px-4",
          props.className
        )}
        value={props.value || ""}
        onChange={(e) => props.setValue?.(e.target.value as any)}
      >
        {!props.values.includes(props.value) && <option value={props.value} key={-1} className="plug-tg-z-20 plug-tg-w-full">
          {props.value}*
        </option>}
        {props.values?.map((val, i) => (
          <option value={val} key={i} className="plug-tg-z-20 plug-tg-w-full">
            {props.aliases?.[slugs[i]] || slugs[i]}
          </option>
        ))}
      </select>
    </>
  );
}

import React from "react";
import { useEffect, useId } from "react";
import { useBoolean } from "usehooks-ts";

export default function DropdownSearch<T extends string>(props: {
  value?: T | any;
  values: T[] | readonly T[];
  defaultValue?: string;
  setValue: (_newvaL: T) => void;
  righty?: boolean;
  className?: any;
  placeHolder?: string;
  aliases?: Record<any, any>;
}) {
  const { value: isOpen, toggle, setFalse: close } = useBoolean(false);

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

  const datalistId = useId();

  return (
    <>
      <datalist id={datalistId}>
        {[...props.values].map((val) => (
          <option key={val} value={props.aliases?.[val] || val}></option>
        ))}
      </datalist>

      <input
        className="input"
        type="search"
        value={props.aliases?.[props.value] || props.value || ""}
        list={datalistId}
        placeholder={props.placeHolder || "Enter your Model name"}
        onChange={(e) => {
          let val = ("" + e.target.value) as any;

          if (props.aliases)
            for (const key in props.aliases) {
              if (props.aliases[key] === val) val = key;
            }

          props.setValue(val ?? props.defaultValue);
        }}
      />
    </>
  );
}

import React, { useState } from "react";
import { IconEyeClosed, IconEye } from "@tabler/icons-react";
import clsx from "clsx";
import { ZodSchema } from "zod";

export default function Input(props: {
  type?: string;
  value: any;
  placeholder?: string;
  datalistId?: string;
  setValue: (nval: string) => void;
  className?: string;
  validator?: ZodSchema;
}) {
  const [value, setValue] = useState<any>(props.value);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  return (
    <div
      className={clsx("plug-tg-flex plug-tg-items-center plug-tg-gap-2 ", {
        "checkbox-container plug-tg-cursor-pointer": props.type == "checkbox",
        "is-enabled": props.type == "checkbox" && props.value == "true",
        "plug-tg-tooltip": error,
      })}
      onClick={
        props.type == "checkbox"
          ? (e) => {
            props.setValue(props.value != "true" ? "true" : "false");
          }
          : undefined
      }
      data-tip={error || ""}
    >
      <input
        type={
          props.type == "password"
            ? showPass
              ? "search"
              : "password"
            : props.type
        }
        list={props.datalistId}
        placeholder={props.placeholder}
        className={clsx(
          "plug-tg-input plug-tg-bg-[var(--background-modifier-form-field)]",
          {
            "plug-tg-toggle": props.type == "checkbox",
            "plug-tg-outline plug-tg-outline-red-400 plug-tg-text-red-300": error,
          },
          props.className
        )}
        value={value}
        defaultChecked={
          props.type == "checkbox" ? props.value == "true" : undefined
        }
        onChange={
          props.type != "checkbox"
            ? (e) => {
              try {
                setValue(e.target.value);

                const v =
                  props.type == "number"
                    ? e.target.valueAsNumber || 0
                    : e.target.value;

                setError("");
                props.validator?.parse(v);
                props.setValue("" + v);
              } catch (err: any) {
                setError(JSON.parse(err?.message)?.[0]?.message);
              }
            }
            : undefined
        }
      />
      {props.type == "password" && (
        <button onClick={() => setShowPass((i) => !i)}>
          {!showPass ? <IconEyeClosed /> : <IconEye />}
        </button>
      )}
    </div>
  );
}

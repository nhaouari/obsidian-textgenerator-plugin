import React, { useState } from "react";
import { IconEyeClosed, IconEye } from "@tabler/icons-react";
import clsx from "clsx";
import { ZodSchema } from "zod";

export default function Input(props: {
  type?: string;
  value: any;
  placeholder?: string;
  setValue: (nval: string) => void;
  className?: string;
  validator?: ZodSchema;
}) {
  const [value, setValue] = useState<any>(props.value);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  return (
    <div
      className={clsx("flex items-center gap-2 ", {
        "checkbox-container cursor-pointer": props.type == "checkbox",
        "is-enabled": props.type == "checkbox" && props.value == "true",
        "dz-tooltip": error,
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
              ? "text"
              : "password"
            : props.type
        }
        placeholder={props.placeholder}
        className={clsx(
          "dz-input bg-[var(--background-modifier-form-field)]",
          {
            "dz-toggle": props.type == "checkbox",
            "outline outline-red-400 text-red-300": error,
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

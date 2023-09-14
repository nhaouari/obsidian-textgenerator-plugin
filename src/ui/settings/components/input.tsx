import React, { useState } from "react";
import { IconEyeClosed, IconEye } from "@tabler/icons-react";
import clsx from "clsx";

export default function Input(props: {
  type?: string;
  value: string;
  placeholder?: string;
  setValue: (nval: string) => void;
  className?: string;
}) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div
      className={clsx("flex items-center gap-2 ", {
        "checkbox-container cursor-pointer": props.type == "checkbox",
        "is-enabled": props.type == "checkbox" && props.value == "true",
      })}
      onClick={
        props.type == "checkbox"
          ? (e) => {
              props.setValue(props.value != "true" ? "true" : "false");
            }
          : undefined
      }
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
          },
          props.className
        )}
        value={props.value}
        defaultChecked={
          props.type == "checkbox" ? props.value == "true" : undefined
        }
        onChange={
          props.type != "checkbox"
            ? (e) => {
                props.setValue(e.target.value);
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

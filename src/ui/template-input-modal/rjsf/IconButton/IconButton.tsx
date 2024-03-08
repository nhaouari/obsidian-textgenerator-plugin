import React from "react";
import { AiOutlineArrowDown } from "@react-icons/all-files/ai/AiOutlineArrowDown";
import { AiOutlineArrowUp } from "@react-icons/all-files/ai/AiOutlineArrowUp";
import { IoIosCopy } from "@react-icons/all-files/io/IoIosCopy";
import { IoIosRemove } from "@react-icons/all-files/io/IoIosRemove";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils";

export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    icon,
    iconType,
    className,
    uiSchema,
    registry,
    disabled,
    ...otherProps
  } = props;
  const buttonClass = iconType === "block" ? "plug-tg-w-full" : "";
  const variantClass =
    // @ts-expect-error incomplete type from rjsf
    props.variant === "danger"
      ? "plug-tg-bg-red-500 hover:plug-tg-bg-red-700 plug-tg-text-white"
      : disabled
      ? "plug-tg-bg-gray-100 plug-tg-text-gray-300"
      : "plug-tg-bg-gray-200 hover:plug-tg-bg-gray-500 plug-tg-text-gray-700";

  return (
    <button
      className={`plug-tg-grid plug-tg-justify-items-center plug-tg-px-4 plug-tg-py-2 plug-tg-text-base plug-tg-font-normal ${buttonClass} ${variantClass} ${className}`}
      {...otherProps}
    >
      {icon}
    </button>
  );
}

export function CopyButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.CopyButton)}
      {...props}
      icon={<IoIosCopy />}
    />
  );
}

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<AiOutlineArrowDown />}
    />
  );
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<AiOutlineArrowUp />}
    />
  );
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      // @ts-expect-error incomplete props from rjsf
      variant="danger"
      icon={<IoIosRemove />}
    />
  );
}

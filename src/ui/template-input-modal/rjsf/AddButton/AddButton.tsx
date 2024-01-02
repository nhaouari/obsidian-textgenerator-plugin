import { BsPlus } from "@react-icons/all-files/bs/BsPlus"
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils"
import clsx from "clsx"
import React from "react"

export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry
  return (
    <button
      {...props}
      style={{ width: "100%" }}
      className={clsx(`plug-tg-ml-1 plug-tg-grid plug-tg-justify-items-center plug-tg-bg-blue-500 plug-tg-px-4 plug-tg-py-2 plug-tg-text-base plug-tg-font-normal plug-tg-text-white hover:plug-tg-bg-blue-700`, props.className)}
      title={translateString(TranslatableString.AddItemButton)}
    >
      <BsPlus />
    </button>
  )
}

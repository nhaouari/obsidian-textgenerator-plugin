import {
  FormContextType,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  TitleFieldProps,
} from "@rjsf/utils"
import React from "react"

export default function TitleField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, title, uiSchema }: TitleFieldProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema)

  return (
    <div id={id} className="plug-tg-my-1">
      <h5 className="plug-tg-mb-2 plug-tg-text-xl plug-tg-font-medium plug-tg-leading-tight">
        {uiOptions.title || title}
      </h5>
      <hr className="plug-tg-my-4 plug-tg-border-t plug-tg-border-muted" />
    </div>
  )
}

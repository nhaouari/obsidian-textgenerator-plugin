import React from "react"
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils"

export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ errors, registry }: ErrorListProps<T, S, F>) {
  const { translateString } = registry

  return (
    <div className="plug-tg-mb-4 plug-tg-rounded plug-tg-border plug-tg-border-red-700">
      <div className="plug-tg-rounded-t plug-tg-bg-red-100 plug-tg-p-3 plug-tg-text-red-950">
        {translateString(TranslatableString.ErrorsLabel)}
      </div>
      <div className="plug-tg-p-0">
        <ul>
          {errors.map((error, i: number) => {
            return (
              <li key={i} className="plug-tg-border-0 plug-tg-p-3">
                <span>{error.stack}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

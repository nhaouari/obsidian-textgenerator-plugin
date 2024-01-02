import React from "react";
import {
  FormContextType,
  getSubmitButtonOptions,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps,
} from "@rjsf/utils"

export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: SubmitButtonProps<T, S, F>) {
  const {
    submitText,
    norender,
    props: submitButtonProps,
  } = getSubmitButtonOptions<T, S, F>(props.uiSchema)

  if (norender) {
    return null
  }

  return (
    <div>
      <button
        type="submit"
        className="plug-tg-bg-primary plug-tg-px-4 plug-tg-py-2 plug-tg-text-base plug-tg-font-normal plug-tg-text-primary-foreground hover:plug-tg-bg-primary/90"
        {...submitButtonProps}
      >
        {submitText}
      </button>
    </div>
  )
}

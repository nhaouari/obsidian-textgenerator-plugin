import React, { ChangeEvent, FocusEvent } from "react"
import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils"
import clsx from "clsx"

type CustomWidgetProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = WidgetProps<T, S, F> & {
  options: any
}

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
}: CustomWidgetProps<T, S, F>) {
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === "" ? options.emptyValue : value)
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, value)
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, value)

  //           "focus-within:plug-tg-ring-red-300 plug-tg-ring-1": props.required && !props.value && !props.label.contains("optional")
  //         })}
  // className="plug-tg-textarea focus:plug-tg-border-primary focus:plug-tg-outline-none
  // plug-tg-border-muted plug-tg-w-full plug-tg-border plug-tg-px-3 plug-tg-py-2"
  return (
    <div className="plug-tg-flex">
      <textarea
        className={clsx("plug-tg-h-24 plug-tg-w-full plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-resize-none plug-tg-rounded plug-tg-border plug-tg-border-gray-300 plug-tg-p-2 focus:plug-tg-border-blue-500 focus:plug-tg-outline-none")}
        id={id}
        name={id}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        rows={options.rows || 5}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </div>
  )
}

import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils"
import React from "react"
import { ChangeEvent, FocusEvent } from "react"

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  options,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options

  const emptyValue = multiple ? [] : ""

  function getValue(event: FocusEvent | ChangeEvent | any, multiple?: boolean) {
    if (multiple) {
      return [].slice
        .call(event.target.options as any)
        .filter((o: any) => o.selected)
        .map((o: any) => o.value)
    } else {
      return event.target.value
    }
  }
  const selectedIndexes = enumOptionsIndexForValue<S>(
    value,
    enumOptions,
    multiple,
  )

  return (
    <select
      id={id}
      name={id}
      value={
        typeof selectedIndexes === "undefined" ? emptyValue : selectedIndexes
      }
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      className={`plug-tg-w-full plug-tg-h-auto plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-border focus:plug-tg-border-primary focus:plug-tg-outline-none
      ${rawErrors.length > 0 ? "plug-tg-border-red-500" : ""}
      `}
      onBlur={
        onBlur &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple)
          onBlur(
            id,
            enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
          )
        })
      }
      onFocus={
        onFocus &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple)
          onFocus(
            id,
            enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
          )
        })
      }
      onChange={(event: ChangeEvent) => {
        const newValue = getValue(event, multiple)
        onChange(
          enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
        )
      }}
      aria-describedby={ariaDescribedByIds<T>(id)}
    >
      {!multiple && schema.default === undefined && (
        <option value="" className="plug-tg-bg-muted plug-tg-h-full">
          {placeholder}
        </option>
      )}
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any =
          Array.isArray(enumDisabled) &&
          (enumDisabled as any).indexOf(value) != -1
        return (
          <option
            key={i}
            id={label}
            value={String(i)}
            disabled={disabled}
            className="plug-tg-bg-muted plug-tg-h-full"
          >
            {label}
          </option>
        )
      })}
    </select>
  )
}

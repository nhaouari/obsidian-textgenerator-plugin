import {
  ariaDescribedByIds,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import React from "react";
import { ChangeEvent, FocusEvent } from "react";

export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const inline = Boolean(options && options.inline);

  return (
    <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2 plug-tg-pb-2">
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) !== -1;
          const checked = enumOptionsIsSelected<S>(option.value, value);

          const radio = (
            <label
              key={index}
              className={`plug-tg-block ${
                inline
                  ? "plug-tg-mr-3 plug-tg-inline-flex plug-tg-items-center"
                  : ""
              }`}
            >
              <input
                id={optionId(id, index)}
                name={id}
                type="radio"
                disabled={disabled || itemDisabled || readonly}
                checked={checked}
                required={required}
                value={String(index)}
                onChange={_onChange}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
                className="plug-tg-radio"
              />
              <span className="plug-tg-ml-2">{option.label}</span>
            </label>
          );
          return radio;
        })}
    </div>
  );
}

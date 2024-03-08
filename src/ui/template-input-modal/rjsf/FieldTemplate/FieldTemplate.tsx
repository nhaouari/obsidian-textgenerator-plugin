import {
  FieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import React from "react";

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  children,
  displayLabel,
  rawErrors = [],
  errors,
  help,
  description,
  rawDescription,
  classNames,
  style,
  disabled,
  label,
  hidden,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: FieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    "WrapIfAdditionalTemplate",
    T,
    S,
    F
  >("WrapIfAdditionalTemplate", registry, uiOptions);
  if (hidden) {
    return <div className="plug-tg-hidden">{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div className="plug-tg-mb-4 plug-tg-block">
        {displayLabel && (
          <label
            htmlFor={id}
            className={`plug-tg-mb-2 plug-tg-inline-block ${
              rawErrors.length > 0 ? "plug-tg-text-red-500" : ""
            }`}
          >
            {label}
            {required ? "*" : null}
          </label>
        )}
        {children}
        {displayLabel && rawDescription && (
          <small className="plug-tg-mt-1 plug-tg-block">
            <div
              className={`${
                rawErrors.length > 0
                  ? "plug-tg-text-red-500"
                  : "plug-tg-text-muted-foreground"
              }`}
            >
              {description}
            </div>
          </small>
        )}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}

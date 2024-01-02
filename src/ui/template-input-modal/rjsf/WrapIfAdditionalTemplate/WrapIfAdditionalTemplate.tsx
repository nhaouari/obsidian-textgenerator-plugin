import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from "@rjsf/utils"
import React from "react"
import { FocusEvent } from "react"

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString } = registry
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates
  const keyLabel = translateString(TranslatableString.KeyLabel, [label])
  const additional = ADDITIONAL_PROPERTY_FLAG in schema

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    )
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value)
  const keyId = `${id}-key`

  return (
    <div className={`plug-tg-flex ${classNames}`} style={style}>
      <div className="plug-tg-w-1/2 plug-tg-flex-none plug-tg-p-2">
        <label
          htmlFor={keyId}
          className="plug-tg-block plug-tg-text-sm plug-tg-font-medium plug-tg-text-muted-foreground"
        >
          {keyLabel}
        </label>
        <input
          required={required}
          defaultValue={label}
          disabled={disabled || readonly}
          id={keyId}
          name={keyId}
          onBlur={!readonly ? handleBlur : undefined}
          type="text"
          className="plug-tg-input plug-tg-mt-1 plug-tg-w-full plug-tg-border plug-tg-p-2 plug-tg-shadow-sm"
        />
      </div>
      <div className="plug-tg-w-1/2 plug-tg-flex-none plug-tg-p-2">{children}</div>
      <div className="plug-tg-w-1/4 plug-tg-flex-none plug-tg-p-2">
        <RemoveButton
          iconType="block"
          className="plug-tg-w-full"
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
    </div>
  )
}

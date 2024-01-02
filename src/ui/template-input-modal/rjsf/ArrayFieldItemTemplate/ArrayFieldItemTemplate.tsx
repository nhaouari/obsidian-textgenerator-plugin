import React, { CSSProperties } from "react"
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils"

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    disabled,
    hasToolbar,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    uiSchema,
  } = props

  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  }

  return (
    <div>
      <div className="plug-tg-mb-2 plug-tg-flex plug-tg-items-center">
        <div className="plug-tg-w-3/4 plug-tg-flex-none lg:plug-tg-w-3/4">{children}</div>
        <div className="plug-tg-w-1/4 plug-tg-flex-none plug-tg-px-4 plug-tg-py-6 lg:plug-tg-w-1/4">
          {hasToolbar && (
            <div className="plug-tg-flex">
              {(hasMoveUp || hasMoveDown) && (
                <div className="plug-tg-m-0 plug-tg-p-0">
                  <MoveUpButton
                    className="array-item-move-up"
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveUp}
                    onClick={onReorderClick(index, index - 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {(hasMoveUp || hasMoveDown) && (
                <div className="plug-tg-m-0 plug-tg-p-0">
                  <MoveDownButton
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveDown}
                    onClick={onReorderClick(index, index + 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasCopy && (
                <div className="plug-tg-m-0 plug-tg-p-0">
                  <CopyButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onCopyIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasRemove && (
                <div className="plug-tg-m-0 plug-tg-p-0">
                  <RemoveButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onDropIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import clsx from "clsx";
import React, { useState, useEffect } from "react";

import validator from '@rjsf/validator-ajv8';
import { Theme } from '@rjsf/chakra-ui';
import { FormProps, withTheme } from '@rjsf/core';
import TextGeneratorPlugin from "#/main";

if (Theme.templates) {
  Theme.templates.TitleFieldTemplate = function d(props) {
    return <h1>{props.title}</h1>
  }
}


if (Theme.widgets) {
  Theme.widgets.textarea = function Field(props) {
    return <div className="flex flex-col gap-1">
      <label className="mb-2 font-bold text-gray-700">{props.label}</label>
      <textarea
        dir="auto"
        className={clsx("h-24 w-full resize-none rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none", {
          "focus-within:ring-red-300 ring-1": props.required && !props.value && !props.label.contains("optional")
        })}
        value={props.value}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  };
}

const Form = withTheme(Theme);

export default function TemplateInputModalView(props: {
  p: { plugin: TextGeneratorPlugin, close?: Function };
  labels: string[];
  templateContext: any;
  onSubmit: any;
  metadata: any;
  children?: any;
}) {

  const handleSubmit = (data: any, event: any) => {
    event.preventDefault();
    props.onSubmit(data);
    props.p.close?.();
  };

  const [JSONSchema, setJSONSchema] = useState<FormProps["schema"]>({})
  const [UISchema, setUISchema] = useState<FormProps["uiSchema"]>({})
  const [formData, setFormData] = useState<FormProps["formData"]>({})


  useEffect(() => {
    (async () => {
      const basicProps: Record<string, FormProps["schema"]> = {};
      const basicUi: Record<string, FormProps["uiSchema"]> = {};
      const required: string[] = [];

      props.labels.forEach(l => {
        basicProps[l] = {
          type: 'string',
          title: l
        }
        basicUi[l] = {
          "ui:widget": "textarea",
          props: {
            className: "w-full"
          }
        }
        if (props.templateContext.strict && !l.contains("_optional")) required.push(l)
      })

      const obj = {
        title: props.metadata.name || props.metadata.id,
        type: 'object',
        properties: basicProps,
        required
      } as FormProps["schema"];

      setJSONSchema(obj);
      setUISchema(basicUi);

      if (props.templateContext.templatePath) {
        const cschema = await props.p.plugin.textGenerator.contextManager.getTemplateCustomInputConfig(props.templateContext.templatePath)
        if (cschema) {
          setJSONSchema({
            ...obj,
            ...cschema
          });

          if (cschema.uiSchema)
            setUISchema(cschema.uiSchema);

          if (cschema.formData)
            setFormData(cschema.formData);
        }
      }
    })()
  }, [])

  return (
    <Form
      className="w-full"
      schema={JSONSchema}
      uiSchema={UISchema}
      formData={formData}
      validator={validator}
      onSubmit={handleSubmit}
    >{props.children}</Form>
  );
}

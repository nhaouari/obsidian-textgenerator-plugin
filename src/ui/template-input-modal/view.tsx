import React, { useState, useEffect } from "react";

export default function TemplateInputModalView(props: {
  p: any;
  labels: string[];
  templateContext: any;
  onSubmit: any;
  metadata: any;
}) {
  const [formValues, setFormValues] = useState(() => {
    const initialValues = props.labels.map(
      (label) => props.templateContext[label] || ""
    );
    return initialValues;
  });
  const [meta, setMeta] = useState(props.metadata);

  const getFormData = () => {
    return formValues.reduce((formData, value, index) => {
      formData[props.labels[index]] = value;
      return formData;
    }, {});
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const formData = getFormData();
    props.onSubmit(formData);
    props.p.close();
  };

  const handleChange = (index: number) => (event: any) => {
    const values = [...formValues];
    values[index] = event.target?.value;
    setFormValues(values);
  };

  const firstTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    firstTextareaRef.current?.focus();
  }, [firstTextareaRef]);

  return (
    <form className="" onSubmit={handleSubmit}>
      <h1 className="mb-4 text-2xl font-bold">{meta.name}</h1>
      <p className="mb-6 text-gray-600">{meta.description}</p>
      {props.labels.map((label, index) => (
        <div key={label} className="mb-6">
          <div className="flex flex-col gap-1">
            <label className="mb-2 font-bold text-gray-700">{label}</label>
            <textarea
              dir="auto"
              ref={index === 0 ? firstTextareaRef : null}
              className="h-24 w-full resize-none rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange(index)}
              value={formValues[index]}
            />
          </div>
        </div>
      ))}
      <button
        type="submit"
        className="rounded bg-blue-500 px-6 py-2 font-semibold hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
      >
        Generate
      </button>
    </form>
  );
}

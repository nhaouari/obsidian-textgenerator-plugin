import React, { useState, useEffect } from "react";
import TemplateItem from "./PackageManager/TemplateItem";
import TemplateDetails from "./PackageManager/TemplateDetails";

export const TemplateModelView = ({ p, labels, onSubmit, metadata }) => {
	const [formValues, setFormValues] = useState([]);
	const [meta, setMeta] = useState(metadata);
	const getFormData = () => {
		return formValues.reduce((formData, value, index) => {
			formData[labels[index]] = value;
			return formData;
		}, {});
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = getFormData();
		onSubmit(formData);
		p.close();
	};

	const handleChange = (index) => (event) => {
		const values = [...formValues];
		values[index] = event.target.value;
		setFormValues(values);
	};
	const formContainerStyles = {
		width: "75%",
		margin: "0 auto",
	};

	const labelStyles = {
		fontWeight: "bold",
	};

	const textareaStyles = {
		width: "100%",
		height: "100px",
	};

	const firstTextareaRef = React.useRef(null);

	React.useEffect(() => {
		firstTextareaRef.current.focus();
	}, []);

	return (
		<form style={formContainerStyles} onSubmit={handleSubmit}>
			<h1>{meta.name}</h1>
			<p>{meta.description}</p>
			{labels.map((label, index) => (
				<div key={label}>
					<label style={labelStyles}>{label}</label>
					<textarea
						ref={index === 0 ? firstTextareaRef : null}
						style={textareaStyles}
						onChange={handleChange(index)}
						value={formValues[index]}
					/>
				</div>
			))}
			<button type="submit">Generate</button>
		</form>
	);
};

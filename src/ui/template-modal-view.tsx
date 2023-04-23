import React, { useState, useEffect } from "react";

export const TemplateModalView = ({ p, labels, onSubmit, metadata }) => {
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

	const firstTextareaRef = React.useRef(null);

	useEffect(() => {
		firstTextareaRef.current.focus();
	}, []);

	return (
		<form className="" onSubmit={handleSubmit}>
			<h1 className="text-2xl font-bold mb-4">{meta.name}</h1>
			<p className="text-gray-600 mb-6">{meta.description}</p>
			{labels.map((label, index) => (
				<div key={label} className="mb-6">
					<div className="flex flex-col">
						<label className="font-bold mb-2 text-gray-700">
							{label}
						</label>
						<textarea
							ref={index === 0 ? firstTextareaRef : null}
							className="w-full h-24 resize-none border border-gray-300 rounded mt-1 p-2 focus:outline-none focus:border-blue-500"
							onChange={handleChange(index)}
							value={formValues[index]}
						/>
					</div>
				</div>
			))}
			<button
				type="submit"
				className="bg-blue-500 px-6 py-2 rounded font-semibold hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
			>
				Generate
			</button>
		</form>
	);
};

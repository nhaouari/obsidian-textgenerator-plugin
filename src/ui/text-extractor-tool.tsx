import React, { useState, useEffect } from "react";
import {
	ContentExtractor,
	ExtractorMethod,
} from "../extractors/content-extractor";
import { App, Modal } from "obsidian";
import TextGeneratorPlugin from "../main";
import * as React from "react";
import { createRoot } from "react-dom/client";

const ContentExtractorComponent = ({ p, app, plugin }) => {
	const [urlResults, setUrlResults] = useState([]);
	const [convertedResults, setConvertedResults] = useState({});

	const getExtractorMethods = () => {
		return Object.keys(ExtractorMethod).filter(
			(e) => !(parseInt(e) || e === "0")
		);
	};

	const truncateUrl = (url, maxLength) => {
		if (url.length <= maxLength) {
			return url;
		}
		const ellipsis = "...";
		const prefixLength = Math.floor((maxLength - ellipsis.length) / 2);
		const suffixLength = maxLength - prefixLength - ellipsis.length;
		const truncatedUrl =
			url.substring(0, prefixLength) +
			ellipsis +
			url.substring(url.length - suffixLength);
		return truncatedUrl;
	};
	const handleExtractClick = async () => {
		const contentExtractor = new ContentExtractor(app, plugin);
		const extractedUrls = [];

		// Iterate through each extractor method and add the extracted URLs to the array.
		const extractorMethods = getExtractorMethods();
		for (let index = 0; index < extractorMethods.length; index++) {
			const extractorMethod = extractorMethods[index];
			contentExtractor.setExtractor(ExtractorMethod[extractorMethod]);
			const files = await contentExtractor.extract(
				app.workspace.getActiveFile().path
			);
			if (files.length > 0) {
				extractedUrls.push(
					...files.map((file) => ({
						url: truncateUrl(file.path || file, 50),
						file,
						extractorMethod: index,
					}))
				);
			}
		}
		setUrlResults(extractedUrls);
	};

	const handleConvertClick = async (file, extractorMethod) => {
		const contentExtractor = new ContentExtractor(app, plugin);
		contentExtractor.setExtractor(extractorMethod);
		const convertedText = await contentExtractor.convert(file);
		setConvertedResults({
			...convertedResults,
			[file.path || file]: convertedText,
		});
	};

	const handleTextAreaChange = (event, url) => {
		setConvertedResults({ ...convertedResults, [url]: event.target.value });
	};

	const handleRemoveClick = (url) => {
		const updatedResults = { ...convertedResults };
		delete updatedResults[url];
		setConvertedResults(updatedResults);
	};

	useEffect(() => {
		handleExtractClick();
	}, []);

	return (
		<div className="container mx-auto">
			<h1 className="text-2xl font-bold mb-4  text-center">
				Text Extractor Tool
			</h1>
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
							File/URL
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
							Action
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					{urlResults.map((urlResult, index) => (
						<tr key={index}>
							<td className="px-6 py-4 whitespace-nowrap text-sm ">
								{urlResult.url}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm">
								<button
									onClick={() =>
										handleConvertClick(
											urlResult.file,
											urlResult.extractorMethod
										)
									}
									className="bg-green-500 px-4 py-1 rounded font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300
                  300 focus:ring-opacity-50"
								>
									Convert
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{Object.entries(convertedResults).map(([url, result], index) => (
				<div key={index} className="my-6 relative">
					<h2 className="font-bold mb-2">{url}</h2>
					<textarea
						dir="auto"
						className="w-full h-24 resize-none border border-gray-300 rounded mt-1 p-2 focus:border-blue-500"
						value={result}
						onChange={(event) => handleTextAreaChange(event, url)}
					/>
					<CopyButton textToCopy={result} />
					<RemoveButton
						handleRemoveClick={() => handleRemoveClick(url)}
					/>
				</div>
			))}
		</div>
	);
};

export default ContentExtractorComponent;

export class TextExtractorTool extends Modal {
	result: string;
	plugin: TextGeneratorPlugin;
	root: any;
	constructor(app: App, plugin: TextGeneratorPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		this.containerEl.createEl("div", { cls: "PackageManager" });
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<React.StrictMode>
				<ContentExtractorComponent
					p={this}
					app={this.app}
					plugin={this.plugin}
				/>
			</React.StrictMode>
		);
	}

	onClose() {
		this.root.unmount();
	}
}

const CopyButton = ({ textToCopy }) => {
	const [copyStatus, setCopyStatus] = useState("Copy");

	const handleCopyClick = () => {
		navigator.clipboard.writeText(textToCopy).then(
			() => {
				setCopyStatus("Copied!");
				setTimeout(() => setCopyStatus("Copy"), 1500);
			},
			(err) => {
				console.error("Could not copy text: ", err);
				setCopyStatus("Error");
			}
		);
	};

	return (
		<button
			onClick={handleCopyClick}
			title={copyStatus}
			className="absolute bottom-[calc(-30px)] right-0 mb-1 mr-1 bg-gray-300 hover:bg-blue-600 text-gray px-2 py-1 text-xs font-semibold rounded-none focus:outline-none focus:ring-0"
		>
			{copyStatus}
		</button>
	);
};

const RemoveButton = ({ handleRemoveClick }) => {
	return (
		<button
			onClick={handleRemoveClick}
			className="absolute bottom-[calc(-30px)] right-12 mb-1 mr-1 bg-red-300 hover:bg-red-600 text-gray px-2 py-1 text-xs font-semibold rounded-none focus:outline-none focus:ring-0"
		>
			Remove
		</button>
	);
};

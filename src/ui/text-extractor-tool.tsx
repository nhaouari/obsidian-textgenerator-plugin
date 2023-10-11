import React, {
  useState,
  useEffect,
  ChangeEvent,
  MouseEventHandler,
} from "react";
import {
  ContentExtractor,
  ExtractorMethod,
  getExtractorMethods,
} from "../extractors/content-extractor";
import { App, Modal, TFile } from "obsidian";
import TextGeneratorPlugin from "../main";
import { createRoot } from "react-dom/client";
import CopyButton from "./components/copyButton";

const ContentExtractorComponent = ({
  p,
  app,
  plugin,
}: {
  p: any;
  app: any;
  plugin: TextGeneratorPlugin;
}) => {
  const [urlResults, setUrlResults] = useState<
    {
      url: string;
      file: any;
      extractorMethod: ExtractorMethod;
    }[]
  >([]);
  const [convertedResults, setConvertedResults] = useState<Record<string, any>>(
    {}
  );

  const truncateUrl = (url: string, maxLength: number) => {
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
      contentExtractor.setExtractor(extractorMethod);
      const files = await contentExtractor.extract(
        app.workspace.getActiveFile().path
      );
      if (files.length > 0) {
        extractedUrls.push(
          ...files.map((file: any) => ({
            url: truncateUrl(file?.path || file, 50),
            file,
            extractorMethod,
          }))
        );
      }
    }
    setUrlResults(extractedUrls);
  };

  const handleConvertClick = async (
    file: TFile,
    extractorMethod: ExtractorMethod
  ) => {
    const contentExtractor = new ContentExtractor(app, plugin);
    contentExtractor.setExtractor(extractorMethod);
    const convertedText = await contentExtractor.convert(
      (file.path || file) as string
    );
    setConvertedResults((convertedResults) => ({
      ...convertedResults,
      [(file.path || file) as string]: convertedText,
    }));
  };

  const handleTextAreaChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
    url: string
  ) => {
    setConvertedResults((convertedResults) => ({
      ...convertedResults,
      [url]: event.target.value,
    }));
  };

  const handleRemoveClick = (url: string) => {
    setConvertedResults((convertedResults) => {
      const updatedResults = { ...convertedResults };
      delete updatedResults[url];
    });
  };

  useEffect(() => {
    handleExtractClick();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="mb-4 text-center text-2xl  font-bold">
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
              <td className="whitespace-nowrap px-6 py-4 text-sm ">
                {urlResult.url}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <button
                  onClick={() =>
                    handleConvertClick(
                      urlResult.file,
                      urlResult.extractorMethod
                    )
                  }
                  className="300 rounded bg-green-500 px-4 py-1 font-semibold hover:bg-green-600 focus:outline-none focus:ring-2
                  focus:ring-green-300/50"
                >
                  Convert
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {Object.entries(convertedResults).map(([url, result], index) => (
        <div key={index} className="relative my-6">
          <h2 className="mb-2 font-bold">{url}</h2>
          <textarea
            dir="auto"
            className="mt-1 h-24 w-full resize-none rounded border border-gray-300 p-2 focus:border-blue-500"
            value={result}
            onChange={(event) => handleTextAreaChange(event, url)}
          />
          <CopyButton textToCopy={result} />
          <RemoveButton handleRemoveClick={() => handleRemoveClick(url)} />
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

const RemoveButton = (props: {
  handleRemoveClick: MouseEventHandler<HTMLButtonElement> | undefined;
}) => {
  return (
    <button
      onClick={props.handleRemoveClick}
      className="text-gray absolute bottom-[calc(-30px)] right-12 mb-1 mr-1 rounded-none bg-red-300 px-2 py-1 text-xs font-semibold hover:bg-red-600 focus:outline-none focus:ring-0"
    >
      Remove
    </button>
  );
};

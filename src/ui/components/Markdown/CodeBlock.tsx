import React from "react";
import { generateRandomString, programmingLanguages } from "./utils";
import { IconCheck, IconClipboard, IconDownload } from "@tabler/icons-react";
import { FC, memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface Props {
  language: string;
  value: string;
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };
  const downloadAsFile = () => {
    const fileExtension = programmingLanguages[language] || ".file";
    const suggestedFileName = `file-${generateRandomString(
      3,
      true
    )}${fileExtension}`;
    const fileName = window.prompt("Enter file name" || "", suggestedFileName);

    if (!fileName) {
      // user pressed cancel on prompt
      return;
    }

    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="codeblock plug-tg-relative plug-tg-font-sans plug-tg-text-[16px]">
      <div className="plug-tg-flex plug-tg-items-center plug-tg-justify-between plug-tg-px-4 plug-tg-py-1.5">
        <span className="plug-tg-text-xs plug-tg-lowercase plug-tg-text-white">
          {language}
        </span>

        <div className="plug-tg-flex plug-tg-items-center">
          <button
            className="plug-tg-flex plug-tg-items-center plug-tg-gap-1.5 plug-tg-rounded plug-tg-bg-none plug-tg-p-1 plug-tg-text-xs plug-tg-text-white"
            onClick={copyToClipboard}
          >
            {isCopied ? <IconCheck size={18} /> : <IconClipboard size={18} />}
            {isCopied ? "Copied!" : "Copy code"}sdfsdf
          </button>
          <button
            className="plug-tg-flex plug-tg-items-center plug-tg-rounded plug-tg-bg-none plug-tg-p-1 plug-tg-text-xs plug-tg-text-white"
            onClick={downloadAsFile}
          >
            <IconDownload size={18} />
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0 }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

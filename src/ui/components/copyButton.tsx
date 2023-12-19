import clsx from "clsx";
import React, { useState } from "react";

export default function CopyButton(props: {
  textToCopy: string;
  justAButton?: boolean;
  justADiv?: boolean;
  className?: string;
  children?: any;
}) {
  const [copyStatus, setCopyStatus] = useState(props.children || "Copy");

  const handleCopyClick = () => {
    navigator.clipboard.writeText(props.textToCopy).then(
      () => {
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(props.children || "Copy"), 1500);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        setCopyStatus("Error");
      }
    );
  };

  if (props.justADiv)
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          handleCopyClick();
        }}
        title={copyStatus}
        className={clsx(props.className)}
      >
        {copyStatus}
      </div>
    );

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        handleCopyClick();
      }}
      title={copyStatus}
      className={clsx(
        props.justAButton
          ? "text-gray cursor-pointer rounded-none bg-gray-300 px-2 py-1 text-xs font-semibold hover:bg-blue-600 focus:outline-none focus:ring-0"
          : "text-gray absolute bottom-[calc(-30px)] right-0 mb-1 mr-1 cursor-pointer rounded-none bg-gray-300 px-2 py-1 text-xs font-semibold hover:bg-blue-600 focus:outline-none focus:ring-0",
        props.className
      )}
    >
      {copyStatus}
    </button>
  );
}

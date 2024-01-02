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
          ? "plug-tg-text-gray plug-tg-cursor-pointer plug-tg-rounded-none plug-tg-bg-gray-300 plug-tg-px-2 plug-tg-py-1 plug-tg-text-xs plug-tg-font-semibold hover:plug-tg-bg-blue-600 focus:plug-tg-outline-none focus:plug-tg-ring-0"
          : "plug-tg-text-gray plug-tg-absolute plug-tg-bottom-[calc(-30px)] plug-tg-right-0 plug-tg-mb-1 plug-tg-mr-1 plug-tg-cursor-pointer plug-tg-rounded-none plug-tg-bg-gray-300 plug-tg-px-2 plug-tg-py-1 plug-tg-text-xs plug-tg-font-semibold hover:plug-tg-bg-blue-600 focus:plug-tg-outline-none focus:plug-tg-ring-0",
        props.className
      )}
    >
      {copyStatus}
    </button>
  );
}

import React from "react";
import clsx from "clsx";

export default function GratitudeDiv(props: any) {
  const { children, ...peps } = props;
  return (
    <div
      {...peps}
      className={clsx("plug-tg-confetti-container", props.className)}
    >
      <div className="plug-tg-confetti">
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
        <div className="plug-tg-confetti-piece"></div>
      </div>
      {children}
    </div>
  );
}

import React from "react";
import useGlobal from "../../context/global";
import type GratitudeUI from "./ui";
import GratitudeSvg from "../components/svgs/gratitude";
import TemplateDetails from "../components/template-details";

export default function GratitudeView(p: { parent: GratitudeUI; data: any }) {
  const global = useGlobal();

  function handleClose() {
    p.parent.close();
  }

  return (
    <>
      <div className="modal-container">
        <div className="modal-bg" style={{ opacity: "0.85" }}></div>
        <div className="modal mod-community-modal mod-sidebar-layout mod-community-plugin">
          <div className="modal-close-button" onClick={handleClose}></div>
          <div className="modal-title">Community Templates</div>

          <GratitudeSvg className="modal-content plug-tg-flex plug-tg-h-full plug-tg-w-full plug-tg-flex-col plug-tg-items-center plug-tg-justify-center plug-tg-gap-10 plug-tg-p-3">
            <div className="plug-tg-text-xl">Thank you soo much ❤️</div>
            <div>
              <TemplateDetails
                packageId={p.data.packageId}
                packageManager={global.plugin.packageManager}
                checkForUpdates={() => {}}
                updateView={() => {}}
                mini
              />
            </div>
          </GratitudeSvg>
        </div>
      </div>
    </>
  );
}

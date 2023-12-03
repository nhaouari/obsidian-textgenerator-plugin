import React from "react";
import useGlobal from "../../context/global";
import type GratitudeUI from "./ui";
import TemplateDetails from "../components/template-details";

export default function GratitudeView(p: { parent: GratitudeUI, data: any }) {
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
          <div className="modal-content w-full h-full flex flex-col items-center justify-center gap-10 p-3">
            <div className="text-xl">
              Thank you soo much ❤️
            </div>
            <div>
              <TemplateDetails
                packageId={p.data.packageId}
                packageManager={global.plugin.packageManager}
                checkForUpdates={() => { }}
                updateView={() => { }}
                mini
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

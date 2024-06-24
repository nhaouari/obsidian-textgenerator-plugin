import React, { useEffect, useState } from "react";
import useGlobal from "#/ui/context/global";
import type { LoginUI } from "./login-ui";
import { request } from "obsidian";
import { ProviderServer } from "../package-manager";

export const LoginView = (p: { parent: LoginUI }) => {
  const global = useGlobal();

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // @ts-ignore
    if (global.k) return;
    // @ts-ignore
    global.k = true;

    let sessionId: any;

    const onFocus = async () => {
      try {
        return p.parent.onSubmit("");
      } catch (err: any) {
        console.error(err);
      }

      setFailed(true);

      await new Promise((s) => setTimeout(s, 1000));

      p.parent.onReject("failed to login");
    };

    (async () => {
      try {
        // request temp session and retrive id, endpoint GET /api/apps/gen-session
        sessionId = await request(
          new URL("/api/auth/session/temp/gen", ProviderServer).href
        );

        if (!sessionId) return;

        // open the login website
        window.open(
          new URL(
            `/login/temp?session=${encodeURIComponent(
              sessionId
            )}&callback=${encodeURIComponent(
              "obsidian://text-gen?intent=login"
            )}`,
            ProviderServer
          ).href
        );

        window.addEventListener("focus", onFocus);
      } catch (err: any) {
        console.error(err);
        setFailed(true);

        await new Promise((s) => setTimeout(s, 1000));

        p.parent.onReject("failed to login");
      }
    })();

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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
          <div className="modal-content plug-tg-flex plug-tg-h-full plug-tg-w-full plug-tg-items-center plug-tg-justify-center">
            {failed ? (
              <div>Failed to login</div>
            ) : (
              <div>Waiting for login...</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

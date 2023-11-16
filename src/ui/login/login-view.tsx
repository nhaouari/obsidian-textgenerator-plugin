import React, { useEffect, useState } from "react";
import useGlobal from "../context/global";
import type { LoginUI } from "./login-ui";
import { request, requestUrl } from "obsidian";
import set from "lodash.set";


export const baseForLogin = ""

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
        if (!sessionId || p.parent.isClosed) return;

        await new Promise((s) => setTimeout(s, 300))

        // retrive the apikey
        const res = await requestUrl({
          url: new URL(`/api/auth/session/temp/apikey?session=${encodeURIComponent(sessionId)}`, baseForLogin).href,
          throw: false
        })

        if (res.status >= 400)
          throw await res.text;


        const apikey = await res.text;

        console.log(apikey);


        if (apikey) {
          set(global.plugin.settings, `LLMProviderOptions.["package-provider"].apikey`, apikey);
          await global.plugin.encryptAllKeys();
          await global.plugin.saveSettings();
          return p.parent.onSubmit(apikey)
        }
      } catch (err: any) {
        console.error(err);
      }

      setFailed(true);

      await new Promise((s) => setTimeout(s, 1000))

      p.parent.onReject("failed to login");
    }

    (async () => {
      try {

        // request temp session and retrive id, endpoint GET /api/apps/gen-session
        sessionId = await request(new URL("/api/auth/session/temp/gen", baseForLogin).href)

        if (!sessionId) return;

        // open the login website
        window.open(new URL(`/login/temp?session=${encodeURIComponent(sessionId)}`, baseForLogin).href);

        window.addEventListener("focus", onFocus);

      } catch (err: any) {
        console.error(err)
        setFailed(true);

        await new Promise((s) => setTimeout(s, 1000))

        p.parent.onReject("failed to login");
      }
    })();

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [])

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
          <div className="modal-content w-full h-full flex items-center justify-center">
            {failed ?
              <div>Failed to login</div>
              : <div>
                Waiting for login...
              </div>}
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingsSection from "../components/section";
import { useToggle } from "usehooks-ts";
import type { Register } from ".";
import attemptLogin, { attemptLogout } from "#/scope/package-manager/login";
import Profile from "#/scope/package-manager/profile";
import SettingItem from "../components/item";
import { ProviderServer } from "#/scope/package-manager/package-manager";

export default function AccountSetting(props: { register: Register }) {
  const global = useGlobal();
  const sectionId = useId();

  const [_, triggerReload] = useToggle();

  const apiKey = global.plugin.packageManager.getApikey();
  const loggedIn = !!apiKey;

  return (
    <>
      <SettingsSection
        title="Account Settings"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name=""
          description="This is the account settings to manage bought items from the package-manager"
          register={props.register}
          sectionId={sectionId}
        />

        {loggedIn && <Profile apiKey={apiKey} />}

        <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
          {loggedIn ? (
            <div className="plug-tg-flex plug-tg-gap-2">
              <button
                className="plug-tg-cursor-pointer"
                onClick={async () => {
                  await attemptLogout(global.plugin);
                  triggerReload();
                }}
              >
                Logout
              </button>

              <button
                className="plug-tg-cursor-pointer"
                onClick={async () => {
                  window.open(
                    new URL("/dashboard/settings", ProviderServer).href
                  );
                }}
              >
                Manage Account
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                await attemptLogin(global.plugin);
                triggerReload();
              }}
            >
              Login
            </button>
          )}
        </div>

        {loggedIn && (
          <>
            <div className="plug-tg-flex plug-tg-w-full plug-tg-flex-col plug-tg-gap-2">
              <h3>Subscriptions:</h3>
              {global.plugin.packageManager.configuration.subscriptions?.map(
                (s) => (
                  <div key={s.id}>
                    {s.name} ({s.type})
                  </div>
                )
              )}
            </div>
            <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
              <button
                className="plug-tg-cursor-pointer"
                onClick={async () => {
                  window.open(
                    new URL("/dashboard/subscriptions", ProviderServer).href
                  );
                }}
              >
                Manage Subscriptions
              </button>
            </div>
          </>
        )}
      </SettingsSection>
    </>
  );
}

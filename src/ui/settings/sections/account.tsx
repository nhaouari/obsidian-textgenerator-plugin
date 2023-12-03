import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingsSection from "../components/section";
import { useToggle } from "usehooks-ts";
import type { Register } from ".";
import attemptLogin, { attemptLogout } from "#/ui/package-manager/login";
import { baseForLogin } from "#/ui/package-manager/login/login-view";
import Profile from "#/ui/package-manager/profile";
import SettingItem from "../components/item";


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
        className="flex w-full flex-col"
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

        <div className="flex justify-end w-full">
          {loggedIn ?
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await attemptLogout(global.plugin);
                  triggerReload()
                }}
              >Logout</button>

              <button
                onClick={async () => {
                  window.open(new URL("/dashboard/account", baseForLogin).href)
                }}>Manage Account</button>
            </div>
            : <button
              onClick={async () => {
                await attemptLogin(global.plugin);
                triggerReload()
              }}
            >Login</button>
          }
        </div>

        {loggedIn && <>
          <div className="w-full flex gap-2 flex-col">
            <h3>Subscriptions:</h3>
            {
              global.plugin.packageManager.configuration.subscriptions?.map(s => <div key={s.id}>{s.name} ({s.type})</div>)
            }
          </div>
          <div className="flex justify-end w-full">
            <button onClick={async () => {
              window.open(new URL("/dashboard/subscriptions", baseForLogin).href)
            }}>Manage Subscriptions</button>
          </div>
        </>}
      </SettingsSection>
    </>
  );
}

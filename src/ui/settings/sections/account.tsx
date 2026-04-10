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
        title="账户设置"
        className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
        register={props.register}
        id={sectionId}
      >
        <SettingItem
          name=""
          description="在此管理通过包管理器购买的项目"
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
                退出登录
              </button>

              <button
                className="plug-tg-cursor-pointer"
                onClick={async () => {
                  window.open(
                    new URL("/dashboard/settings", ProviderServer).href
                  );
                }}
              >
                管理账户
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                await attemptLogin(global.plugin);
                triggerReload();
              }}
            >
              登录
            </button>
          )}
        </div>

        {loggedIn && (
          <>
            <div className="plug-tg-flex plug-tg-w-full plug-tg-flex-col plug-tg-gap-2">
              <h3>订阅：</h3>
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
                管理订阅
              </button>
            </div>
          </>
        )}
      </SettingsSection>
    </>
  );
}

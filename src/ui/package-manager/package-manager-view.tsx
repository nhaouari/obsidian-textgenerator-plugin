import React, { useState, useEffect, useMemo } from "react";
import TemplateItem from "./components/template-item";
import TemplateDetails from "./components/template-details";
import { PackageTemplate } from "#/types";
import useglobal from "../context/global";
import type { PackageManagerUI } from "./package-manager-ui";
import attemptLogin, { attemptLogout } from "./login";
import { useToggle } from "usehooks-ts";
import Profile from "./profile";
import { Platform } from "obsidian";
import { ProviderServer } from "./package-manager";



export const PackageManagerView = (p: { parent: PackageManagerUI }) => {
  const glob = useglobal();

  const [_, triggerReload] = useToggle();

  const [_items, setItems] = useState<(PackageTemplate & { selected?: boolean })[]>([]);

  const parent = p.parent;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [justInstalled, setJustInstalled] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [packagesIdsToUpdate, setPackagesIdsTOUpdate] = useState<string[]>([]);

  const pacakgeIdsToUpdateHash = useMemo(() => {
    const hash: Record<string, boolean> = {};
    packagesIdsToUpdate.forEach(p => hash[p] = true);
    return hash;
  }, [packagesIdsToUpdate])

  const items = useMemo(() => {
    let itms = justInstalled ?
      _items.filter(i => !!i.installed)
      : _items;

    if (searchInput.length)
      itms = itms.filter((p) =>
        Object.values(p)
          .join(" ")
          .toLowerCase()
          .includes(searchInput.toLowerCase())
      );

    return itms
  },
    [_items, justInstalled, packagesIdsToUpdate, searchInput]
  );

  function toggleJustInstalled() {
    setJustInstalled((i) => !i);
  }

  async function getAllPackages(update = true) {
    let packages: any = [];
    if (update) packages = await glob.plugin.packageManager.updatePackagesList();

    await glob.plugin.packageManager.updatePackagesStats();

    return packages;
  }

  async function updateView() {
    setItems(glob.plugin.packageManager.getPackagesList().filter(p => !p.desktopOnly || Platform.isDesktop));
  }

  function handleChange(value: string) {
    setSearchInput(value);
  }

  function handleClose() {
    parent.close();
  }

  function select(index: number) {
    setSelectedIndex(index);
  }

  async function checkForUpdates() {
    setPackagesIdsTOUpdate(await glob.plugin.packageManager.checkUpdates());
  }

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchInput])

  useEffect(() => {
    (async () => {
      await getAllPackages();
      try {
        await glob.plugin.packageManager.updateBoughtResources();
      } catch (err: any) {
        console.warn("couldn't updateBoughtResources")
      }
      setItems(glob.plugin.packageManager.getPackagesList());
    })()
  }, []);

  const userApikey = glob.plugin.packageManager.getApikey();
  const isLoggedIn = !!userApikey;


  const loginComponent = ProviderServer ? (
    <div className="plug-tg-flex plug-tg-gap-2 plug-tg-items-center plug-tg-pr-9">
      {isLoggedIn ? <>
        <Profile key={userApikey} apiKey={userApikey} mini />
        <button
          data-tip="Logout"
          className="plug-tg-tooltip plug-tg-tooltip-bottom plug-tg-cursor-pointer plug-tg-p-[3px]"
          onClick={async () => {
            await attemptLogout(glob.plugin);
            triggerReload();
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
        </button>
      </> :
        <button
          data-tip="Login"
          className="plug-tg-tooltip plug-tg-tooltip-bottom plug-tg-cursor-pointer"
          onClick={async () => {
            await attemptLogin(glob.plugin);
            triggerReload();
          }}>
          Login
        </button>
      }
    </div>
  ) : "";

  const premiumFeatures = items.filter(i => !!i.core);
  const communityTemplates = items.filter(i => !i.core);

  console.log({ items })

  return (
    <>
      <div className="modal-container">
        <div className="modal-bg" style={{ opacity: "0.85" }}></div>
        <div className="modal mod-community-modal mod-sidebar-layout mod-community-plugin">
          <div className="modal-close-button" onClick={handleClose}></div>
          <div className="modal-title">Community Templates</div>
          <div className="modal-content">
            <div className="modal-sidebar community-modal-sidebar">
              <div className="community-modal-controls">
                <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-between plug-tg-items-center plug-tg-px-3 plug-tg-pb-3 plug-tg-max-w-full">
                  <div>
                    <div className="setting-item-info">
                      <div className="setting-item-name"></div>
                      <div className="setting-item-description"></div>
                    </div>
                    <div className="setting-item-control">
                      <div className="search-input-container">
                        <input
                          type="search"
                          placeholder="Search community Templates..."
                          value={searchInput}
                          onChange={(e) => handleChange(e.target.value)}
                        />
                        <div
                          className="search-input-clear-button"
                          onClick={() => handleChange("")}
                        ></div>
                      </div>
                      <button
                        aria-label="Check for updates"
                        className="clickable-icon"
                        onClick={() => checkForUpdates()}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="svg-icon lucide-refresh-cw"
                        >
                          <path d="M21 2v6h-6"></path>
                          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                          <path d="M3 22v-6h6"></path>
                          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                        </svg>
                      </button>

                    </div>
                  </div>
                  {!(selectedIndex !== -1 && items[selectedIndex]) && loginComponent}
                </div>
                <div className="setting-item mod-toggle">
                  <div className="setting-item-info">
                    <div className="setting-item-name">Show installed only</div>
                    <div className="setting-item-description"></div>
                  </div>
                  <div className="setting-item-control">
                    <div
                      className={`checkbox-container mod-small ${justInstalled && "is-enabled"
                        }`}
                      onClick={() => toggleJustInstalled()}
                    >
                      <input type="checkbox" tabIndex={0} />
                    </div>
                  </div>
                </div>

                <div className="community-modal-search-summary u-muted">
                  Showing {items.length} Packages
                </div>
                <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
                  <div className="plug-tg-px-4 plug-tg-py-1">Find more community templates on our <a href="https://discord.gg/GvTBgzBz7n">discord server!</a></div>
                </div>
              </div>
              <div className="community-modal-search-results-wrapper">
                <div className="plug-tg-flex plug-tg-flex-col">
                  {!!ProviderServer && !!premiumFeatures?.length && <>
                    <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2 plug-tg-p-3">
                      <div className="plug-tg-text-xl plug-tg-font-bold">Featured Items</div>
                      <div className="plug-tg-w-full plug-tg-flex plug-tg-gap-2 plug-tg-flex-wrap">
                        {premiumFeatures.map((item) => {

                          const i = items.findIndex(it => it.packageId == item.packageId);
                          return (
                            <TemplateItem
                              key={item.packageId + "premium"}
                              item={item}
                              index={i}
                              selected={selectedIndex == i}
                              select={select}
                              owned={glob.plugin.packageManager.simpleCheckOwnership(item.packageId)}
                              update={
                                pacakgeIdsToUpdateHash[item.packageId]
                              }
                            />
                          )
                        })}
                      </div>
                    </div>

                    <hr className="plug-tg-h-px plug-tg-my-2 plug-tg-bg-gray-200/25 plug-tg-border-0" />
                  </>}

                  <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2 plug-tg-p-3 plug-tg-pr-0">
                    {communityTemplates?.length ? <>
                      <div className="plug-tg-text-xl plug-tg-font-bold">Community Templates</div>
                      <div className="community-modal-search-results plug-tg-pl-0">
                        {communityTemplates.map((item) => {

                          const i = items.findIndex(it => it.packageId == item.packageId)
                          return (
                            <TemplateItem
                              key={item.packageId + "community"}
                              item={item}
                              index={i}
                              selected={selectedIndex == i}
                              select={select}
                              update={
                                pacakgeIdsToUpdateHash[item.packageId]
                              }
                            />
                          )
                        })}
                      </div>
                    </> : null}
                  </div>
                </div>
              </div>
            </div>
            {selectedIndex !== -1 && items[selectedIndex] && (
              <div className="community-modal-details">
                <div className="modal-setting-nav-bar plug-tg-flex plug-tg-w-full plug-tg-justify-between plug-tg-items-center">
                  <div
                    className="clickable-icon"
                    aria-label="Back"
                    onClick={() => setSelectedIndex(-1)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="svg-icon lucide-chevron-left"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </div>

                  {loginComponent}
                </div>
                <div className="community-modal-info">
                  <TemplateDetails
                    key={items[selectedIndex].packageId || selectedIndex}
                    packageId={items[selectedIndex].packageId}
                    packageManager={glob.plugin.packageManager}
                    checkForUpdates={checkForUpdates}
                    updateView={updateView}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
    </>
  );
};

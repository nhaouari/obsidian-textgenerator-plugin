import React, { useState, useEffect } from "react";
import TemplateItem from "./components/template-item";
import TemplateDetails from "./components/template-details";

export const PackageManagerView = (p) => {
  const [items, setItems] = useState([]);
  const [parent, setParent] = useState(p.parent);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [justInstalled, setJustInstalled] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [packagesIdsToUpdate, setPackagesIdsTOUpdate] = useState([]);

  function toggleJustInstalled() {
    setJustInstalled(!justInstalled);
  }

  const filterItem = async () => {
    setSelectedIndex(-1);
    if (searchInput.length > 0) {
      const packages = items.filter((p) =>
        Object.values(p)
          .join(" ")
          .toLowerCase()
          .includes(searchInput.toLowerCase())
      );
      setItems(packages);
    } else {
      updateView();
    }
  };

  async function updateView() {
    const packages = await getAllPackages(false);
    setItems(packages);
  }

  async function getAllPackages(update = true) {
    if (update) await p.parent.plugin.packageManager.updatePackagesList();
    await p.parent.plugin.packageManager.updatePackagesStats();
    let packages = p.parent.plugin.packageManager.getPackagesList();
    if (justInstalled) packages = packages.filter((p) => p.installed === true);
    return packages.map((p, index) => ({ ...p, index, selected: false }));
  }

  function handleChange(value) {
    setSearchInput(value);
  }

  function handleClose(event) {
    parent.close();
  }

  function select(index) {
    setSelectedIndex(index);
    setItems(
      items.map((p, i) =>
        i === index ? { ...p, selected: true } : { ...p, selected: false }
      )
    );
  }

  async function checkForUpdates() {
    setPackagesIdsTOUpdate(await p.parent.plugin.packageManager.checkUpdates());
  }

  useEffect(() => {
    filterItem();
  }, [searchInput]);

  useEffect(() => {
    updateView();
  }, [justInstalled, packagesIdsToUpdate]);

  useEffect(() => {
    getAllPackages().then((packages) => {
      setItems(packages);
    });
  }, []);

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
                <div className="setting-item">
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
                <div className="setting-item mod-toggle">
                  <div className="setting-item-info">
                    <div className="setting-item-name">Show installed only</div>
                    <div className="setting-item-description"></div>
                  </div>
                  <div className="setting-item-control">
                    <div
                      className={`checkbox-container mod-small ${
                        justInstalled && "is-enabled"
                      }`}
                      onClick={() => toggleJustInstalled()}
                    >
                      <input type="checkbox" tabIndex="0" />
                    </div>
                  </div>
                </div>
                <div className="community-modal-search-summary u-muted">
                  Showing {items.length} Packages Templates:
                </div>
              </div>
              <div className="community-modal-search-results-wrapper">
                <div className="community-modal-search-results">
                  {items.length > 0 &&
                    items.map((item) => (
                      <TemplateItem
                        key={item.packageId}
                        props={item}
                        select={select}
                        update={
                          packagesIdsToUpdate.indexOf(item.packageId) !== -1
                        }
                      />
                    ))}
                </div>
              </div>
            </div>
            {selectedIndex !== -1 && items[selectedIndex] && (
              <TemplateDetails
                packageId={items[selectedIndex].packageId}
                packageManager={p.parent.plugin.packageManager}
                setSelectedIndex={setSelectedIndex}
                checkForUpdates={checkForUpdates}
                updateView={updateView}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

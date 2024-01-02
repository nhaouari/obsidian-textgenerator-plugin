import React, { useEffect, useMemo, useState } from "react";
// ---------- sections ----------
import AdvancedSetting from "./advanced";
import AccountSettings from "./account";
import ProviderSetting from "./provider";
import DMPSetting from "./default-model-parameters";
import ConsideredContextSetting from "./considered-context";
import ExtractorOptionsSetting from "./extractors-options";
import AutoSuggestSetting from "./auto-suggest";
import OptionsSetting from "./options";
import Input from "../components/input";
import OtherProvidersSetting from "./otherProviders";
import { ProviderServer } from "#/ui/package-manager/package-manager";
// ------------------------------

export type Register = {
  listOfAllowed: string[];
  activeSections: Record<string, true>;
  searchTerm: string;
  register(id: string, searchInfo: string, section?: string): void;
  unRegister(id: string): void;
  checkAll(ids: string[]): boolean;
};

export default function SectionsMain() {
  const [items, setItems] = useState<
    Record<
      string,
      {
        term: string;
        sectionId?: string;
      }
    >
  >({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  const searchedEntries = useMemo(
    () =>
      !searchTerm.length
        ? Object.entries(items)
        : Object.entries(items).filter(([key, val]) =>
          `${val.term} ${items[val.sectionId]?.term}`
            .toLocaleLowerCase()
            .includes(searchTerm.toLocaleLowerCase())
        ),
    [items, searchTerm]
  );

  const searchedItems = useMemo<string[]>(
    () => searchedEntries.map((e) => e[0]),
    [searchedEntries]
  );

  const activeSections = useMemo(() => {
    const obj: Record<string, true> = {};
    searchedEntries.forEach((e) => {
      if (e[1].sectionId) obj[e[1].sectionId] = true;
    });

    return obj;
  }, [searchedItems]);

  const register: Register = {
    listOfAllowed: searchedItems,
    activeSections,
    searchTerm,
    register(id, searchInfo, sectionId) {
      setItems((items) => {
        items[id] = {
          term: searchInfo,
          sectionId,
        };
        return { ...items };
      });
    },
    unRegister(id) {
      setItems((items) => {
        delete items[id];
        return { ...items };
      });
    },
    checkAll(ids) {
      return ids.every((id) => searchedItems.contains(id));
    },
  };

  return (
    <div className="plug-tg-flex plug-tg-w-full plug-tg-flex-col plug-tg-gap-3">
      <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-between plug-tg-p-2">
        <div></div>
        <Input
          setValue={(val) => setSearchTerm(val.toLocaleLowerCase())}
          value={searchTerm}
          placeholder="Search For Option"
        />
      </div>

      <ProviderSetting register={register} />
      <AdvancedSetting register={register} />
      {
        !!ProviderServer && <AccountSettings register={register} />
      }

      <DMPSetting register={register} />
      <AutoSuggestSetting register={register} />
      <ConsideredContextSetting register={register} />
      <ExtractorOptionsSetting register={register} />
      <OtherProvidersSetting register={register} />
      <OptionsSetting register={register} />
    </div>
  );
}

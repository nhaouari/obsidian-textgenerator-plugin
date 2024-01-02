import React, { useId } from "react";
import useGlobal from "../../context/global";
import SettingItem from "../components/item";
import SettingsSection from "../components/section";
import Input from "../components/input";
import { useMemo } from "react";
import { useToggle } from "usehooks-ts";
import type { Register } from ".";

const contextNotForTemplate = ["includeTitle", "starredBlocks"];

const extendedInfo: Record<
  string,
  {
    description?: string;
    name?: string;
  }
> = {
  PDFExtractor: {
    name: "PDF Extractor",
    description: "Enable or disable PDF extractor.",
  },

  WebPageExtractor: {
    name: "Web Page Extractor",
    description: "Enable or disable web page extractor.",
  },

  AudioExtractor: {
    name: "Audio Extractor (Whisper)",
    description:
      "Enable or disable audio extractor using Whisper OpenAI ($0.006 / minute) supports multi-languages and accepts a variety of formats (m4a, mp3, mp4, mpeg, mpga, wav, webm).",
  },

  ImageExtractor: {
    name: "Image Extractor",
    description: "Enable or disable Image Extractor from URL",
  },

  ImageExtractorEmbded: {
    name: "Embedded Image Extractor",
    description: "Enable or disable Embedded Image Extractor.",
  },

  YoutubeExtractor: {
    name: "Youtube Extractor",
    description: "Enable or disable Youtube extractor.",
  },
};

export default function ExtractorsOptionsSetting(props: {
  register: Register;
}) {
  const global = useGlobal();
  const sectionId = useId();

  const listOfOptions = useMemo(
    () => Object.keys(global.plugin.defaultSettings.extractorsOptions),
    []
  );

  return (
    <SettingsSection
      title="Extractors Options"
      className="plug-tg-flex plug-tg-w-full plug-tg-flex-col"
      register={props.register}
      id={sectionId}
    >
      {listOfOptions
        .filter((d) => !contextNotForTemplate.contains(d))
        .map((key) => {
          const moreData = extendedInfo[key];
          return (
            <SettingItem
              key={moreData?.name || key}
              name={moreData?.name || key}
              description={
                moreData?.description ||
                `Enable or disable ${key.toLowerCase()} Extractor.`
              }
              register={props.register}
              sectionId={sectionId}
            >
              <Input
                type="checkbox"
                value={
                  "" +
                  global.plugin.settings.extractorsOptions[
                  key as keyof typeof global.plugin.settings.extractorsOptions
                  ]
                }
                setValue={async (val) => {
                  global.plugin.settings.extractorsOptions[
                    key as keyof typeof global.plugin.settings.extractorsOptions
                  ] = val == "true";
                  await global.plugin.saveSettings();
                  global.triggerReload();
                }}
              />
            </SettingItem>
          );
        })}
    </SettingsSection>
  );
}

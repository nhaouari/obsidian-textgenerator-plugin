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
    name: "PDF 提取器",
    description: "启用或禁用 PDF 提取器",
  },

  WebPageExtractor: {
    name: "网页提取器",
    description: "启用或禁用网页提取器",
  },

  AudioExtractor: {
    name: "音频提取器（Whisper）",
    description:
      "启用或禁用 Whisper 音频提取器（$0.006/分钟），支持多语言，格式支持 m4a、mp3、mp4、mpeg、mpga、wav、webm",
  },

  ImageExtractor: {
    name: "图片提取器",
    description: "启用或禁用从 URL 提取图片",
  },

  ImageExtractorEmbded: {
    name: "嵌入图片提取器",
    description: "启用或禁用嵌入图片提取器",
  },

  YoutubeExtractor: {
    name: "YouTube 提取器",
    description: "启用或禁用 YouTube 提取器",
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
      title="提取器选项"
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

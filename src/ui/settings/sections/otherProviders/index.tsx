import React from "react";
import type { Register } from "..";
import WisperProviderSetting from "./whisper";

export default function OtherProvidersSetting(props: { register: Register }) {
  return (
    <>
      <WisperProviderSetting register={props.register} />
    </>
  );
}

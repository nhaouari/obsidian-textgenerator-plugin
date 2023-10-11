import React from "react";
import type TextGeneratorPlugin from "../../main";
import { GlobalProvider } from "./global";

export default function Contexts(props: {
  children?: any;
  plugin: TextGeneratorPlugin;
}) {
  return (
    <GlobalProvider plugin={props.plugin}>{props.children}</GlobalProvider>
  );
}

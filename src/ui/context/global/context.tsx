import { createContext } from "react";
import TextGeneratorPlugin from "../../../main";
// import Extractor from "@/lib/extractors";

export interface GlobalType {
  loading: boolean;
  setLoading: (nloading: boolean) => void;
  plugin: TextGeneratorPlugin;
  triggerReload: () => void;
  /** listen for triggerReload */
  trg: boolean;
}

export const defaultValues: GlobalType = {
  loading: true,
  setLoading() {},
  plugin: {} as any,
  triggerReload() {},
  trg: false,
};

export const GlobalContext = createContext<GlobalType>(defaultValues);

import React, { useEffect, useState } from "react";
import { useContext } from "react";

import TextgeneratorPlugin from "../../../main";
import { GlobalContext, GlobalType, defaultValues } from "./context";
import { useDebounce, useToggle } from "usehooks-ts";

const event = new Event("triggerReloadGlobalReact-textgenerator");

export function GlobalProvider(props: {
  children: any;
  plugin: TextgeneratorPlugin;
}) {
  const [loading, setLoading] = useState(defaultValues.loading);
  const [_trg, triggerReload] = useToggle();

  const trg = useDebounce(_trg, 80);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      if (loading == true) {
        setLoading(false);
      }
    }, 60 * 1000);
    return () => {
      clearTimeout(t);
    };
  }, [loading]);

  useEffect(() => {
    const ev = () => {
      triggerReload();
    };
    window.addEventListener(event.type, ev);

    return () => {
      window.removeEventListener(event.type, ev);
    };
  }, []);

  const values: GlobalType = {
    loading,
    setLoading,
    triggerReload() {
      window.dispatchEvent(event);
    },
    trg,
    plugin: props.plugin,
  };

  return (
    <GlobalContext.Provider value={values}>
      {props.children}
    </GlobalContext.Provider>
  );
}

export default function useGlobal() {
  return useContext(GlobalContext);
}

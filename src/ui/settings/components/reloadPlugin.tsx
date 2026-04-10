import useGlobal from "#/ui/context/global";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

const requiresReloadLSName = "tg-requires-reload";

export function useReloder() {
  const [_, setDidChangeAnything] = useLocalStorage(
    requiresReloadLSName,
    false
  );

  return [setDidChangeAnything, _] as const;
}

export default function ReloadPluginPopup(props: object) {
  const global = useGlobal();
  const [didChangeAnything, setDidChangeAnything] = useLocalStorage(
    requiresReloadLSName,
    false
  );
  const reloadPlugin = async () => {
    setDidChangeAnything(false);

    // @ts-ignore
    await global.plugin.app.plugins.disablePlugin(
      "textgenerator-zh"
    );

    // @ts-ignore
    await global.plugin.app.plugins.enablePlugin(
      "textgenerator-zh"
    );

    // @ts-ignore
    global.plugin.app.setting
      .openTabById("textgenerator-zh")
      .display();
  };

  return (
    didChangeAnything && (
      <div className="plug-tg-absolute plug-tg-bottom-0 plug-tg-right-0 plug-tg-z-20 plug-tg-p-3">
        <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2 plug-tg-overflow-hidden plug-tg-rounded-md plug-tg-bg-[var(--interactive-accent)] plug-tg-p-3 plug-tg-font-bold">
          <div>需要重载插件以使更改生效</div>
          <button onClick={reloadPlugin}>重载</button>
        </div>
      </div>
    )
  );
}

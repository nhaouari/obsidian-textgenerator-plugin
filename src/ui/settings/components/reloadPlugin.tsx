import useGlobal from "#/ui/context/global";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

const requiresReloadLSName = "tg-requires-reload";

export function useReloder() {
    const [_, setDidChangeAnything] = useLocalStorage(
        requiresReloadLSName,
        false
    );

    return [setDidChangeAnything, _] as const
}

export default function ReloadPluginPopup(props: {}) {
    const global = useGlobal();
    const [didChangeAnything, setDidChangeAnything] = useLocalStorage(
        requiresReloadLSName,
        false
    );
    const reloadPlugin = async () => {
        setDidChangeAnything(false);

        // @ts-ignore
        await global.plugin.app.plugins.disablePlugin(
            "obsidian-textgenerator-plugin"
        );

        // @ts-ignore
        await global.plugin.app.plugins.enablePlugin(
            "obsidian-textgenerator-plugin"
        );

        // @ts-ignore
        global.plugin.app.setting
            .openTabById("obsidian-textgenerator-plugin")
            .display();
    };

    return didChangeAnything && (
        <div className="absolute bottom-0 right-0 z-20 p-3">
            <div className="flex items-center gap-2 overflow-hidden rounded-md bg-[var(--interactive-accent)] p-3 font-bold">
                <div>YOU NEED TO RELOAD THE PLUGIN</div>
                <button onClick={reloadPlugin}>Reload</button>
            </div>
        </div>
    )
}
import React, { useEffect, useId, useState } from "react";
import useGlobal from "../context/global";
import clsx from "clsx";
import Input from "../settings/components/input";
import JSON5 from "json5"
import { IconDatabaseImport, IconFileUpload, IconPackageExport, IconPackageImport, IconRestore } from "@tabler/icons-react";
import { currentDate, extractJsonFromText, getCurrentTime } from "#/utils";
import SettingItem from "../settings/components/item";
export default function ExportImportHandler(props: { getConfig: () => any, id: string, onImport: (data: any) => Promise<void>, defaultConfig?: any }) {
    const global = useGlobal();
    const backupsDatasetId = useId();


    const [backups, setBackups] = useState<string[]>([]);
    const [selectedBackup, setSelectedBackup] = useState("");
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState("");

    const backupsDirectory = global.plugin.getTextGenPath(`configs/${props.id}`);

    useEffect(() => {
        (async () => {
            if (!await app.vault.adapter.exists(backupsDirectory)) return setBackups([]);
            const list = await app.vault.adapter.list(backupsDirectory);
            setBackups(list.files.map(f => f.substring(backupsDirectory.length + 1)));
        })()
    }, [global.trg, backupsDirectory]);

    const exportButtonDisabled = !selectedBackup?.length || !backups.includes(selectedBackup)


    return <>
        <datalist id={backupsDatasetId}>
            {[...backups].map(bu => <option key={bu} value={bu} />)}
        </datalist>

        <SettingItem
            name="Config File"
            description="Select Config file to be used"
        >
            <Input
                value={selectedBackup}
                datalistId={backupsDatasetId}
                placeholder="config.json.md"
                setValue={async (value) => {
                    setSelectedBackup(value);
                }}
            />
        </SettingItem>
        <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-between plug-tg-items-center">
            <div></div>
            <div className="plug-tg-flex plug-tg-gap-2">

                <button
                    className={clsx({
                        "plug-tg-btn-disabled plug-tg-opacity-70": exportButtonDisabled,
                        "plug-tg-cursor-pointer": !exportButtonDisabled,
                    })}
                    disabled={importing || exportButtonDisabled}

                    onClick={async () => {
                        setError("");
                        setImporting(true);
                        try {
                            const path = (`${backupsDirectory}/${selectedBackup}`)
                            const file = await global.plugin.app.vault.getAbstractFileByPath(path);
                            if (!file) return setError(`file ${path} not found`)
                            const txt = await global.plugin.app.vault.read(file as any);
                            const newData = extractJsonFromText(txt);

                            await props.onImport(newData)
                        } catch (err) {
                            setError(err?.message || err)
                        }
                        setImporting(false);
                    }}
                ><IconDatabaseImport /></button>
                <button

                    onClick={async () => {
                        setError("");
                        setExporting(true);
                        try {

                            await global.plugin.app.vault.adapter.mkdir(backupsDirectory);

                            const config = { ...await props.getConfig() };
                            delete config.api_key;
                            const configAsString = `\`\`\`JSON
${JSON5.stringify(config, null, 2)}
\`\`\``;

                            let fileName = `config_${currentDate()}${getCurrentTime()}.json.md`;

                            // use the provided name if it doesn't exists already (if it exists it could just be the user selecting one of his configs)
                            if (selectedBackup?.length && !backups.includes(selectedBackup)) fileName = selectedBackup + (selectedBackup.endsWith(".json.md") ? "" : ".json.md")

                            const newPath = `${backupsDirectory}/${fileName}`;

                            await global.plugin.app.vault.adapter.write(newPath, configAsString)
                        } catch (err) {
                            setError(err?.message || err)
                        }
                        setExporting(false);
                        global.triggerReload();
                    }}
                    className={clsx({
                        "plug-tg-btn-disabled plug-tg-loading": exporting
                    })}
                    disabled={exporting}
                ><IconPackageExport /></button>

                {!!props.defaultConfig &&
                    <button
                        className="plug-tg-cursor-pointer"
                        onClick={async () => {
                            setError("");
                            await props.onImport({ ...props.defaultConfig })
                        }}
                    ><IconRestore /></button>
                }

                {/* <button><IconFileUpload /></button> */}

            </div>
        </div>
        <div>
            {error}
        </div>
    </>
}
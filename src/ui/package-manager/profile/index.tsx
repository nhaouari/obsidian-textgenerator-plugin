import clsx from "clsx";
import { requestUrl } from "obsidian";
import React, { useEffect, useState } from "react";
import { ProviderServer } from "../package-manager";

export default function Profile(props: { apiKey: string, mini?: boolean }) {

    const [user, setUser] = useState({
        name: "User",
        image: "",
        email: ""
    });

    useEffect(() => {
        (async () => {
            const res = await requestUrl({
                url: new URL("/api/v2/account", ProviderServer).href,
                headers: {
                    authorization: `Bearer ${props.apiKey}`,
                }
            })

            const user = (await res.json).user;

            setUser(user)
        })()
    }, [props.apiKey])

    return <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2 plug-tg-tooltip plug-tg-tooltip-bottom" data-tip={user?.name || user?.email}>
        <img src={user?.image} width={props.mini ? 24 : 64} height={props.mini ? 24 : 64} className="plug-tg-rounded-md plug-tg-overflow-hidden" />
        {!props.mini && <div className={clsx({
            "plug-tg-text-xl": !props.mini
        })}>
            {user?.name || user.email}
        </div>}
    </div>
}
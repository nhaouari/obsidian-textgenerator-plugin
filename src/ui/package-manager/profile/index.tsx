import { baseForLogin } from "#/ui/login/login-view";
import { requestUrl } from "obsidian";
import React, { useEffect, useState } from "react";

export default function Profile(props: { apiKey: string }) {

    const [user, setUser] = useState({
        name: "User",
        image: ""
    });

    useEffect(() => {
        (async () => {
            const res = await requestUrl({
                url: new URL("/api/v2/account", baseForLogin).href,
                headers: {
                    authorization: `Bearer ${props.apiKey}`,
                }
            })

            const user = (await res.json).user;

            setUser(user)
        })()
    })

    return <div className="flex items-center gap-2">
        <img src={user?.image} width={24} height={24} />
        <div>{user?.name}</div>
    </div>
}
import set from "lodash.set";
import TextGeneratorPlugin from "../../main";
import { LoginUI } from "./login-ui";

export default function attemptLogin(plugin: TextGeneratorPlugin) {
    return new Promise((s, r) => {
        const l = new LoginUI(plugin.app, plugin, (a) => {
            l.close();
            s(a)
        }, (a) => {
            l.close();
            r(a)
        });

        l.open();
    })
}


export async function attemptLogout(plugin: TextGeneratorPlugin) {
    set(plugin.settings, `LLMProviderOptions.["package-provider"].apikey`, undefined);
}
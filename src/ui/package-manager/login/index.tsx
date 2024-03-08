import TextGeneratorPlugin from "../../../main";
import { LoginUI } from "./login-ui";

export default function attemptLogin(plugin: TextGeneratorPlugin) {
  return new Promise((s, r) => {
    const l = new LoginUI(
      plugin.app,
      plugin,
      async (a) => {
        l.close();
        await new Promise((s) => setTimeout(s, 300));
        s(a);
      },
      (a) => {
        l.close();
        r(a);
      }
    );

    l.open();
  });
}

export async function attemptLogout(plugin: TextGeneratorPlugin) {
  return plugin.packageManager.setApiKey("");
}

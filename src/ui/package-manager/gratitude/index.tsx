import TextGeneratorPlugin from "../../../main";
import GratitudeUI from "./ui";

export default function showGratitude(plugin: TextGeneratorPlugin, data: any) {
  return new Promise((s, r) => {
    const l = new GratitudeUI(
      plugin.app,
      plugin,
      data,
      async (a) => {
        l.close();
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

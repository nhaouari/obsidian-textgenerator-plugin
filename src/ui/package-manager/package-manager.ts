import {
  TextGeneratorConfiguration,
  PackageTemplate,
  InstalledPackage,
} from "src/types";
import {
  App,
  normalizePath,
  request,
  MarkdownRenderer,
  Notice,
  requestUrl,
} from "obsidian";
import TextGeneratorPlugin from "src/main";
import { gt } from "semver";
import debug from "debug";
import Confirm from "./components/confirm";
import { createFolder } from "#/utils";
import set from "lodash.set";

import showGratitude from "./gratitude"

const logger = debug("textgenerator:PackageManager");

const packageRegistry = `https://raw.githubusercontent.com/text-gen/text-generator-packages/master/community-packages.json`;
const corePackageRegistry = `https://raw.githubusercontent.com/text-gen/text-generator-packages/master/core-packages.json`;

export const PackageProviderid = "package-provider"

export const ProviderServer = ""


export default class PackageManager {
  configuration: TextGeneratorConfiguration;
  app: App;
  plugin: TextGeneratorPlugin;
  constructor(app: App, plugin: TextGeneratorPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  getPromptsPath() {
    return this.plugin.settings.promptsPath;
  }

  async load() {
    logger("load");
    const adapter = this.app.vault.adapter;
    const configPath = this.getConfigPath();

    this.configuration ??= {
      installedPackagesHash: {},
      packagesHash: {},
      resources: {},
      subscriptions: []
    };

    if (await adapter.exists(configPath)) {
      try {
        this.configuration = JSON.parse(await adapter.read(configPath)) as any;
      } catch (err: any) {
        console.warn("packageManager: couldn't parse the config file ", configPath);
        await this.initConfigFlie();
      }
    } else {
      await this.initConfigFlie();
    }

    if (!this.configuration.packagesHash) this.configuration.packagesHash = {};
    if (!this.configuration.installedPackagesHash) this.configuration.installedPackagesHash = {};

    // @ts-ignore
    if (this.configuration.installedPackages?.length) {
      // @ts-ignore
      this.configuration.installedPackages.forEach(p => {
        this.configuration.installedPackagesHash[p.packageId] = p;
      })

      // @ts-ignore
      delete this.configuration["installedPackages"]
    }

    // @ts-ignore
    if (this.configuration.packages?.length) {
      // @ts-ignore
      this.configuration.packages.forEach(p => {
        this.configuration.installedPackagesHash[p.packageId] = p;
      })

      // @ts-ignore
      delete this.configuration["packages"]
    }

    await this.fetch();
    logger("load end", this.configuration);

    // test
    // showGratitude(this.plugin, this.configuration.packagesHash[Object.keys(this.configuration.packagesHash)[0]])

    const self = this;

    try {
      this.plugin.registerAction<{ apikey?: string }>("login", async (props) => {
        const apikey = props.apikey;

        if (!apikey) return "";

        await self.plugin.packageManager.setApiKey(apikey);
      });
    } catch { }

    try {
      this.plugin.registerAction<{ packageId?: string }>("bought-package", async (props) => {
        console.log("bought item", { props })
        console.log("doing something cool", props, props.packageId ? self.configuration.packagesHash[props.packageId] : "")
        // do something cool
        if (props.packageId)
          await showGratitude(self.plugin, self.configuration.packagesHash[props.packageId])
      });
    } catch { }
  }


  async initConfigFlie() {
    logger("initConfigFlie");
    const initConfig = {
      packages: [],
      installedPackages: [],
    };
    const adapter = this.app.vault.adapter;
    adapter.write(this.getConfigPath(), JSON.stringify(initConfig, null, 2));
    this.configuration = JSON.parse(await adapter.read(this.getConfigPath())) as any;
  }

  getConfigPath() {
    return normalizePath(this.app.vault.configDir + "/text-generator.json");
  }

  async save() {
    logger("save");
    const adapter = this.app.vault.adapter;
    const configPath = this.getConfigPath();
    adapter.write(configPath, JSON.stringify(this.configuration, null, 2));
    logger("save end", this.configuration);
  }

  async checkUpdates() {
    logger("checkUpdates");
    await this.fetch();
    const packagesIdsToUpdate: string[] = [];
    await Promise.all(
      Object.entries(this.configuration.installedPackagesHash).map(async ([installedPackage, promptId], i: number) => {
        try {
          const pkg = this.getPackageById(installedPackage.packageId);
          if (
            pkg &&
            installedPackage.version &&
            pkg.version &&
            gt(pkg.version, installedPackage.version)
          ) {
            packagesIdsToUpdate.push(installedPackage.packageId);
          }
        } catch (err: any) {
          delete this.configuration.installedPackagesHash[promptId]
          console.error(`error in package`, installedPackage, err);
        }
      }));
    logger("checkUpdates end", { packagesIdsToUpdate });
    return packagesIdsToUpdate;
  }

  async fetch() {
    logger("fetch start");
    await this.updatePackagesList(); // new packageIds
    logger("fetch updatePackagesList OK");
    await this.updatePackagesStats(); // update download states
    logger("fetch updatePackagesStats OK");
    await this.updatePackagesInfo(); // update of packages in their repo
    logger("fetch updatePackagesInfo OK");
    try {
      await this.updateBoughtResources();
    } catch (err: any) {
      console.warn("couldn't updateBoughtResources")
    }
  }

  async updateBoughtResources() {
    const apikey = this.getApikey()
    if (!ProviderServer || !apikey) return;

    const data = await getBoughtResources(apikey);

    if (data.subscriptions)
      this.configuration.subscriptions = data.subscriptions;

    if (data.resources)
      this.configuration.resources = data.resources;
  }

  getApikey() {
    return this.plugin.settings?.LLMProviderOptions?.[PackageProviderid]?.api_key
  }

  async setApiKey(newKey?: string) {
    set(this.plugin.settings, `LLMProviderOptions.[${PackageProviderid}].api_key`, newKey);
    this.plugin.encryptAllKeys();
    await this.plugin.saveSettings();
  }

  getResourcesOfFolder(folderName?: string) {
    return Object.values(this.configuration.resources || {}).filter(r => r.folderName == folderName)
  }

  async validateOwnership(packageId: string): Promise<{
    allowed: boolean,
    oneRequired?: string[],
  }> {
    const pkg = this.getPackageById(packageId);

    if (!pkg || !pkg.price || !pkg.folderName) return {
      allowed: true,
    };

    return await validateOwnership(pkg.folderName, this.getApikey())
  }

  simpleCheckOwnership(packageId: string) {
    const pkg = this.getPackageById(packageId);

    if (!pkg || !pkg.price) return true;
    const resources = this.getResourcesOfFolder(pkg.folderName);

    return !!resources.length
  }

  async installPackage(packageId: string, installAllPrompts = true) {
    console.log("trying to install package", packageId)
    logger("installPackage", { packageId, installAllPrompts });
    const p = await this.getPackageById(packageId);

    if (!p?.repo) throw "couldn't find package";

    const repo = p.repo;

    if (p.type == "feature") {
      await this.installFeatureExternal(p)
    } else {
      // Its a normal package templates

      let data: {
        packageId: string;
        prompts: string[];
      } | null = null;

      // if its from an external source
      if (p.folderName) {
        const resources = await this.getResourcesOfFolder(p.folderName);
        data = {
          packageId: p.packageId,
          prompts: resources.map(r => r.id)
        }
      } else {
        const release = await this.getReleaseByRepo(repo);
        data = await this.getAsset(release, "data.json");
      }

      if (!data) throw "couldn't get assets";

      // this.configuration.installedPackages {packageId,prompts,installedPrompts=empty}
      const installedPrompts: string[] = [];
      if (!this.configuration.installedPackagesHash[packageId] && p) {
        const obj = {
          packageId,
          prompts: data.prompts.map((promptId) => ({ promptId } as any)),
          installedPrompts: installedPrompts.map(
            (promptId) => ({ promptId } as any)
          ),
          version: p.version,
        }

        this.configuration.installedPackagesHash[packageId] = obj

        if (installAllPrompts) {
          await Promise.all(
            data.prompts.map((promptId) =>
              p.folderName
                ? this.installPromptExternal(packageId, promptId, true)
                : this.installPrompt(packageId, promptId, true)
            )
          );
          new Notice(`Package ${packageId} installed`);
        }

      }
      await this.save();
      logger("installPackage end", { packageId, installAllPrompts });
    }
  }

  async uninstallPackage(packageId: string) {
    logger("uninstallPackage", { packageId });
    const p = await this.getPackageById(packageId);

    if (p?.type === "feature")
      await this.app.vault.adapter.rmdir(`.obsidian/plugins/${p.packageId}`, true)
    else {
      await this.toTrash(packageId)
    }

    delete this.configuration.installedPackagesHash[packageId];

    new Notice(`Package ${packageId} uninstalled`);
    await this.save();
    logger("uninstallPackage end", { packageId });
  }

  async toTrash(packageId: string, promptId?: string) {
    logger("toTrash", { packageId, promptId });
    const adapter = this.app.vault.adapter;
    const trashPackageDir = normalizePath(
      this.getPromptsPath() + "/trash/" + packageId
    );

    if (!(await adapter.exists(trashPackageDir))) {
      await adapter.mkdir(trashPackageDir);
    }

    const promptsPath = this.getPromptsPath();
    const from = this.getPromptPath(packageId, promptId);
    const to = normalizePath(
      `${promptsPath}/trash/${packageId}${promptId ? `/${promptId}.md` : ""}`
    );

    if (await adapter.exists(from)) {
      try {
        // remove destination if exists
        if (await adapter.exists(to))
          if (promptId) await adapter.remove(to)
          else await adapter.rmdir(to, true);
      } catch { }

      if (!promptId) {
        const list = (await adapter.list(from)).files;

        if (!await adapter.exists(to)) await adapter.mkdir(to)

        // copy
        for (const item of list) {
          await adapter.copy(item, `${to}/${item.split("/").reverse()[0]}`);
        }

        // remove old
        await adapter.rmdir(from, true);
      } else {
        // copy
        await adapter.copy(from, to);

        // remove old
        await adapter.remove(from)
      }
    } else {
      console.warn("prompt file does not exist", { packageId, promptId });
    }
    logger("toTrash end", { packageId, promptId });
  }

  async updatePackage(packageId: string) {
    logger("updatePackage", { packageId });
    const p = await this.getPackageById(packageId);
    const index = packageId;

    if (p?.type == "feature") {
      await this.installPackage(p.packageId)
      return;
    }

    if (p?.repo) {
      const repo = p.repo;
      const release = await this.getReleaseByRepo(repo);
      const data = await this.getAsset(release, "data.json");

      if (!data) throw "Couldn't get assets";

      let installedPrompts: string[] = [];
      await Promise.all(
        data.prompts.map((promptId) =>
          this.installPrompt(packageId, promptId, true)
        )
      );
      installedPrompts = data.prompts;
      this.configuration.installedPackagesHash[index] = {
        packageId,
        prompts: data.prompts.map((promptId) => ({ promptId } as any)),
        installedPrompts: installedPrompts.map(
          (promptId) => ({ promptId } as any)
        ),
        version: release.version,
      };
    }
    await this.save();
    new Notice(`Package ${packageId} updated`);
    logger("updatePackage end", { packageId });
  }

  getPackageById(packageId: string): PackageTemplate | null {
    return this.configuration.packagesHash?.[packageId] || null;
  }

  getPackagesList() {
    const list = Object.values(this.configuration.packagesHash).map((p) => ({
      ...p,
      installed: !!this.configuration.installedPackagesHash[p.packageId],
    }));
    return list;
  }

  getInstalledPackagesList() {
    return Object.values(this.configuration.installedPackagesHash);
  }

  async getInstalledPackageById(packageId: string) {
    if (this.configuration.packagesHash[packageId]?.type == "feature") {
      return await this.app.vault.adapter.exists(`.obsidian/plugins/${this.configuration.packagesHash[packageId].packageId}`) ?
        this.configuration.installedPackagesHash[packageId]
        : null
    }
    return this.configuration.installedPackagesHash[packageId] || null;
  }

  async updatePackageInfoById(packageId: string) {
    logger("updatePackageInfoById", { packageId });
    let manifest = await this.getPackageById(packageId);
    if (!manifest) throw `couldn't get repo from package ${packageId}`;
    if (manifest.type != "feature")
      try {
        const repo = manifest.repo
        if (!manifest) throw `it doesn't have repo ${packageId}`;
        //const release = await this.getReleaseByRepo(repo);
        //const manifest= await this.getAsset(release,'manifest.json');
        const url = `https://raw.githubusercontent.com/${repo}/master/manifest.json`;
        manifest = JSON.parse(await request({ url: url })) as any;
        // console.log(manifest);
        this.setPackageInfo(packageId, (manifest as any));
      } catch (err: any) {
        console.error(err);
      }

    await this.save();
    logger("updatePackageInfoById end", { packageId });
  }

  setPackageInfo(packageId: string, info: PackageTemplate) {
    return this.configuration.packagesHash[packageId] = info;
  }

  async addPackage(repo: string) {
    logger("addPackage", { repo });
    // download assets: manifest file, prompts.json
    // add manifest to this.configuration.packages {packageId,prompts,installedPrompts=empty}
    const release = await this.getReleaseByRepo(repo);
    const manifest = await this.getAsset(release, "manifest.json");

    if (!manifest) throw "couldn't get manifest";
    if (!manifest.packageId && !this.configuration.packagesHash[manifest.packageId]) throw `package id (${manifest.packageId}) already being used, or is undefined`

    this.configuration.packagesHash[manifest.packageId] = manifest;

    await this.save();
    logger("addPackage end", { repo });
  }

  getPromptById(packageId: string, promptId: string) {
    return this.configuration.installedPackagesHash[packageId]
      ?.prompts?.find((prompt) => prompt.promptId === promptId);
  }

  async getReleaseByPackageId(packageId: string) {
    logger("getReleaseByPackageId", { packageId });
    const p = await this.getPackageById(packageId);
    if (p?.repo) {
      logger("getReleaseByPackageId end", { packageId });
      return await this.getReleaseByRepo(p.repo);
    } else {
      logger("getReleaseByPackageId error", "Package ID not found.");
      console.error("Package ID not found.");
    }
  }

  async getReleaseByRepo(repo: string) {
    logger("getReleaseByRepo", { repo });
    const rawReleases = JSON.parse(
      await request({
        url: `https://api.github.com/repos/${repo}/releases`,
      })
    ) as any;

    const rawRelease: any = rawReleases
      .filter((x: any) => !x.draft && !x.prerelease)
      .sort((x: any) => x.published_at)[0];

    const downloads: number = rawReleases.reduce(
      (p: any, c: any) => (c.assets[0]?.download_count || 0) + p,
      0
    );

    const release = {
      version: rawRelease.tag_name,
      published_at: rawRelease.published_at,
      assets: rawRelease.assets.map((asset: any) => ({
        name: asset.name,
        url: asset.browser_download_url,
      })),
      downloads,
    };
    logger("getReleaseByRepo end", { repo });
    return release;
  }


  /** https://github.com/plugins-galore/obsidian-plugins-galore/blob/bd3553908fa9eacf33a5e1c2e7b0dea2a02a9d80/src/util/gitServerInterface.ts#L86 */
  async getAsset(release: any, name: string) {
    logger("getAsset", { release, name });
    const asset = release.assets.filter((asset: any) => asset.name === name)[0];
    if (!asset) {
      logger("getAsset error", "Asset not found.");
      return null;
    }
    logger("getAsset end", { release, name });

    const txt = await request({
      url: asset.url,
    })
    return JSON.parse(
      txt
    ) as {
      packageId: string;
      prompts: string[];
    };
  }

  async getReadme(packageId: string) {
    logger("getReadme", { packageId });
    const repo = await this.getPackageById(packageId)?.repo;
    const url = `https://raw.githubusercontent.com/${repo}/main/README.md`;
    try {
      const readmeMD = await request({ url: url });
      const el = document.createElement("div");
      MarkdownRenderer.render(
        this.app,
        readmeMD,
        el,
        "",
        this.plugin
      );
      logger(" getReadme end", { packageId });
      return el;
    } catch (error) {
      logger("getReadme error", error);
      console.error(error);
      Promise.reject(error);
    }
  }



  /**
   * download the prompt content
   * update it if it does exist
   * add if its new
   */
  async installPrompt(packageId: string, promptId: string, overwrite = true) {
    try {
      logger("installPrompt", { packageId, promptId, overwrite });
      const pacakge = await this.getPackageById(packageId)
      const repo = pacakge?.repo;
      const url = `https://raw.githubusercontent.com/${repo}/master/prompts/${promptId}.md`;

      await this.writePrompt(
        packageId,
        promptId,
        await request({ url: url }),
        overwrite
      );
      this.configuration.installedPackagesHash[packageId]
        ?.installedPrompts?.push({ promptId: promptId, version: "" }); //this.getPromptById(packageId,promptId).version



    } catch (error) {
      logger("installPrompt error", error);
      console.error(error);
      Promise.reject(error);
    }
    logger("installPrompt end", { packageId, promptId, overwrite });
  }

  /**
  * download the prompt content from external source
  * update it if it does exist
  * add if its new
  */
  async installPromptExternal(packageId: string, id: string, overwrite = true) {
    try {
      logger("installPromptExternal", { packageId, id, overwrite });

      const resource = this.configuration.resources[id];
      const res = await requestUrl({
        url: new URL(`/api/content/${id}`, ProviderServer).href,
        headers: {
          "Authorization": `Bearer ${this.getApikey()}`,
        },
        throw: false
      })

      if (res.status >= 300) {
        throw res.text;
      }

      console.log(resource.name)
      await this.writePrompt(packageId, resource.name, await res.text, true);

      this.configuration.installedPackagesHash[packageId]
        ?.installedPrompts?.push({ promptId: resource.name, version: "" }); //this.getPromptById(packageId,promptId).version
    } catch (error) {
      logger("installPromptExternal error", error);
      console.error(error);
      Promise.reject(error);
    }
    logger("installPromptExternal end", { packageId, id, overwrite });
  }


  /**
  * download the feature from external source
  * update it if it does exist
  * add if its new
  */
  async installFeatureExternal(p: PackageTemplate) {

    // create feature folder    
    const dirPath = `.obsidian/plugins/${p.packageId}`;
    if (!(await app.vault.adapter.exists(dirPath)))
      await createFolder(dirPath, app);

    const files = this.getResourcesOfFolder(p.folderName)

    // get manifest.json
    await Promise.all(
      files.map(async (file) => {
        const id = file.id;
        const res = await requestUrl({
          url: new URL(`/api/content/${id}`, ProviderServer).href,
          headers: {
            "Authorization": `Bearer ${this.getApikey()}`,
          },
          throw: false
        })

        console.log(`${dirPath}/${file.name}`)
        if (res.status >= 300) {
          throw res.text;
        }


        await app.vault.adapter.writeBinary(`${dirPath}/${file.name}`, await res.arrayBuffer);
      })
    )

    const obj: InstalledPackage = {
      packageId: p.packageId,
      prompts: [],
      installedPrompts: [],
      version: p.version,
    }

    this.configuration.installedPackagesHash[p.packageId] = obj

  }

  getPromptPath(packageId: string, promptId?: string) {
    const promptsPath = this.getPromptsPath();
    //app.vault.configDir
    const templatePath = normalizePath(
      `${promptsPath}/${packageId}${promptId ? `/${promptId}.md` : ""}`
    );
    return templatePath;
  }

  async trashLocal(sourcePath: string) {
    try {
      // Read the contents of the source directory
      await this.app.vault.adapter.trashLocal(sourcePath);
    } catch (error) {
      console.error(`Error moving folder: ${error.message}`);
    }
  }

  async writePrompt(
    packageId: string,
    promptId: string,
    content: any,
    overwrite: boolean
  ) {
    logger("writePrompt", { packageId, promptId, content, overwrite });
    const path = this.getPromptPath(packageId, promptId);
    const adapter = this.app.vault.adapter;
    try {
      const packageDir = normalizePath(this.getPromptsPath() + "/" + packageId);
      if (!(await adapter.exists(packageDir))) {
        await adapter.mkdir(packageDir);
      }
      let write = true;
      if (!overwrite && (await adapter.exists(path))) {
        const text =
          "Template " +
          path +
          " exists!\nEither OK to Overread or over Cancel.";
        if ((await Confirm(text)) == false) {
          write = false;
        }
      }

      if (write) {
        adapter.write(path, content);
      }
    } catch (error) {
      logger("writePrompt error", error);
      console.error(error);
      Promise.reject(error);
    }
    logger("writePrompt end", { packageId, promptId, content, overwrite });
  }

  async updatePackagesList() {
    logger("updatePackagesList");
    const remotePackagesList: PackageTemplate[] = [
      ...((JSON.parse(
        await request({ url: packageRegistry })
      ) || []) as any)
        // to exclude any community features or labled as core
        .filter((p: PackageTemplate) => p.type !== "feature" && !p.core),

      // core packages can be templates or features 
      ...(JSON.parse(
        await request({ url: corePackageRegistry })
      ) || []) as any
    ];

    const newPackages = remotePackagesList.filter(
      (p) => !this.getPackageById(p.packageId) || JSON.stringify(p) != JSON.stringify(this.configuration.packagesHash[p.packageId])
    );

    newPackages.forEach(e => {
      this.configuration.packagesHash[e.packageId] = {
        ...e,
        installed: !!this.configuration.packagesHash[e.packageId]?.installed
      };
    })

    this.save();
    logger("updatePackagesList end");
    return newPackages;
  }

  async updatePackagesInfo() {
    logger("updatePackagesInfo");
    await Promise.allSettled(
      Object.values(this.configuration.packagesHash).map((p) =>
        this.updatePackageInfoById(p.packageId)
      )
    );
    this.save();
    logger("updatePackagesInfo end");
  }

  async updatePackagesStats() {
    logger("updatePackagesStats");
    const stats: any = await this.getStats();

    Object.values(this.configuration.packagesHash).forEach((p) => {
      this.configuration.packagesHash[p.packageId] = {
        ...this.configuration.packagesHash[p.packageId],
        downloads: stats[p.packageId] ? stats[p.packageId].downloads : 0,
      }
    })

    this.save();
    logger("updatePackagesStats end");
  }

  async getStats() {
    logger("getStats");
    const remotePackagesListUrl = `https://raw.githubusercontent.com/text-gen/text-generator-packages/master/community-packages-stats.json`;
    const stats: any[] = JSON.parse(
      await request({ url: remotePackagesListUrl })
    ) as any;
    logger("getStats end");
    return stats;
  }
}


import FC from "func-cache"

export const validateOwnership = FC(async (packageId: string, apikey: string) => {
  const res = await requestUrl({
    url: new URL(`/api/content/package/${packageId}/verify`, ProviderServer).href,
    headers: {
      "Authorization": `Bearer ${apikey}`,
    },
    throw: false
  })

  const d: {
    allowed: boolean;
    oneRequired: string[];
    details?: string;
  } = await res.json;

  if (res.status > 300)
    throw d.details;
  return d;
})


const getBoughtResources = FC(async (apikey: string) => {
  const res = await requestUrl({
    url: new URL(`/api/v2/resources`, ProviderServer).href, headers: {
      "Authorization": `Bearer ${apikey}`,
    },
    throw: false
  })

  if (res.status > 300) throw res.text;

  const data: {
    resources: Record<string, {
      id: string
      name: string
      size: number
      types: string
      metadata: Record<string, string>
      folderName: string
    }>;
    subscriptions: {
      id: string,
      name: string,
      type: string,
    }[];
  } = await res.json;

  return data;
}, {
  // (1 sec) in miliseconds
  lifeTime: 1000,

  /** debounce time wait to call onDataUpdate, default 1000ms */
  // debounceTimer: 1000,

  /** incase the call is async, (sometimes the script doesn't detect it's async and wont run the await for it) default: false */
  async: true,
})
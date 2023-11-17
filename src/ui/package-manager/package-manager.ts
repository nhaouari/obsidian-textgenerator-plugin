import {
  TextGeneratorConfiguration,
  PackageTemplate,
  PromptTemplate,
  InstalledPackage,
} from "src/types";
import {
  App,
  normalizePath,
  request,
  MarkdownRenderer,
  Notice,
} from "obsidian";
import TextGeneratorPlugin from "src/main";
import { gt } from "semver";
import debug from "debug";
import Confirm from "./components/confirm";
const logger = debug("textgenerator:PackageManager");

const packageRegistry = `https://raw.githubusercontent.com/text-gen/text-generator-packages/master/community-packages.json`;

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
    };

    if (await adapter.exists(configPath)) {
      this.configuration = JSON.parse(await adapter.read(configPath));
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
  }


  async initConfigFlie() {
    logger("initConfigFlie");
    const initConfig = {
      packages: [],
      installedPackages: [],
    };
    const adapter = this.app.vault.adapter;
    adapter.write(this.getConfigPath(), JSON.stringify(initConfig, null, 2));
    this.configuration = JSON.parse(await adapter.read(this.getConfigPath()));
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
  }

  getApikey() {
    return this.plugin.settings?.LLMProviderOptions?.["package-provider"]?.apikey
  }

  async installPackage(packageId: string, installAllPrompts = true) {
    logger("installPackage", { packageId, installAllPrompts });
    const p = await this.getPackageById(packageId);

    if (!p?.repo) throw "couldn't find package";

    const repo = p.repo;

    if (p.type == "extension") {
      // extension way of installing pacakge

      // TODO: THIS WILL STAY COMMENTED UNTIL WE CONFIRM WITH THE OBSIDIAN TEAM.
      // it also requires some more work to it, to seperate the repos
      // // get manifest.json
      // const res = await fetch(new URL(`/api/content/${p.repo}`, baseForLogin).href, {
      //   headers: {
      //     "Authorization": `Bearer ${this.getApikey()}`,
      //   }
      // })
      // await app.vault.adapter.writeBinary("test/manifest.json", await res.arrayBuffer());

      // // get main.js
      // const res2 = await fetch(new URL(`/api/content/${p.repo}`, baseForLogin).href, {
      //   headers: {
      //     "Authorization": `Bearer ${this.getApikey()}`,
      //   }
      // })
      // await app.vault.adapter.writeBinary("test/main.js", await res2.arrayBuffer());

      // // get style.css
      // const res3 = await fetch(new URL(`/api/content/${p.repo}`, baseForLogin).href, {
      //   headers: {
      //     "Authorization": `Bearer ${this.getApikey()}`,
      //   }
      // })
      // await app.vault.adapter.writeBinary("test/style.css", await res3.arrayBuffer());

      const obj: InstalledPackage = {
        packageId,
        prompts: [],
        installedPrompts: [],
        version: p.version,
      }

      this.configuration.installedPackagesHash[packageId] = obj

    } else {
      // Its a normal package templates

      const release = await this.getReleaseByRepo(repo);
      const data = await this.getAsset(release, "data.json");


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
              this.installPrompt(packageId, promptId, true)
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

    // TODO: incase its a extension

    await Promise.all(
      this.getInstalledPackageById(packageId)?.prompts?.map((p) =>
        this.toTrash(packageId, p.promptId)
      ) || []
    );

    delete this.configuration.installedPackagesHash[packageId];

    new Notice(`Package ${packageId} uninstalled`);
    await this.save();
    logger("uninstallPackage end", { packageId });
  }

  async toTrash(packageId: string, promptId: string) {
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
      `${promptsPath}/trash/${packageId}/${promptId}.md`
    );
    if (await adapter.exists(from)) {
      if (!adapter.exists(to)) {
        await adapter.copy(from, to);
      } else {
        await adapter.writeBinary(to, await adapter.readBinary(from)); // if the file exit in trash, overwrite it with the new version
      }
      await adapter.trashLocal(from);
      if ((await adapter.exists(to)) && (await adapter.exists(from))) {
        adapter.remove(from);
      }
    } else {
      console.warn("prompt file does not exist", { packageId, promptId });
    }
    logger("toTrash end", { packageId, promptId });
  }

  async updatePackage(packageId: string) {
    logger("updatePackage", { packageId });
    const p = await this.getPackageById(packageId);
    const index = packageId
    if (p?.repo) {
      const repo = p.repo;
      const release = await this.getReleaseByRepo(repo);
      const data = await this.getAsset(release, "data.json");

      if (!data) throw "couldn't get assets";

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
    const p = this.configuration.packagesHash[packageId];

    if (!p) return null; //throw `couldn't get repo from package ${packageId}`;

    return p;
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

  getInstalledPackageById(packageId: string) {
    return this.configuration.installedPackagesHash[packageId] || null;
  }

  async updatePackageInfoById(packageId: string) {
    logger("updatePackageInfoById", { packageId });
    let manifest = await this.getPackageById(packageId);
    if (!manifest) throw `couldn't get repo from package ${packageId}`;
    if (manifest.type != "extension")
      try {
        const repo = manifest.repo
        if (!manifest) throw `it doesn't have repo ${packageId}`;
        //const release = await this.getReleaseByRepo(repo);
        //const manifest= await this.getAsset(release,'manifest.json');
        const url = `https://raw.githubusercontent.com/${repo}/master/manifest.json`;
        manifest = JSON.parse(await request({ url: url }));
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
    );

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
    logger("installPrompt", { packageId, promptId, overwrite });
    const repo = await this.getPackageById(packageId)?.repo;

    const url = `https://raw.githubusercontent.com/${repo}/master/prompts/${promptId}.md`;
    try {
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

  getPromptPath(packageId: string, promptId: string) {
    const promptsPath = this.getPromptsPath();
    //app.vault.configDir
    const templatePath = normalizePath(
      `${promptsPath}/${packageId}/${promptId}.md`
    );
    return templatePath;
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
    const remotePackagesListUrl = packageRegistry;
    const remotePackagesList: PackageTemplate[] = JSON.parse(
      await request({ url: remotePackagesListUrl })
    );

    const newPackages = remotePackagesList.filter(
      (p) => !this.getPackageById(p.packageId)
    );

    newPackages.forEach(e => {
      this.configuration.packagesHash[e.packageId] = e;
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
    );
    logger("getStats end");
    return stats;
  }
}

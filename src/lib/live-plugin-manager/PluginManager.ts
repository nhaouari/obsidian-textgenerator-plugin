import * as fs from "./fileSystem";
import * as path from "path";
import { NpmRegistryClient, NpmRegistryConfig } from "./NpmRegistryClient";
import { PluginVm } from "./PluginVm";
import { IPluginInfo } from "./PluginInfo";
import * as semver from "semver";
import Debug from "debug";
import { GithubRegistryClient, GithubAuth } from "./GithubRegistryClient";
import { BitbucketRegistryClient, BitbucketAuth } from "./BitbucketRegistryClient";
import { PackageJsonInfo, PackageInfo } from "./PackageInfo";
const debug = Debug("live-plugin-manager");

const BASE_NPM_URL = "https://registry.npmjs.org";
const DefaultMainFile = "index.js";

type IgnoreDependency = string | RegExp

type NodeJSGlobal = typeof global;

export interface PluginManagerOptions {
	cwd: string;
	pluginsPath: string;
	sandbox: PluginSandbox;
	npmRegistryUrl: string;
	npmRegistryConfig: NpmRegistryConfig;
	npmInstallMode: "useCache" | "noCache";
	requireCoreModules: boolean;
	hostRequire?: NodeRequire;
	ignoredDependencies: IgnoreDependency[];
	staticDependencies: { [key: string]: any; };
	githubAuthentication?: GithubAuth;
	bitbucketAuthentication?: BitbucketAuth;
	lockWait: number;
	lockStale: number;
}

export interface PluginSandbox {
	env?: NodeJS.ProcessEnv;
	global?: NodeJSGlobal;
}


function createDefaultOptions(): PluginManagerOptions {
	const cwd = process.cwd();
	
	return {
		cwd,
		npmRegistryUrl: BASE_NPM_URL,
		sandbox: {},
		npmRegistryConfig: {},
		npmInstallMode: "useCache",
		pluginsPath: path.join(cwd, "plugin_packages"),
		requireCoreModules: true,
		hostRequire: require,
		ignoredDependencies: [/^@types\//],
		staticDependencies: {},
		lockWait: 120000,
		lockStale: 180000,
	};
}

const NPM_LATEST_TAG = "latest";

export interface InstallFromPathOptions {
	force: boolean;
}

export class PluginManager {
	readonly options: PluginManagerOptions;
	private readonly vm: PluginVm;
	private readonly installedPlugins = new Array<IPluginInfo>();
	private readonly npmRegistry: NpmRegistryClient;
	private readonly githubRegistry: GithubRegistryClient;
	private readonly bitbucketRegistry: BitbucketRegistryClient;
	private readonly sandboxTemplates = new Map<string, PluginSandbox>();

	constructor(options?: Partial<PluginManagerOptions>) {
		if (options && !options.pluginsPath && options.cwd) {
			options.pluginsPath = path.join(options.cwd, "plugin_packages");
		}

		this.options = { ...createDefaultOptions(), ...(options || {}) };
		this.vm = new PluginVm(this);
		this.npmRegistry = new NpmRegistryClient(this.options.npmRegistryUrl, this.options.npmRegistryConfig);
		this.githubRegistry = new GithubRegistryClient(this.options.githubAuthentication);
		this.bitbucketRegistry = new BitbucketRegistryClient(this.options.bitbucketAuthentication);
	}

	async install(name: string, version?: string): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installLockFree(name, version);
		} finally {
			await this.syncUnlock();
		}
	}

	/**
	 * Install a package from npm
	 * @param name name of the package
	 * @param version version of the package, default to "latest"
	 */
	async installFromNpm(name: string, version = NPM_LATEST_TAG): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installFromNpmLockFreeCache(name, version);
		} finally {
			await this.syncUnlock();
		}
	}

	/**
	 * Install a package from a local folder
	 * @param location package local folder location
	 * @param options options, if options.force == true then package is always reinstalled without version checking
	 */
	async installFromPath(location: string, options: Partial<InstallFromPathOptions> = {}): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installFromPathLockFree(location, options);
		} finally {
			await this.syncUnlock();
		}
	}

	async installFromGithub(repository: string): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installFromGithubLockFree(repository);
		} finally {
			await this.syncUnlock();
		}
	}

	async installFromBitbucket(repository: string): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installFromBitbucketLockFree(repository);
		} finally {
			await this.syncUnlock();
		}
	}

	/**
	 * Install a package by specifiing code directly. If no version is specified it will be always reinstalled.
	 * @param name plugin name
	 * @param code code to be loaded, equivalent to index.js
	 * @param version optional version, if omitted no version check is performed
	 */
	async installFromCode(name: string, code: string, version?: string): Promise<IPluginInfo> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.installFromCodeLockFree(name, code, version);
		} finally {
			await this.syncUnlock();
		}
	}

	async uninstall(name: string): Promise<void> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			return await this.uninstallLockFree(name);
		} finally {
			await this.syncUnlock();
		}
	}

	async uninstallAll(): Promise<void> {
		await fs.ensureDir(this.options.pluginsPath);

		await this.syncLock();
		try {
			// TODO First I should install dependents plugins??
			for (const plugin of this.installedPlugins.slice().reverse()) {
				await this.uninstallLockFree(plugin.name);
			}
		} finally {
			await this.syncUnlock();
		}
	}

	list(): IPluginInfo[] {
		return this.installedPlugins.map((p) => p);
	}

	require(fullName: string): any {
		const { pluginName, requiredPath } = this.vm.splitRequire(fullName);

		const info = this.getInfo(pluginName);
		if (!info) {
			throw new Error(`${pluginName} not installed`);
		}

		return this.load(info, requiredPath);
	}

	setSandboxTemplate(name: string, sandbox: PluginSandbox | undefined): void {
		const info = this.getInfo(name);
		if (!info) {
			throw new Error(`${name} not installed`);
		}

		if (!sandbox) {
			this.sandboxTemplates.delete(info.name);
			return;
		}
		this.sandboxTemplates.set(info.name, sandbox);
	}

	getSandboxTemplate(name: string): PluginSandbox | undefined {
		return this.sandboxTemplates.get(name);
	}

	alreadyInstalled(
		name: string,
		version?: string,
		mode: "satisfies" | "satisfiesOrGreater" = "satisfies"): IPluginInfo | undefined {
		const installedInfo = this.getInfo(name);
		if (installedInfo) {
			if (!version) {
				return installedInfo;
			}

			if (semver.satisfies(installedInfo.version, version)) {
				return installedInfo;
			} else if (mode === "satisfiesOrGreater" && semver.gtr(installedInfo.version, version)) {
				return installedInfo;
			}
		}

		return undefined;
	}

	getInfo(name: string): IPluginInfo | undefined {
		return this.installedPlugins.find((p) => p.name === name);
	}

	queryPackage(name: string, version?: string): Promise<PackageInfo> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		version = this.validatePluginVersion(version);

		if (version && this.githubRegistry.isGithubRepo(version)) {
			return this.queryPackageFromGithub(version);
		}

		return this.queryPackageFromNpm(name, version);
	}

	queryPackageFromNpm(name: string, version = NPM_LATEST_TAG): Promise<PackageInfo> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		version = this.validatePluginVersion(version);

		return this.npmRegistry.get(name, version);
	}

	queryPackageFromGithub(repository: string): Promise<PackageInfo> {
		return this.githubRegistry.get(repository);
	}

	runScript(code: string): any {
		return this.vm.runScript(code);
	}

	private async uninstallLockFree(name: string): Promise<void> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		if (debug.enabled) {
			debug(`Uninstalling ${name}...`);
		}

		const info = this.getInfo(name);
		if (!info) {
			if (debug.enabled) {
				debug(`${name} not installed`);
			}
			return;
		}

		await this.deleteAndUnloadPlugin(info);
	}

	private async installLockFree(name: string, version?: string): Promise<IPluginInfo> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		version = this.validatePluginVersion(version);

		if (version && this.githubRegistry.isGithubRepo(version)) {
			return this.installFromGithubLockFree(version);
		}

		return this.installFromNpmLockFreeCache(name, version);
	}

	private async installFromPathLockFree(
		location: string, options: Partial<InstallFromPathOptions>): Promise<IPluginInfo> {
		const packageJson = await this.readPackageJsonFromPath(location);

		if (!this.isValidPluginName(packageJson.name)) {
			throw new Error(`Invalid plugin name '${packageJson.name}'`);
		}

		// already installed satisfied version
		if (!options.force) {
			const installedInfo = this.alreadyInstalled(packageJson.name, packageJson.version);
			if (installedInfo) {
				return installedInfo;
			}
		}

		// already installed not satisfied version
		if (this.alreadyInstalled(packageJson.name)) {
			await this.uninstallLockFree(packageJson.name);
		}

		// already downloaded
		if (options.force || !(await this.isAlreadyDownloaded(packageJson.name, packageJson.version))) {
			await this.removeDownloaded(packageJson.name);

			if (debug.enabled) {
				debug(`Copy from ${location} to ${this.options.pluginsPath}`);
			}
			await fs.copy(location, this.getPluginLocation(packageJson.name), { exclude: ["node_modules"] });
		}

		const pluginInfo = await this.createPluginInfo(packageJson.name);

		return this.addPlugin(pluginInfo);
	}

	/** Install from npm or from cache if already available */
	private async installFromNpmLockFreeCache(name: string, version = NPM_LATEST_TAG): Promise<IPluginInfo> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		version = this.validatePluginVersion(version);

		// already installed satisfied version
		const installedInfo = this.alreadyInstalled(name, version);
		if (installedInfo) {
			return installedInfo;
		}

		if (this.alreadyInstalled(name)) {
			// already installed not satisfied version, then uninstall it first
			await this.uninstallLockFree(name);
		}

		if (this.options.npmInstallMode === "useCache"
			&& await this.isAlreadyDownloaded(name, version)) {
			const pluginInfo = await this.createPluginInfo(name);
			return this.addPlugin(pluginInfo);
		}

		return this.installFromNpmLockFreeDirect(name, version);
	}

	/** Install from npm */
	private async installFromNpmLockFreeDirect(name: string, version = NPM_LATEST_TAG): Promise<IPluginInfo> {
		const registryInfo = await this.npmRegistry.get(name, version);

		// already downloaded
		if (!(await this.isAlreadyDownloaded(registryInfo.name, registryInfo.version))) {
			await this.removeDownloaded(registryInfo.name);

			await this.npmRegistry.download(
				this.options.pluginsPath,
				registryInfo);

			console.log("downloaded")
		}

		const pluginInfo = await this.createPluginInfo(registryInfo.name);
		return this.addPlugin(pluginInfo);
	}

	private async installFromGithubLockFree(repository: string): Promise<IPluginInfo> {
		const registryInfo = await this.githubRegistry.get(repository);

		if (!this.isValidPluginName(registryInfo.name)) {
			throw new Error(`Invalid plugin name '${registryInfo.name}'`);
		}

		// already installed satisfied version
		const installedInfo = this.alreadyInstalled(registryInfo.name, registryInfo.version);
		if (installedInfo) {
			return installedInfo;
		}

		// already installed not satisfied version
		if (this.alreadyInstalled(registryInfo.name)) {
			await this.uninstallLockFree(registryInfo.name);
		}

		// already downloaded
		if (!(await this.isAlreadyDownloaded(registryInfo.name, registryInfo.version))) {
			await this.removeDownloaded(registryInfo.name);

			await this.githubRegistry.download(
				this.options.pluginsPath,
				registryInfo);
		}

		const pluginInfo = await this.createPluginInfo(registryInfo.name);
		return this.addPlugin(pluginInfo);
	}

	private async installFromBitbucketLockFree(repository: string): Promise<IPluginInfo> {
		const registryInfo = await this.bitbucketRegistry.get(repository);

		if (!this.isValidPluginName(registryInfo.name)) {
			throw new Error(`Invalid plugin name '${registryInfo.name}'`);
		}

		// already installed satisfied version
		const installedInfo = this.alreadyInstalled(registryInfo.name, registryInfo.version);
		if (installedInfo) {
			return installedInfo;
		}

		// already installed not satisfied version
		if (this.alreadyInstalled(registryInfo.name)) {
			await this.uninstallLockFree(registryInfo.name);
		}

		// already downloaded
		if (!(await this.isAlreadyDownloaded(registryInfo.name, registryInfo.version))) {
			await this.removeDownloaded(registryInfo.name);

			await this.bitbucketRegistry.download(
				this.options.pluginsPath,
				registryInfo);
		}

		const pluginInfo = await this.createPluginInfo(registryInfo.name);
		return this.addPlugin(pluginInfo);
	}

	private async installFromCodeLockFree(name: string, code: string, version = "0.0.0"): Promise<IPluginInfo> {
		if (!this.isValidPluginName(name)) {
			throw new Error(`Invalid plugin name '${name}'`);
		}

		if (!semver.valid(version)) {
			throw new Error(`Invalid plugin version '${version}'`);
		}

		const packageJson: PackageInfo = {
			name,
			version
		};

		// already installed satisfied version
		if (version !== "0.0.0") {
			const installedInfo = this.alreadyInstalled(packageJson.name, packageJson.version);
			if (installedInfo) {
				return installedInfo;
			}
		}

		// already installed not satisfied version
		if (this.alreadyInstalled(packageJson.name)) {
			await this.uninstallLockFree(packageJson.name);
		}

		// already created
		if (!(await this.isAlreadyDownloaded(packageJson.name, packageJson.version))) {
			await this.removeDownloaded(packageJson.name);

			if (debug.enabled) {
				debug(`Create plugin ${name} to ${this.options.pluginsPath} from code`);
			}

			const location = this.getPluginLocation(name);
			await fs.ensureDir(location);
			await fs.writeFile(path.join(location, DefaultMainFile), code);
			await fs.writeFile(path.join(location, "package.json"), JSON.stringify(packageJson));
		}

		const pluginInfo = await this.createPluginInfo(packageJson.name);
		return this.addPlugin(pluginInfo);
	}

	private async installDependencies(plugin: IPluginInfo): Promise<{ [name: string]: string }> {
		if (!plugin.dependencies) {
			return {};
		}

		const dependencies: { [name: string]: string } = {};

		for (const key in plugin.dependencies) {
			if (!plugin.dependencies.hasOwnProperty(key)) {
				continue;
			}
			if (this.shouldIgnore(key)) {
				continue;
			}

			const version = plugin.dependencies[key];

			if (this.isModuleAvailableFromHost(key, version)) {
				if (debug.enabled) {
					debug(`Installing dependencies of ${plugin.name}: ${key} is already available on host`);
				}
			} else if (this.alreadyInstalled(key, version, "satisfiesOrGreater")) {
				if (debug.enabled) {
					debug(`Installing dependencies of ${plugin.name}: ${key} is already installed`);
				}
			} else {
				if (debug.enabled) {
					debug(`Installing dependencies of ${plugin.name}: ${key} ...`);
				}
				await this.installLockFree(key, version);
			}

			// NOTE: maybe here I should put the actual version?
			dependencies[key] = version;
		}

		return dependencies;
	}

	private unloadDependents(pluginName: string) {
		for (const installed of this.installedPlugins) {
			if (installed.dependencies[pluginName]) {
				this.unloadWithDependents(installed);
			}
		}
	}

	private unloadWithDependents(plugin: IPluginInfo) {
		this.unload(plugin);

		this.unloadDependents(plugin.name);
	}

	private isModuleAvailableFromHost(name: string, version: string): boolean {
		if (!this.options.hostRequire) {
			return false;
		}

		// TODO Here I should check also if version is compatible?
		// I can resolve the module, get the corresponding package.json
		//  load it and get the version, then use
		// if (semver.satisfies(installedInfo.version, version))
		// to check if compatible...

		try {
			const modulePackage = this.options.hostRequire(name + "/package.json") as PackageInfo;
			return semver.satisfies(modulePackage.version, version);
		} catch (e) {
			return false;
		}
	}

	private isValidPluginName(name: string) {
		if (typeof name !== "string") {
			return false;
		}

		if (name.length === 0) {
			return false;
		}

		// '/' is permitted to support scoped packages
		if (name.startsWith(".")
			|| name.indexOf("\\") >= 0) {
			return false;
		}

		return true;
	}

	private validatePluginVersion(version?: string): string {
		version = version || NPM_LATEST_TAG;

		if (typeof version !== "string") {
			throw new Error("Invalid version");
		}

		return version;
	}

	private getPluginLocation(name: string) {
		return path.join(this.options.pluginsPath, name);
	}

	private async removeDownloaded(name: string) {
		const location = this.getPluginLocation(name);
		if (!(await fs.directoryExists(location))) {
			await fs.remove(location);
		}
	}

	private async isAlreadyDownloaded(name: string, version: string): Promise<boolean> {
		if (!version) {
			version = ">0.0.1";
		}

		if (version === NPM_LATEST_TAG) {
			return false;
		}

		const packageJson = await this.getDownloadedPackage(name, version);
		if (!packageJson) {
			return false;
		}

		return packageJson.name === name
			&& semver.satisfies(packageJson.version, version);
	}

	private async getDownloadedPackage(name: string, _version: string): Promise<PackageInfo | undefined> {
		const location = this.getPluginLocation(name);
		if (!(await fs.directoryExists(location))) {
			return;
		}

		try {
			const packageJson = await this.readPackageJsonFromPath(location);

			return packageJson;
		} catch (e) {
			return;
		}
	}

	private async readPackageJsonFromPath(location: string): Promise<PackageJsonInfo> {
		const packageJsonFile = path.join(location, "package.json");
		if (!(await fs.fileExists(packageJsonFile))) {
			throw new Error(`Invalid plugin ${location}, package.json is missing`);
		}
		const packageJson = await fs.readJsonFile(packageJsonFile);

		if (!packageJson.name
			|| !packageJson.version) {
			throw new Error(
				`Invalid plugin ${location}, 'main', 'name' and 'version' properties are required in package.json`);
		}

		return packageJson as PackageJsonInfo;
	}

	private load(plugin: IPluginInfo, filePath?: string): any {
		filePath = filePath || plugin.mainFile;

		const resolvedPath = this.vm.resolve(plugin, filePath);

		if (debug.enabled) {
			debug(`Loading ${filePath} of ${plugin.name} (${resolvedPath})...`);
		}

		return this.vm.load(plugin, resolvedPath);
	}

	private unload(plugin: IPluginInfo) {
		if (debug.enabled) {
			debug(`Unloading ${plugin.name}...`);
		}
		this.vm.unload(plugin);
	}

	private async addPlugin(plugin: IPluginInfo): Promise<IPluginInfo> {
		await this.installDependencies(plugin);

		this.installedPlugins.push(plugin);

		// this.unloadDependents(plugin.name);

		return plugin;
	}

	private async deleteAndUnloadPlugin(plugin: IPluginInfo): Promise<void> {
		const index = this.installedPlugins.indexOf(plugin);
		if (index >= 0) {
			this.installedPlugins.splice(index, 1);
		}
		this.sandboxTemplates.delete(plugin.name);

		this.unloadWithDependents(plugin);

		await fs.remove(plugin.location);
	}

	private async syncLock() {
		if (debug.enabled) {
			debug("Acquiring lock ...");
		}

		const { default: lockFile } = await import("lockfile");

		const lockLocation = path.join(this.options.pluginsPath, "install.lock");
		return new Promise<void>((resolve, reject) => {
			lockFile.lock(lockLocation, { wait: this.options.lockWait, stale: this.options.lockStale }, (err) => {
				if (err) {
					if (debug.enabled) {
						debug("Failed to acquire lock", err);
					}
					return reject("Failed to acquire lock: " + err.message);
				}

				resolve();
			});
		});
	}

	private async syncUnlock() {
		if (debug.enabled) {
			debug("Releasing lock ...");
		}

		const { default: lockFile } = await import("lockfile");

		const lockLocation = path.join(this.options.pluginsPath, "install.lock");
		return new Promise<void>((resolve, reject) => {
			lockFile.unlock(lockLocation, (err) => {
				if (err) {
					if (debug.enabled) {
						debug("Failed to release lock", err);
					}
					return reject("Failed to release lock: " + err.message);
				}

				resolve();
			});
		});
	}

	private shouldIgnore(name: string): boolean {
		for (const p of this.options.ignoredDependencies) {
			let ignoreMe = false;
			if (p instanceof RegExp) {
				ignoreMe = p.test(name);
				if (ignoreMe) {
					return true;
				}
			}

			ignoreMe = new RegExp(p).test(name);
			if (ignoreMe) {
				return true;
			}
		}

		for (const key in this.options.staticDependencies) {
			if (!this.options.staticDependencies.hasOwnProperty(key)) {
				continue;
			}

			if (key === name) {
				return true;
			}
		}

		return false;
	}

	private async createPluginInfo(name: string): Promise<IPluginInfo> {
		const location = this.getPluginLocation(name);
		const packageJson = await this.readPackageJsonFromPath(location);

		const mainFile = path.normalize(path.join(location, packageJson.main || DefaultMainFile));

		return {
			name: packageJson.name,
			version: packageJson.version,
			location,
			mainFile,
			dependencies: packageJson.dependencies || {}
		};
	}
}

import * as path from "path";
import * as fs from "./fileSystem";
import {Headers, headersBasicAuth, httpJsonGet} from "./httpUtils";
import Debug from "debug";
import { downloadTarball, extractTarball } from "./tarballUtils";
import { PackageJsonInfo } from "./PackageInfo";
const debug = Debug("live-plugin-manager.BitbucketRegistryClient");

export class BitbucketRegistryClient {
	private headers: Headers;

	constructor(auth?: BitbucketAuth) {
		if (auth) {
			debug(`Authenticating Bitbucket api with ${auth.type}...`);

			switch (auth.type) {
				case "basic":
				this.headers = {
					...headersBasicAuth(auth.username, auth.password),
					"user-agent": "live-plugin-manager"
				};
				break;
				default:
					throw new Error("Auth type not supported");
			}
		} else {
			this.headers = {};
		}
	}

	async get(repository: string): Promise<PackageJsonInfo> {
		const repoInfo = extractRepositoryInfo(repository);

		debug("Repository info: ", repoInfo);

		const urlPkg
		= `https://api.bitbucket.org/2.0/repositories/${repoInfo.owner}/${repoInfo.repo}/src/${repoInfo.ref}/package.json`;

		const pkgContent = await httpJsonGet<PackageJsonInfo>(
			urlPkg,
			{...this.headers, accept: "application/json"});
		if (!pkgContent || !pkgContent.name || !pkgContent.version) {
			throw new Error("Invalid plugin Bitbucket repository " + repository);
		}

		const urlArchiveLink
		= `https://bitbucket.org/${repoInfo.owner}/${repoInfo.repo}/get/${repoInfo.ref}.tar.gz`;

		pkgContent.dist = { tarball: urlArchiveLink };

		return pkgContent;
	}

	async download(
		destinationDirectory: string,
		packageInfo: PackageJsonInfo): Promise<string> {

		if (!packageInfo.dist || !packageInfo.dist.tarball) {
			throw new Error("Invalid dist.tarball property");
		}

		const tgzFile = await downloadTarball(packageInfo.dist.tarball, this.headers);

		const pluginDirectory = path.join(destinationDirectory, packageInfo.name);

		try {
			await extractTarball(tgzFile, pluginDirectory);
		} finally {
			await fs.remove(tgzFile);
		}

		return pluginDirectory;
	}

	isBitbucketRepo(version: string): boolean {
		return version.indexOf("/") > 0;
	}
}

function extractRepositoryInfo(repository: string) {
	const parts = repository.split("/");
	if (parts.length !== 2) {
		throw new Error("Invalid repository name");
	}

	const repoParts = parts[1].split("#");

	const repoInfo = {
		owner: parts[0],
		repo: repoParts[0],
		ref: repoParts[1] || "master"
	};

	return repoInfo;
}

export interface BitbucketAuthBasic  {
	type: "basic";
	username: string;
	password: string;
}

export type BitbucketAuth = BitbucketAuthBasic

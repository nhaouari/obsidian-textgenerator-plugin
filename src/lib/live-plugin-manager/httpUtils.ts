import * as fs from "./fileSystem";
import Debug from "debug";
const debug = Debug("live-plugin-manager.HttpUtils");

export interface Headers {
	[name: string]: string;
}

export function headersBearerAuth(token: string): Headers {
	return {
		Authorization: "Bearer " + token
	};
}

export function headersTokenAuth(token: string): Headers {
	return {
		Authorization: "token " + token
	};
}

export function headersBasicAuth(username: string, password: string): Headers {
	return {
		Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64")
	};
}

export async function httpJsonGet<T>(sourceUrl: string, headers?: Headers): Promise<T | undefined> {
	if (debug.enabled) {
		debug(`Json GET ${sourceUrl} ...`);
		debug("HEADERS", headers);
	}
	const res = await fetch(sourceUrl, { headers: { ...headers } });

	if (debug.enabled) {
		debug("Response HEADERS", res.headers);
	}

	if (!res.ok) {
		throw new Error(`Response error ${res.status} ${res.statusText}`);
	}

	return res.json() as T;
}

export async function httpDownload(sourceUrl: string, destinationFile: string, headers?: Headers): Promise<void> {
	if (debug.enabled) {
		debug(`Download GET ${sourceUrl} ...`);
		debug("HEADERS", headers);
	}
	const res = await fetch(sourceUrl, { headers: { ...headers } });

	if (debug.enabled) {
		debug("Response HEADERS", res.headers);
	}

	if (!res.ok) {
		throw new Error(`Response error ${res.status} ${res.statusText}`);
	}

	console.log("saving to file", destinationFile)
	await fs.writeFile(destinationFile, Buffer.from(await res.arrayBuffer()))
	console.log("saved file")
}

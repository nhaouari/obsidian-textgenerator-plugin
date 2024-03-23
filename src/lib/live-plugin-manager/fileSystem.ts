import * as fs from "fs/promises";
import * as path from "path";

// @ts-ignore
export { createWriteStream } from "fs-extra";

export function remove(fsPath: string): Promise<void> {
	return fs.rm(fsPath, {
		force: true,
		recursive: true
	});
}

export async function directoryExists(fsPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(fsPath);

		return stats.isDirectory();
	} catch (err: any) {
		if (err.code === "ENOENT") {
			return false;
		}

		throw err;
	}
}

export async function fileExists(fsPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(fsPath);

		return stats.isFile();
	} catch (err: any) {
		if (err.code === "ENOENT") {
			return false;
		}

		throw err;
	}
}

export async function ensureDir(fsPath: string) {
	try {
		await fs.mkdir(fsPath, {
			recursive: true
		});
	} catch { }
}

export function readFile(fsPath: string, encoding: string): Promise<string> {
	return fs.readFile(fsPath, {
		encoding: encoding as any
	}) as any;
}

export async function readJsonFile(fsPath: string) {
	const content = await fs.readFile(fsPath, {
		encoding: "utf-8"
	})

	return JSON.parse(content) as Record<any, any>;
}

export function writeFile(fsPath: string, content: any, encoding?: BufferEncoding | null | undefined): Promise<void> {
	return fs.writeFile(fsPath, content, { encoding });
}

export function copy(src: string, dest: string, options?: Partial<CopyOptions>): Promise<void> {
	const excludeList = options && options.exclude
		? options.exclude.map((f) => path.join(src, f).toLowerCase())
		: [];

	const filter = (filterSrc: string, _filterDest: string) => {
		filterSrc = filterSrc.toLowerCase();

		if (excludeList.indexOf(filterSrc) >= 0) {
			return false;
		}
		return true;
	};

	return fs.cp(src, dest, { filter, dereference: true });
}

export interface CopyOptions {
	exclude: string[];
}

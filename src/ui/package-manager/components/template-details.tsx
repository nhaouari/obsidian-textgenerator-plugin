import React, { useState, useEffect } from "react";
import DownloadSVG from "./svgs/download"
import BadgeCheckSVG from "./svgs/badge-check"
import { nFormatter } from "#/utils";
import PackageManager from "../package-manager";
import { PackageTemplate } from "#/types";
import { PluginManifest } from "obsidian";
import { baseForLogin } from "#/ui/login/login-view";
import { useToggle } from "usehooks-ts";


export default function TemplateDetails(inProps: {
	packageId: any,
	packageManager: PackageManager,
	updateView: any,
	checkForUpdates: any,
}) {

	const {
		packageId,
		packageManager,
		updateView,
		checkForUpdates
	} = inProps

	const [installing, setInstalling] = useState(false);
	const [enabling, setEnabling] = useState(false);
	const [error, setError] = useState("");
	const [_, triggerReload] = useToggle();
	const [htmlVar, setHtmlVar] = useState("");

	const [props, setProps] = useState<{
		package?: PackageTemplate | null,
		installed?: any,
		ownedOrReq?: {
			allowed: boolean;
			oneRequired?: string[];
		}
	}>({});

	useEffect(() => {
		(async () => {
			const pkg = packageManager.getPackageById(packageId)
			setProps({
				package: pkg,
				installed: await packageManager.getInstalledPackageById(packageId),
				ownedOrReq: {
					allowed: !pkg?.price || packageManager.simpleCheckOwnership(pkg?.packageId),
					oneRequired: []
				}
			});
		})()
	}, [packageId, installing, enabling, _]);


	const validateOwnership = async () => {
		const ownedOrReq = props.installed ? {
			allowed: true
		} : await packageManager.validatedOwnership(packageId)

		setProps((props) => ({
			...props,
			ownedOrReq
		}));
	}

	useEffect(() => {
		validateOwnership()
	}, [packageId, props.installed]);

	useEffect(() => {
		packageManager.getReadme(packageId).then((html: any) => {
			setHtmlVar(html);
		});
	}, [packageId]);

	async function install() {
		setError("");
		setInstalling(true);
		try {
			await packageManager.installPackage(packageId);
			updateLocalView();
			updateView();
			setInstalling(false);
		} catch (err: any) {
			setError(err.message || err);
			console.error(err)
			setInstalling(false);
		}
	}

	async function uninstall() {
		setError("");
		setInstalling(true);
		try {
			await packageManager.uninstallPackage(packageId);
			updateLocalView();
			updateView();
			setInstalling(false);
		} catch (err: any) {
			setError(err.message || err);
			console.error(err)
			setInstalling(false);
		}
	}

	async function getExtensionId() {
		if (!props.installed || props.package?.type != "extension") throw "getExtensionId wont work here";

		const manifestJson = `.obsidian/plugins/${props.package.packageId}/manifest.json`

		if (!await packageManager.app.vault.adapter.exists(manifestJson)) throw "manifest.json doesn't exist to read the packageid";

		const manifest: PluginManifest = JSON.parse(await packageManager.app.vault.adapter.read(manifestJson))
		console.log({ manifest })
		return manifest.id
	}

	async function enable() {
		setEnabling(true);
		try {

			// @ts-ignore
			await packageManager.app.plugins.enablePlugin(await getExtensionId());
		} catch (err: any) {
			setEnabling(false);
			throw err
		}
		setEnabling(false)
	}

	async function disable() {
		setEnabling(true);
		try {
			// @ts-ignore
			await packageManager.app.plugins.disablePlugin(await getExtensionId());
		} catch (err: any) {
			setEnabling(false);
			throw err
		}
		setEnabling(false);
	}

	async function update() {
		await packageManager.updatePackage(packageId);
		updateLocalView();
		updateView();
		checkForUpdates();
	}

	function updateLocalView() {
		setProps({
			package: packageManager.getPackageById(packageId),
			installed: packageManager.getInstalledPackageById(packageId),
		});
	}

	function buy() {
		try {
			const types = props.ownedOrReq?.oneRequired?.join(",");
			if (!types) throw new Error("Not buyable");

			// open the login website
			window.open(new URL(`/dashboard/subscriptions/checkout?type=${encodeURIComponent(types)}&callback`, baseForLogin).href);
		} catch (err: any) {
			setEnabling(false);
			throw err
		}
	}


	// @ts-ignore
	const enabledExtension = !!packageManager.app.plugins.plugins["obsidian-tg-chat"];


	useEffect(() => {
		// @ts-ignore
		if (global.k) return;
		// @ts-ignore
		global.k = true;

		const onFocus = async () => {
			try {
				await packageManager.updateBoughtResources();
				triggerReload();
			} catch (err: any) {
				console.error(err);
			}
		}

		(async () => {
			try {
				window.addEventListener("focus", onFocus);
			} catch (err: any) {
				console.error(err)
			}
		})();

		return () => {
			window.removeEventListener("focus", onFocus)
		}
	}, [])

	return (<>
		<div className="flex flex-col gap-2">
			<div className="community-modal-info-name">
				{props.package?.name}

				{props.installed && (
					<span className="flair mod-pop">Installed</span>
				)}
			</div>
			<div className="flex flex-col gap-1">
				{props.package?.core ? <>
					<div className="flex gap-2 items-center">
						<BadgeCheckSVG />
						<span> Made By Text-Gen</span>
					</div>
				</> : <div className="community-modal-info-downloads">
					<span>
						<DownloadSVG />
					</span>
					<span className="community-modal-info-downloads-text">
						{nFormatter(props.package?.downloads)}
					</span>
				</div>}

				<div className="community-modal-info-version flex items-center gap-2">
					<span>
						Version:
					</span>
					<span> {props.package?.version} </span>
					<span>
						{props.installed &&
							`(currently installed: ${props.installed.version})`}
					</span>
				</div>
				<div className="community-modal-info-repo flex items-center gap-2">
					<span>
						Platforms:
					</span>
					<span>
						{props.package?.desktopOnly ? "Only Desktop" : "All"}
					</span>
				</div>
				<div className="community-modal-info-repo flex items-center gap-2">
					<span>
						Repository:
					</span>
					<a
						target="_blank"
						href={`https://github.com/${props.package?.repo}`}
					>
						{props.package?.repo}
					</a>
				</div>


				<div className="community-modal-info-author flex items-center gap-2">
					<span>
						By
					</span>
					<a target="_blank" href={`${props.package?.authorUrl}`}>
						{props.package?.author}
					</a>
				</div>

				<div className="community-modal-info-desc select-text">
					{props.package?.description}
				</div>
			</div>
		</div>
		{/* Controls */}
		<div className="community-modal-button-container">
			{!props.ownedOrReq?.allowed && (
				<button
					className="mod-cta cursor-pointer"
					onClick={() => buy()}
				>
					Buy
				</button>
			)}

			{props.installed ? (<>
				{/* extension controls */}
				{
					props.package?.type == "extension" &&
					(!enabledExtension ?
						<button className="bg-red-300 cursor-pointer" onClick={() => !enabling && enable()}>
							Enabl{enabling ? "ing..." : "e"}
						</button>
						:
						<button className="bg-red-300 cursor-pointer" onClick={() => !enabling && disable()}>
							Disabl{enabling ? "ing..." : "e"}
						</button>
					)
				}

				<button className="bg-red-300 cursor-pointer" onClick={() => !installing && uninstall()}>
					Uninstall{installing ? "ing..." : ""}
				</button>
				{props.installed.version !== props.package?.version && (
					<button
						className="mod-cta cursor-pointer"
						onClick={() => update()}
					>
						Update
					</button>
				)}
			</>) : (
				<button className={installing ? "dz-btn-disabled" : "mod-cta"} onClick={() => !installing && install()} disabled={installing}>
					Install{installing ? "ing..." : ""}
				</button>
			)}
			{!props.package?.core && <button
				className="mod-cta cursor-pointer"
				onClick={() =>
					(window.location.href = `${props.package?.authorUrl}`)
				}
			>
				Support
			</button>}
		</div>
		{error && <span> ERROR: {error}</span>}
		<hr />
		<div
			dangerouslySetInnerHTML={{
				// @ts-ignore
				__html: htmlVar.innerHTML || htmlVar || "",
			}}
			className="community-modal-readme markdown-rendered"
		></div>
	</>
	);
}

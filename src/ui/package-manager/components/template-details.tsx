import React, { useState, useEffect } from "react";
import DownloadSVG from "./svgs/download"
import BadgeCheckSVG from "./svgs/badge-check"
import { nFormatter } from "#/utils";
import PackageManager, { ProviderServer } from "../package-manager";
import { PackageTemplate } from "#/types";
import { PluginManifest } from "obsidian";
import { useToggle } from "usehooks-ts";
import attemptLogin from "../login";
import JSON5 from "json5";
import useGlobal from "#/ui/context/global";

export default function TemplateDetails(inProps: {
	packageId: any,
	packageManager: PackageManager,
	updateView: any,
	checkForUpdates: any,
	mini?: boolean
}) {
	const glob = useGlobal();

	const {
		packageId,
		packageManager,
		updateView,
		checkForUpdates
	} = inProps

	const [installing, setInstalling] = useState(false);
	const [progress, setProgress] = useState("0/0");
	const [enabling, setEnabling] = useState(false);
	const [error, setError] = useState("");
	const [_, triggerReload] = useToggle();
	const [htmlVar, setHtmlVar] = useState("");
	const [serviceUnavailable, setServiceUnavailable] = useState(false);

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
			const pkg = packageManager.getPackageById(packageId);
			console.log({
				package: pkg,
				installed: await packageManager.getInstalledPackageById(packageId),
				ownedOrReq: pkg?.price || !pkg?.packageId ? {
					allowed: true,
					oneRequired: []
				} : await packageManager.validateOwnership(pkg?.packageId)
			})


			setProps({
				package: pkg,
				installed: false,
				ownedOrReq: (pkg?.price || !pkg?.packageId) ? {
					allowed: true,
					oneRequired: []
				} : {
					allowed: false,
					oneRequired: []
				}
			});

			packageManager.getInstalledPackageById(packageId).then((installed) => {
				console.log({ installed })
				setProps(p => ({ ...p, installed }))
			})


			if (!(pkg?.price || !pkg?.packageId))
				packageManager.validateOwnership(packageId).then((ownedOrReq) => {
					setProps(p => ({ ...p, ownedOrReq }))
				})

		})()
	}, [packageId, installing, enabling, _]);


	const validateOwnership = async () => {
		try {
			const ownedOrReq = props.installed ? {
				allowed: true
			} : await packageManager.validateOwnership(packageId);

			setProps((props) => ({
				...props,
				ownedOrReq
			}));
		} catch (err: any) {
			setProps((props) => ({
				...props,
				ownedOrReq: {
					allowed: false,
					oneRequired: []
				}
			}));
			setServiceUnavailable((err.message || err).includes("<html>"))
			console.error("failed to validate ownership", err);
		}
	}

	useEffect(() => {
		validateOwnership();
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
			await packageManager.installPackage(packageId, true, (progress) => {
				setProgress(`${progress.installed}/${progress.total}`)
			});

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
			try {

				if (props.package?.type == "feature")
					await disable()
			} catch (err: any) {
				console.warn("couldn't disable the feature")
			}
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

	async function getFeatureId() {
		if (!props.installed || !props.package || props.package.type != "feature") throw "getFeatureId wont work here";

		const manifestJson = `.obsidian/plugins/${props.package.packageId}/manifest.json`

		if (!await packageManager.app.vault.adapter.exists(manifestJson)) throw "manifest.json doesn't exist to read the packageid";

		const manifest: PluginManifest = JSON5.parse(await packageManager.app.vault.adapter.read(manifestJson))
		return manifest.id
	}

	async function enable() {
		setEnabling(true);
		try {
			// @ts-ignore
			await packageManager.app.plugins.enablePlugin(await getFeatureId());
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
			await packageManager.app.plugins.disablePlugin(await getFeatureId());
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

	async function updateLocalView() {
		setProps({
			package: packageManager.getPackageById(packageId),
			installed: await packageManager.getInstalledPackageById(packageId),
		});
	}

	async function buy() {
		try {
			if (!props.package?.packageId) throw "no package selected"
			const pkgOwn = await packageManager.validateOwnership(props.package?.packageId)

			if (!pkgOwn.oneRequired) throw new Error("Not buyable");

			// open the login website
			window.open(new URL(`/dashboard/subscriptions/checkout?type=${encodeURIComponent(pkgOwn.oneRequired.join(","))}&callback=${encodeURIComponent(`obsidian://text-gen?intent=bought-package&packageId=${props.package?.packageId}`)}`, ProviderServer).href);
		} catch (err: any) {
			setEnabling(false);
			throw err
		}
	}


	// @ts-ignore
	const enabledFeature = !!packageManager.app.plugins.plugins["obsidian-tg-chat"];


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
	}, []);

	if (serviceUnavailable) return <div className="plug-tg-w-full plug-tg-h-full plug-tg-flex plug-tg-flex-col plug-tg-justify-center plug-tg-items-center">
		<div className="plug-tg-flex plug-tg-flex-col plug-tg-justify-center plug-tg-gap-8">
			<h1>Service Unavailable</h1>
			<button onClick={triggerReload}>Retry</button>
		</div>
	</div>

	return (<>
		<div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
			<div className="community-modal-info-name">
				{props.package?.name}

				{props.installed && (
					<span className="flair mod-pop">Installed</span>
				)}
			</div>
			<div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
				{props.package?.core ? <>
					<div className="plug-tg-flex plug-tg-gap-2 plug-tg-items-center">
						<BadgeCheckSVG />
						<span>Made By Text-Gen</span>
					</div>
				</> : <div className="community-modal-info-downloads">
					<span>
						<DownloadSVG />
					</span>
					<span className="community-modal-info-downloads-text">
						{nFormatter(props.package?.downloads)}
					</span>
				</div>}

				<div className="community-modal-info-version plug-tg-flex plug-tg-items-center plug-tg-gap-2">
					<span>
						Version:
					</span>
					<span> {props.package?.version} </span>
					<span>
						{props.installed &&
							`(currently installed: ${props.installed.version})`}
					</span>
				</div>
				<div className="community-modal-info-repo plug-tg-flex plug-tg-items-center plug-tg-gap-2">
					<span>
						Platforms:
					</span>
					<span>
						{props.package?.desktopOnly ? "Only Desktop" : "All"}
					</span>
				</div>
				{!props.package?.price && <div className="community-modal-info-repo plug-tg-flex plug-tg-items-center plug-tg-gap-2">
					<span>
						Repository:
					</span>
					<a
						target="_blank"
						href={`https://github.com/${props.package?.repo}`}
					>
						{props.package?.repo}
					</a>
				</div>}


				<div className="community-modal-info-author plug-tg-flex plug-tg-items-center plug-tg-gap-2">
					<span>
						By
					</span>
					<a target="_blank" href={`${props.package?.authorUrl}`}>
						{props.package?.author}
					</a>
				</div>

				<div className="community-modal-info-desc plug-tg-select-text">
					{props.package?.description}
				</div>
			</div>
		</div>
		{/* Controls */}
		<div className="community-modal-button-container">
			{!props.package?.price ? <>
				{!(props.ownedOrReq?.allowed && !props.package?.price) ? (
					<button
						className="mod-cta plug-tg-cursor-pointer"
						onClick={() => buy()}
					>
						Buy
					</button>
				) :
					props.installed ? (<>
						{/* feature controls */}
						{
							props.package?.type == "feature" &&
							(!enabledFeature ?
								<button className="plug-tg-bg-red-300 plug-tg-cursor-pointer" onClick={() => !enabling && enable()}>
									Enabl{enabling ? "ing..." : "e"}
								</button>
								:
								<button className="plug-tg-bg-red-300 plug-tg-cursor-pointer" onClick={() => !enabling && disable()}>
									Disabl{enabling ? "ing..." : "e"}
								</button>
							)
						}

						<button className="plug-tg-bg-red-300 plug-tg-cursor-pointer" onClick={() => !installing && uninstall()}>
							Uninstall{installing ? "ing..." : ""}
						</button>
						{props.installed.version !== props.package?.version && (
							<button
								className="mod-cta plug-tg-cursor-pointer"
								onClick={() => update()}
							>
								Update
							</button>
						)}
					</>) : (
						<button className={installing ? "plug-tg-btn-disabled" : "mod-cta plug-tg-cursor-pointer"} onClick={() => !installing && install()} disabled={installing}>
							Install{installing ? `ing...${progress}` : ""}
						</button>
					)
				}

			</> :
				<button
					className="mod-cta plug-tg-cursor-pointer"
					onClick={async () => {
						await attemptLogin(packageManager.plugin);
						glob.triggerReload();
					}}
				>
					Login
				</button>
			}
			{!props.package?.core && <button
				className="mod-cta plug-tg-cursor-pointer"
				onClick={() =>
					(window.location.href = `${props.package?.authorUrl}`)
				}
			>
				Support
			</button>}
		</div>
		{error && <span> ERROR: {error}</span>}
		<hr />
		{!inProps.mini && <div
			dangerouslySetInnerHTML={{
				// @ts-ignore
				__html: htmlVar.innerHTML || htmlVar || "",
			}}
			className="community-modal-readme markdown-rendered"
		></div>}
	</>
	);
}

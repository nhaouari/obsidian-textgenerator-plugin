import React, { useState, useEffect } from "react";
import DownloadSVG from "./svgs/download"
import { nFormatter } from "#/utils";
import PackageManager from "../package-manager";


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
	const [error, setError] = useState("");

	const [htmlVar, setHtmlVar] = useState("");

	const [props, setProps] = useState<{
		package?: any,
		installed?: any
	}>({});

	useEffect(() => {
		setProps({
			package: packageManager.getPackageById(packageId),
			installed: packageManager.getInstalledPackageById(packageId),
		});
	}, [packageId, installing]);

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

	return (<>
		<div className="flex flex-col gap-2">
			<div className="community-modal-info-name">
				{props.package?.name}
				{props.installed && (
					<span className="flair mod-pop">Installed</span>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<div className="community-modal-info-downloads">
					<span>
						<DownloadSVG />
					</span>
					<span className="community-modal-info-downloads-text">
						{nFormatter(props.package?.downloads)}
					</span>
				</div>
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
		<div className="community-modal-button-container">
			{props.installed ? (
				<span>
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
				</span>
			) : (
				<button className={installing ? "dz-btn-disabled" : "mod-cta"} onClick={() => !installing && install()} disabled={installing}>
					Install{installing ? "ing..." : ""}
				</button>
			)}
			<button
				className="mod-cta cursor-pointer"
				onClick={() =>
					(window.location.href = `${props.package?.authorUrl}`)
				}
			>
				Support
			</button>
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

import { PackageTemplate } from "#/types";
import { nFormatter } from "#/utils";
import React from "react";
import DownloadSVG from "./svgs/download";

function TemplateItem(props: { item: PackageTemplate, selected?: boolean, index?: number, select: any, update: any }) {
	return (
		<div
			className={
				"community-item " + (props.selected ? "is-selected" : "")
			}
			onClick={() => props.select(props.index)}
		>
			<div className="community-item-name">
				{props.item.name}
				{props.item.installed && (
					<span className="flair mod-pop">Installed</span>
				)}
				{props.item.installed && props.update && (
					<span className="tg-update flair mod-pop text-xs">
						Update Available
					</span>
				)}
			</div>
			<div className="community-item-author">{(props.item.type?.[0].toLocaleUpperCase() || "") + (props.item.type?.substring(1) || "") || "Package"} By {props.item.author}</div>
			<div className="community-item-downloads">
				<span>
					<DownloadSVG />
				</span>
				<span className="community-item-downloads-text">
					{nFormatter(props.item.downloads)}
				</span>
				{props.item.price && <span className="community-item-downloads-text">
					{props.item.price}$
				</span>}
			</div>
			<div className="community-item-desc">{props.item.description}</div>
		</div>
	);
}

export default TemplateItem;

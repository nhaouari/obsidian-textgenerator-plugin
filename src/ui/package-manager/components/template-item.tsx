import { PackageTemplate } from "#/types";
import { nFormatter } from "#/utils";
import React from "react";
import DownloadSVG from "./svgs/download";
import BadgeCheckSVG from "./svgs/badge-check";

function TemplateItem(props: { item: PackageTemplate, owned?: boolean, selected?: boolean, index?: number, select: any, update: any }) {
	return (
		<div
			className={
				"community-item flex flex-wrap justify-between" + (props.selected ? "is-selected" : "")
			}
			onClick={() => props.select(props.index)}
		>
			<div>
				<div className="community-item-name">
					<span className="w-auto pr-2 break-words">
						{props.item.name}
					</span>

					{props.item.installed && (
						<span className="flair mod-pop">Installed</span>
					)}
					{props.item.installed && props.update && (
						<span className="tg-update flair mod-pop text-xs">
							Update Available
						</span>
					)}
					{props.item.core && props.item.price ? <span className="flair mod-pop text-xs">
						Premium
					</span> : null}
				</div>
				{!props.item.core && <><div className="community-item-author">{(props.item.type?.[0].toLocaleUpperCase() || "") + (props.item.type?.substring(1) || "") || "Package"} By {props.item.author}</div>
					<div className="community-item-downloads flex items-center gap-1">
						{props.item.core ? <BadgeCheckSVG /> : ""}
						<span>
							<DownloadSVG />
						</span>
						<span className="community-item-downloads-text">
							{nFormatter(props.item.downloads)}
						</span>
					</div>
				</>}

				<div className="community-item-desc">{props.item.description}</div>
			</div>
			{props.item.price ?
				(props.owned ?
					<div className="flex w-full justify-end">
						<span className="community-item-downloads-text">
							Owned
						</span>
					</div>
					: <div className="flex w-full justify-end">
						<span className="community-item-downloads-text">
							{props.item.price}$
						</span>
					</div>)
				: <div className="flex w-full justify-end"></div>
			}
		</div>
	);
}

export default TemplateItem;

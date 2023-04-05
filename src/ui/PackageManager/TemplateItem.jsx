import React from "react";

function TemplateItem({ props, select, update }) {
	return (
		<div
			className={
				"community-item " + (props.selected ? "is-selected" : "")
			}
			onClick={() => select(props.index)}
		>
			<div className="community-item-name">
				{props.name}
				{props.installed && (
					<span className="flair mod-pop">Installed</span>
				)}
				{props.installed && update && (
					<span className="tg-update flair mod-pop">
						Update Available
					</span>
				)}
			</div>
			<div className="community-item-author">By {props.author}</div>
			<div className="community-item-downloads">
				<span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="svg-icon lucide-download-cloud"
					>
						<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
						<path d="M12 12v9"></path>
						<path d="m8 17 4 4 4-4"></path>
					</svg>
				</span>
				<span className="community-item-downloads-text">
					{props.downloads}
				</span>
			</div>
			<div className="community-item-desc">{props.description}</div>
		</div>
	);
}

export default TemplateItem;

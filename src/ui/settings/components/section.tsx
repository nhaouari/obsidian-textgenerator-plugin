import clsx from "clsx";
import React, { useEffect, useState } from "react";

export default function SettingsSection(props: {
	title: string;
	collapsed?: boolean;
	hideTitle?: boolean;
	children?: any;
	className?: any;
	hidden?: boolean;
}) {
	const [collapsed, setCollapsed] = useState(true);

	const [childrenHeight, setChildrenHeight] = useState(100);

	useEffect(
		() => setCollapsed((props.collapsed ?? true) || false),
		[props.collapsed]
	);

	return (
		<div
			className={clsx(
				"border-l border-gray-100/10 p-2 dark:border-white/10",
				props.className,
				{
					"opacity-50": collapsed,
					hidden: props.hidden,
				}
			)}
		>
			{!props.hideTitle && (
				<h2 className="cursor-pointer">
					<div
						className="flex w-full items-center justify-between pb-5 text-left font-medium "
						data-accordion-target="#accordion-flush-body-1"
						aria-expanded="true"
						aria-controls="accordion-flush-body-1"
						onClick={() => setCollapsed((o) => !o)}
					>
						<h3>{props.title}</h3>
						<svg
							data-accordion-icon
							className={clsx(
								"h-3 w-3 shrink-0 transition-transform",
								{
									"-rotate-180": !collapsed,
									"-rotate-90": collapsed,
								}
							)}
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 10 6"
						>
							<path
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 5 5 1 1 5"
							/>
						</svg>
					</div>
				</h2>
			)}

			<div
				ref={(ref) => {
					if (!ref) return;
					let extendedHeight = 0;
					for (let i = 0; i < ref.children.length; i++) {
						// @ts-ignore
						extendedHeight += ref.children[i].offsetHeight;
					}

					setChildrenHeight(extendedHeight);
				}}
				className={clsx("min-h-max overflow-hidden transition-all")}
				style={{
					maxHeight: collapsed ? 0 : `${childrenHeight}px`,
				}}
			>
				{props.children}
			</div>
		</div>
	);
}

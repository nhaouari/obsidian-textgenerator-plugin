import clsx from "clsx";
import React, { useEffect, useId } from "react";
import type { Register } from "../sections";

export default function SettingItem(props: {
	id?: string;
	name: string;
	description?: string;
	children?: any;
	className?: string;
	register: Register;
	sectionId: string;
}) {
	const id = props.id || useId();

	useEffect(() => {
		props.register?.register?.(
			id,
			`${props.name}, ${props.description}`.toLocaleLowerCase(),
			props.sectionId
		);

		return () => props.register?.unRegister?.(id);
	}, [id, props.name, props.description]);

	return (
		<div
			className={clsx(
				"flex w-full items-center justify-between py-2",
				props.className,
				{
					hidden:
						props.register &&
						!props.register.listOfAllowed.contains(id),
				}
			)}
		>
			<div className="flex flex-col gap-1">
				<div>{props.name}</div>
				<div className="text-xs opacity-70">{props.description}</div>
			</div>
			{props.children}
		</div>
	);
}

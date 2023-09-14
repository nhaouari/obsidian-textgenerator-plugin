"use client";
import clsx from "clsx";
import React from "react";
import { useEffect } from "react";
import { useBoolean } from "usehooks-ts";

export default function Dropdown<T extends string>(props: {
	value?: T | any;
	values: T[] | readonly T[];
	defaultValue?: string;
	setValue: (_newvaL: T) => void;
	righty?: boolean;
	className?: any;
}) {
	const { value: isOpen, toggle, setFalse: close } = useBoolean(false);

	useEffect(() => {
		if (!isOpen) return;
		const listener = (e: MouseEvent) => {
			if (e.target instanceof HTMLElement) {
				if (e.target.closest(".dropdown")) return;
				close();
			}
		};

		document.addEventListener("click", listener);

		return () => document.removeEventListener("click", listener);
	}, [isOpen]);

	return (
		<select
			className={clsx(
				"dz-select cursor-pointer bg-[var(--background-modifier-form-field)] px-4",
				props.className
			)}
			value={props.value}
			onChange={(e) => props.setValue?.(e.target.value as any)}
		>
			{/* <option disabled selected>
        {props.value || props.defaultValue}
      </option> */}
			{props.values?.map((val, i) => (
				<option key={i} className="z-20 w-full">
					{val}
				</option>
			))}
		</select>
	);
}

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
  tip?: string;
  textArea?: boolean;
}) {
  const id = props.id || useId();
  useEffect(() => {
    if (props.name == "TG Selection Limiter(regex)")
      console.log("des", props.name, props.description)
    props.register?.register?.(
      id,
      `${props.name}, ${props.description}`.toLocaleLowerCase(),
      props.sectionId
    );

    return () => props.register?.unRegister?.(id);
  }, [id, props.name, props.description]);

  return (
    <div
      data-tip={props.tip}
      className={clsx(
        "flex w-full gap-2 py-2",
        {
          "items-center justify-between": !props.textArea,
          "flex-col": props.textArea,
        },
        props.className,
        {
          hidden: props.register && !props.register.listOfAllowed.contains(id),
          "dz-tooltip": props.tip?.length,
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

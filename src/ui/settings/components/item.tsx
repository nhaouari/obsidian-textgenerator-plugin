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
        "plug-tg-flex plug-tg-w-full plug-tg-gap-2 plug-tg-py-2",
        {
          "plug-tg-items-center plug-tg-justify-between": !props.textArea,
          "plug-tg-flex-col": props.textArea,
        },
        props.className,
        {
          hidden: props.register && !props.register.listOfAllowed.contains(id),
          "plug-tg-tooltip": props.tip?.length,
        }
      )}
    >
      <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-1">
        <div>{props.name}</div>
        <div className="plug-tg-text-xs plug-tg-opacity-70">{props.description}</div>
      </div>
      {props.children}
    </div>
  );
}

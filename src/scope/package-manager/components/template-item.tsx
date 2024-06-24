import { PackageTemplate } from "#/types";
import { nFormatter } from "#/utils";
import React from "react";
import DownloadSVG from "#/ui/svgs/download";
import BadgeCheckSVG from "#/ui/svgs/badge-check";
import clsx from "clsx";

function TemplateItem(props: {
  item: PackageTemplate;
  owned?: boolean;
  selected?: boolean;
  index?: number;
  select: any;
  update: any;
}) {
  return (
    <div
      className={clsx(
        "community-item plug-tg-flex plug-tg-w-full plug-tg-max-w-xs plug-tg-flex-wrap plug-tg-justify-between",
        {
          "is-selected": props.selected,
          "plug-tg-cursor-pointer": !props.selected,
        }
      )}
      onClick={() => props.select(props.index)}
    >
      <div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-2">
        {/* {!!props.item.core && !!props.item.price && <span className="flair mod-pop text-xs max-w-min">
					Premium
				</span>} */}
        <div className="community-item-name">
          <span className="plug-tg-w-auto plug-tg-break-words plug-tg-pr-2">
            {props.item.name}
          </span>

          {!props.item.core && props.item.installed && (
            <span className="flair mod-pop">Installed</span>
          )}
          {props.item.installed && props.update && (
            <span className="plug-tg-update flair mod-pop plug-tg-text-xs">
              Update Available
            </span>
          )}
        </div>
        {!props.item.core && (
          <>
            <div className="community-item-author">
              {(props.item.type?.[0].toLocaleUpperCase() || "") +
                (props.item.type?.substring(1) || "") || "Package"}{" "}
              By {props.item.author}
            </div>
            <div className="community-item-downloads plug-tg-flex plug-tg-items-center plug-tg-gap-1">
              {props.item.core ? <BadgeCheckSVG /> : ""}
              <span>
                <DownloadSVG />
              </span>
              <span className="community-item-downloads-text">
                {nFormatter(props.item.downloads)}
              </span>
            </div>
          </>
        )}

        <div className="community-item-desc">{props.item.description}</div>
      </div>
      {props.item.price ? (
        props.owned ? (
          props.item.installed ? (
            <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
              <span className="community-item-downloads-text">Installed</span>
            </div>
          ) : (
            <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
              <span className="community-item-downloads-text">Owned</span>
            </div>
          )
        ) : (
          <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end">
            <span className="community-item-downloads-text">
              {props.item.price}$
            </span>
          </div>
        )
      ) : (
        <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-end"></div>
      )}
    </div>
  );
}

export default TemplateItem;

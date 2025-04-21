"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "#/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean;
  }
>(({ className, sideOffset = 4, showArrow = false, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "plug-tg-relative plug-tg-z-50 plug-tg-max-w-[280px] plug-tg-rounded-lg plug-tg-border plug-tg-border-border plug-tg-bg-popover plug-tg-px-3 plug-tg-py-1.5 plug-tg-text-sm plug-tg-text-popover-foreground plug-tg-animate-in plug-tg-fade-in-0 plug-tg-zoom-in-95 data-[state=closed]:plug-tg-animate-out data-[state=closed]:plug-tg-fade-out-0 data-[state=closed]:plug-tg-zoom-out-95 data-[side=bottom]:plug-tg-slide-in-from-top-2 data-[side=left]:plug-tg-slide-in-from-right-2 data-[side=right]:plug-tg-slide-in-from-left-2 data-[side=top]:plug-tg-slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {props.children}
      {showArrow && (
        <TooltipPrimitive.Arrow className="-plug-tg-my-px plug-tg-fill-popover plug-tg-drop-shadow-[0_1px_0_var(--border)]" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

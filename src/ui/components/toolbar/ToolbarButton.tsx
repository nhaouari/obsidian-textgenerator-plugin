import React from 'react';
import { cn } from "#/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/ui/components/tooltip";

interface ToolbarButtonProps {
    tip?: string;
    tipPosition?: "top" | "bottom" | "left" | "right";
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
}

// TextTip component wrapper to match the new design pattern
const TextTip: React.FC<{
    tip?: string;
    asChild?: boolean;
    side?: "top" | "bottom" | "left" | "right";
    children: React.ReactNode;
}> = ({ tip, asChild, side = "bottom", children }) => {
    if (!tip) {
        return <>{children}</>;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild={asChild}>
                {children}
            </TooltipTrigger>
            <TooltipContent side={side}>
                {tip}
            </TooltipContent>
        </Tooltip>
    );
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    tip,
    tipPosition = "bottom",
    onClick,
    className = "",
    children,
    disabled,
}) => {
    return (
        <TextTip tip={tip} asChild side={tipPosition}>
            <button
                onClick={onClick}
                disabled={disabled}
                className={cn`plug-tg-flex plug-tg-items-center plug-tg-justify-center plug-tg-p-2 plug-tg-h-10 plug-tg-min-w-10 disabled:plug-tg-opacity-50 disabled:plug-tg-cursor-default hover:plug-tg-bg-gray-200/30 dark:hover:plug-tg-bg-gray-700 plug-tg-rounded ${className}`}
            >
                {children}
            </button>
        </TextTip>
    );
}; 
import React from 'react';

interface ToolbarButtonProps {
    tip?: string;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
}
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    tip,
    onClick,
    className,
    children,
    disabled = false
}) => {
    return (
        <button
            title={tip}
            onClick={onClick}
            className={`plug-tg-flex plug-tg-items-center plug-tg-justify-center plug-tg-p-2 plug-tg-text-sm plug-tg-text-white hover:plug-tg-bg-white/10 focus:plug-tg-outline-none plug-tg-rounded plug-tg-transition-colors ${className || ''} ${disabled ? 'plug-tg-opacity-50 plug-tg-cursor-not-allowed' : 'plug-tg-cursor-pointer'}`}
            disabled={disabled}
            onMouseDown={(e) => {
                // Prevent the editor from losing focus on mousedown
                e.preventDefault();
            }}
        >
            {children}
        </button>
    );
}; 
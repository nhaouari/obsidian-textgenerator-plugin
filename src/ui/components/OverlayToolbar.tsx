import React from 'react';
import { Toolbar } from './toolbar';
import { TooltipProvider } from '#/ui/components/tooltip';
import { MarkdownView, Editor } from 'obsidian';
import TextGeneratorPlugin from '#/main';

interface OverlayToolbarProps {
    view: MarkdownView;
    editor: Editor;
    position: { top: number; left: number };
    onClose: () => void;
    plugin?: TextGeneratorPlugin | null;
}

export default function OverlayToolbarComp({
    view,
    editor,
    position,
    onClose,
    plugin
}: OverlayToolbarProps) {
    return (
        <TooltipProvider>
            <Toolbar
                view={view}
                editor={editor}
                position={position}
                onClose={onClose}
                plugin={plugin}
            />
        </TooltipProvider>
    );
};
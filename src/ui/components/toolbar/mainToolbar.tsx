import React, { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { ToolbarButton } from './ToolbarButton';

interface MainToolbarProps {
    view: EditorView;
    position: { top: number; left: number };
    onClose: () => void;
    setShowingItem: (item: 'main' | 'askAi' | 'settings') => void;
    lastText: string;
    setLastText: (text: string) => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
    view,
    position,
    onClose,
    setShowingItem,
    lastText,
    setLastText
}) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const originalSelectionRef = useRef<{ from: number, to: number } | null>(null);

    const clearAll = () => {
        setShowingItem('main');
        setLastText('');
    };

    useEffect(() => {
        if (!view) {
            clearAll();
            return;
        }

        const selection = view.state.selection.main;
        if (!selection.empty) {
            originalSelectionRef.current = { from: selection.from, to: selection.to };
        }

        view.dom.addEventListener('hide', () => {
            clearAll();
            originalSelectionRef.current = null;
        });

        const preventSelectionLoss = (e: MouseEvent) => {
            e.preventDefault();
        };

        toolbarRef.current?.addEventListener('mousedown', preventSelectionLoss);

        return () => {
            toolbarRef.current?.removeEventListener('mousedown', preventSelectionLoss);
        };
    }, [view]);
    return (
        <div className="plug-tg-px-2 plug-tg-flex plug-tg-items-center plug-tg-gap-1 plug-tg-rounded-lg plug-tg-z-[10000] plug-tg-transition-opacity plug-tg-duration-150 plug-tg-ease-in-out plug-tg-pointer-events-auto">
            <ToolbarButton
                tip="Improve"
                className="plug-tg-flex plug-tg-justify-center plug-tg-items-center plug-tg-gap-1"
                onClick={() => {
                    clearAll();
                    setShowingItem('askAi');
                    if (view && view.state.selection.main) {
                        const selection = view.state.selection.main;
                        originalSelectionRef.current = { from: selection.from, to: selection.to };
                    }
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-wand-sparkles"
                >
                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                    <path d="m14 7 3 3"></path>
                    <path d="M5 6v4"></path>
                    <path d="M19 14v4"></path>
                    <path d="M10 2v2"></path>
                    <path d="M7 8H3"></path>
                    <path d="M21 16h-4"></path>
                    <path d="M11 3H9"></path>
                </svg>
                <span className="plug-tg-text-xs plug-tg-hidden md:plug-tg-flex plug-tg-justify-center plug-tg-items-center plug-tg-pt-1">
                    Ask AI
                </span>
            </ToolbarButton>
        </div>
    );
};
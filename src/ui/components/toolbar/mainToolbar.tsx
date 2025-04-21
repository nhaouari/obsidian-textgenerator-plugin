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
        <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-1 plug-tg-rounded-lg plug-tg-z-[10000] plug-tg-transition-opacity plug-tg-duration-150 plug-tg-ease-in-out">
            <ToolbarButton
                tip="Edit with AI"
                className='plug-tg-flex plug-tg-items-center plug-tg-justify-center plug-tg-px-3 plug-tg-py-1 plug-tg-bg-blue-500 hover:plug-tg-bg-blue-600 plug-tg-text-white plug-tg-rounded-md'
                onClick={() => {
                    clearAll();
                    setShowingItem('askAi');
                    if (view && view.state.selection.main) {
                        const selection = view.state.selection.main;
                        originalSelectionRef.current = { from: selection.from, to: selection.to };
                    }
                }}
            >
                <span className="plug-tg-text-sm plug-tg-mr-1">✨</span>
                <span className="plug-tg-text-xs plug-tg-font-medium">Ask AI</span>
            </ToolbarButton>
        </div>
    );
};
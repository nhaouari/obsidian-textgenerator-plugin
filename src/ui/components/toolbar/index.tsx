import React, { useRef, useState } from 'react';
import { MainToolbar } from './mainToolbar';
import AskAIToolbar from './AskAIToolbar';
import { MarkdownView, Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';
import TextGeneratorPlugin from '#/main';

interface MainToolbarProps {
    view: MarkdownView;
    editor: Editor;
    position: { top: number; left: number };
    onClose: () => void;
    plugin?: TextGeneratorPlugin | null; // Allow null as a valid type
}

export const Toolbar: React.FC<MainToolbarProps> = ({
    view,
    editor,
    position,
    onClose,
    plugin
}) => {
    const [showingItem, setShowingItem] = useState<'main' | 'askAi' | 'settings' | 'linkControls'>('main');
    const [lastText, setLastText] = useState('');
    const [linkData, setLinkData] = useState<{ url: string, linkRange: { from: number, to: number } } | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Get the Editor's CodeMirror instance
    // @ts-ignore - Obsidian's Editor has a cm property which is the CodeMirror EditorView
    const editorView = editor.cm as EditorView;

    let showingItemComponent = null;

    let left = position.left - 20;
    if (left < 100) {
        left = 100;
    }

    const position2 = {
        top: position.top + 50,
        left: left
    };

    switch (showingItem) {
        case 'askAi':
            showingItemComponent = (
                <AskAIToolbar
                    view={view}
                    editor={editor}
                    position={position2}
                    onClose={onClose}
                    setShowingItem={setShowingItem}
                    toolbarRef={toolbarRef}
                    setLastText={setLastText}
                    plugin={plugin}
                />
            );
            break;
        default:
            showingItemComponent = (
                <MainToolbar
                    view={editorView}
                    position={position2}
                    onClose={onClose}
                    setShowingItem={setShowingItem}
                    lastText={lastText}
                    setLastText={setLastText}
                />
            );
            break;
    }

    return <>
        <div
            className=' plug-tg-absolute plug-tg-flex plug-tg-items-center plug-tg-gap-1 plug-tg-bg-[#2d2d2d] plug-tg-text-white plug-tg-rounded-lg plug-tg-shadow-lg plug-tg-z-50 plug-tg-transition-opacity plug-tg-duration-150 plug-tg-ease-in-out plug-tg-pointer-events-auto'
            ref={toolbarRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                zIndex: 500,
            }}
        >
            {showingItemComponent}
        </div>
    </>;
};
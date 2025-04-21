import { useState, useEffect, useRef } from "react";
import { Editor } from "obsidian";
import { MarkdownView } from "obsidian";
import TextGeneratorPlugin from "#/main";
import React from 'react';
import ContentManagerCls from "#/scope/content-manager";

export default function AskAIToolbar(props: {
    view: MarkdownView;
    editor: Editor;
    position: { top: number; left: number };
    onClose: () => void;
    setShowingItem: (item: 'main' | 'askAi' | 'settings') => void;
    toolbarRef: React.RefObject<HTMLDivElement>;
    setLastText: (text: string) => void;
    plugin?: TextGeneratorPlugin | null;
}) {
    const [userRequest, setUserRequest] = useState('');
    const [isAskingAI, setIsAskingAI] = useState(false);
    
    const originalSelectionRef = useRef<{ from: number; to: number } | null>(null);

    useEffect(() => {
        if (!props.view) {
            props.setShowingItem('main');
            setIsAskingAI(false);
            props.setLastText('');
            return;
        }

        // Store the original selection when toolbar appears
        // @ts-ignore - Obsidian's MarkdownView doesn't expose these properties in types
        const selection = props.view.editor?.cm?.state?.selection?.main;
        if (selection && !selection.empty) {
            originalSelectionRef.current = { from: selection.from, to: selection.to };
        }

        // Restore selection when toolbar closed
        // @ts-ignore - Obsidian's MarkdownView doesn't expose these properties in types
        props.view.editor?.cm?.dom?.addEventListener('hide', () => {
            setIsAskingAI(false);
            props.setLastText('');
            props.setShowingItem('main');
            originalSelectionRef.current = null;
        });

        // Modify the preventSelectionLoss function to not automatically refocus
        const preventSelectionLoss = (e: MouseEvent) => {
            // Only prevent default to keep the selection visible
            e.preventDefault();
            // Don't automatically refocus to allow typing
        };

        props.toolbarRef.current?.addEventListener('mousedown', preventSelectionLoss);

        return () => {
            props.toolbarRef.current?.removeEventListener('mousedown', preventSelectionLoss);
        };
    }, [props.view]);

    const restoreSelection = () => {
        if (originalSelectionRef.current && props.view) {
            const { from, to } = originalSelectionRef.current;
            // Only modify selection without focusing to keep selection visible
            // @ts-ignore - Obsidian's MarkdownView doesn't expose these properties in types
            props.view.editor?.cm?.dispatch({
                selection: { anchor: from, head: to }
            });
            // Do not refocus the editor here
        }
    };

    async function askAI() {
        try {
            // Get the selection or current content
            // @ts-ignore - Obsidian's editor doesn't expose these methods in types
            let selectedText = props.editor.getSelection();
            if (!selectedText) {
                // @ts-ignore
                selectedText = props.editor.getValue();
            }
            
            // Save the last text for undo functionality
            props.setLastText(selectedText);
            setIsAskingAI(true);

            // Generate text with the user's request
            if (userRequest.trim() && props.plugin?.textGenerator) {
                try {
                    // Create a ContentManager from the current view
                    if (!props.view) {
                        throw new Error("No active view found");
                    }
                    
                    // Compile a ContentManager for the current view
                    const CM = ContentManagerCls.compile(props.view, props.plugin);
                    
                    // Create a custom context object that matches InputContext
                    const customContext = {
                        context: `- do not add any other text other than the user request\n\nUser instructions: ${userRequest}\n\nContent to work with:\n\n${selectedText}`,
                        options: {
                            content: selectedText,
                            selection: selectedText,
                            // Required fields for AvailableContext
                            keys: props.plugin.getApiKeys(),
                            _variables: {},
                            frontmatter: {
                                mode: "replace"
                            }
                        }
                    };
                    
                    // Use generateInEditor which handles both streaming and non-streaming cases
                    await props.plugin.textGenerator.generateStreamInEditor(
                        {
                            stream: true,
                        }, // Use default settings
                        false, // Don't insert metadata
                        CM, // The content manager
                        customContext,
                    );
                } catch (error) {
                    if (props.plugin) {
                        props.plugin.handelError(error);
                    } else {
                        console.error("Error generating text:", error);
                    }
                }
            } else if (props.plugin?.textGenerator) {
                // No user request, use default behavior with the contentManager
                const activeView = props.plugin.getActiveViewMD();
                if (activeView) {
                    const CM = props.plugin.contentManager.compile(activeView, props.plugin);
                    await props.plugin.textGenerator.generateInEditor({}, false, CM);
                }
            }

            setIsAskingAI(false);
            props.setShowingItem('main');
        } catch (error) {
            console.error("Error in askAI:", error);
            setIsAskingAI(false);
            props.setShowingItem('main');
        }
    }

    return (
        <div className="flex flex-col gap-2 p-2 w-[350px]">
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    type="text"
                    value={userRequest}
                    onChange={(e) => {
                        setUserRequest(e.target.value);
                    }}
                    onClick={(e) => {
                        // Stop propagation to prevent selection loss
                        e.stopPropagation();
                    }}
                    onFocus={() => {
                        // Don't manipulate the editor selection when input is focused
                    }}
                    placeholder="Ask AI to generate or edit..."
                    className="bg-[#1e1e1e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!userRequest.trim() && !props.editor.getSelection()) return;
                            await askAI();
                            setUserRequest('');
                        } else if (e.key === 'Escape') {
                            e.currentTarget.blur();
                        }
                    }}
                />
                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!userRequest?.trim() && !props.editor.getSelection()) return;

                        await askAI();
                        setUserRequest('');
                    }}
                    className="relative bg-blue-500 text-white font-medium px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    disabled={isAskingAI}
                    onMouseDown={(e) => {
                        // Prevent the editor from losing focus
                        e.preventDefault();
                    }}
                    title="Generate with AI"
                >
                    {isAskingAI ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                        <span>Generate</span>
                    )}
                </button>
            </div>
        </div>
    );
}
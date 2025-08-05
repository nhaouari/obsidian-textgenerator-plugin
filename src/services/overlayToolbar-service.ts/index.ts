import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import OverlayToolbarComp from '#/ui/components/OverlayToolbar';
import { MarkdownView } from "obsidian";
import TextGeneratorPlugin from "#/main";

export default class OverlayToolbar {
    private plugin: TextGeneratorPlugin;

    constructor(plugin: TextGeneratorPlugin) {
        this.plugin = plugin;
        this.init();
    }

    init() {
        this.plugin.app.workspace.onLayoutReady(async () => {
            this.plugin.registerEditorExtension(overlayToolbarExtension(this.plugin));
        });
    }
}

// Global container for toolbar
const TOOLBAR_CONTAINER_ID = 'overlay-toolbar-container';

function ensureToolbarContainer() {
    let container = document.getElementById(TOOLBAR_CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = TOOLBAR_CONTAINER_ID;
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    return container;
}

// State management for toolbar
interface ToolbarManager {
    root: Root | null;
    isVisible: boolean;
    currentView: MarkdownView | null;
    hideTimer: ReturnType<typeof setTimeout> | null;
}

const toolbarManager: ToolbarManager = {
    root: null,
    isVisible: false,
    currentView: null,
    hideTimer: null,
};

function showToolbar(view: MarkdownView, position: { top: number; left: number }, plugin: TextGeneratorPlugin) {
    if (toolbarManager.hideTimer) {
        clearTimeout(toolbarManager.hideTimer);
        toolbarManager.hideTimer = null;
    }

    const container = ensureToolbarContainer();
    toolbarManager.currentView = view;
    toolbarManager.isVisible = true;

    if (!toolbarManager.root) {
        toolbarManager.root = createRoot(container);
    }

    const element = React.createElement(OverlayToolbarComp, {
        view,
        editor: view.editor,
        position,
        onClose: hideToolbar,
        plugin,
    });

    toolbarManager.root.render(element);
}

function hideToolbar() {
    if (toolbarManager.hideTimer) {
        clearTimeout(toolbarManager.hideTimer);
    }

    toolbarManager.hideTimer = setTimeout(() => {
        toolbarManager.isVisible = false;
        toolbarManager.currentView = null;

        if (toolbarManager.root) {
            toolbarManager.root.render(React.createElement('div'));
        }
    }, 100);
}

function findMarkdownViewForEditor(editorView: EditorView): MarkdownView | null {
    // @ts-ignore - app is available in Obsidian context
    const app = window.app;
    if (!app?.workspace) return null;

    const markdownViews = app.workspace.getLeavesOfType('markdown')
        .map((leaf: any) => leaf.view as MarkdownView);

    for (const view of markdownViews) {
        // @ts-ignore - access the cm property
        if (view.editor?.cm === editorView) {
            return view;
        }
    }
    return null;
}

// ViewPlugin for overlay toolbar
function createToolbarPlugin(plugin: TextGeneratorPlugin) {
    return ViewPlugin.fromClass(
        class {
            private selectionTimer: ReturnType<typeof setTimeout> | null = null;
            private markdownView: MarkdownView | null = null;

            constructor(private view: EditorView) {
                this.markdownView = findMarkdownViewForEditor(view);
            }

            update(update: ViewUpdate) {
                // Clear any existing timer
                if (this.selectionTimer) {
                    clearTimeout(this.selectionTimer);
                    this.selectionTimer = null;
                }

                // Only handle selection changes
                if (!update.selectionSet) return;

                const selection = update.state.selection.main;

                if (!this.markdownView) {
                    this.markdownView = findMarkdownViewForEditor(this.view);
                }

                if (!this.markdownView) {
                    hideToolbar();
                    return;
                }

                if (!selection.empty) {
                    // Selection exists - show toolbar after a brief delay
                    this.selectionTimer = setTimeout(() => {
                        // Double-check selection still exists
                        const currentSelection = this.view.state.selection.main;
                        if (!currentSelection.empty && this.markdownView) {
                            // Calculate position properly for Obsidian environment
                            const { from, to } = currentSelection;
                            const posCoords = this.view.coordsAtPos(to);

                            if (posCoords) {
                                // Get the absolute position on the page
                                let left = posCoords.left;
                                let top = posCoords.bottom + 8; // Position below the selection
                                
                                // Apply the minimum left constraint
                                if (left < 100) {
                                    left = 100;
                                }
                                
                                // Check if toolbar would go off-screen and adjust
                                const viewportWidth = window.innerWidth;
                                const viewportHeight = window.innerHeight;
                                
                                // Assume toolbar width is approximately 350px when expanded
                                if (left + 350 > viewportWidth - 20) {
                                    left = viewportWidth - 350 - 20;
                                }
                                
                                // If not enough space below, position above
                                if (top + 60 > viewportHeight - 20) {
                                    top = posCoords.top - 60 - 8;
                                }
                                
                                showToolbar(
                                    this.markdownView,
                                    { top, left },
                                    plugin
                                );
                            }
                        }
                    }, 150);
                } else {
                    // No selection - hide toolbar
                    hideToolbar();
                }
            }

            destroy() {
                if (this.selectionTimer) {
                    clearTimeout(this.selectionTimer);
                    this.selectionTimer = null;
                }

                // Clean up toolbar if this was the last editor
                if (toolbarManager.currentView === this.markdownView) {
                    hideToolbar();
                }

                // Clean up on last instance
                if (toolbarManager.root) {
                    setTimeout(() => {
                        const container = document.getElementById(TOOLBAR_CONTAINER_ID);
                        if (container && container.parentNode) {
                            toolbarManager.root?.unmount();
                            toolbarManager.root = null;
                            container.parentNode.removeChild(container);
                        }
                    }, 1000);
                }
            }
        }
    );
}

// Export the extension
export function overlayToolbarExtension(plugin: TextGeneratorPlugin) {
    return [
        createToolbarPlugin(plugin),
        EditorView.theme({
            [`#${TOOLBAR_CONTAINER_ID}`]: {
                position: "absolute",
                zIndex: "9999",
                pointerEvents: "none",
                "& > div": {
                    pointerEvents: "auto",
                    borderRadius: "6px",
                    background: "#2d2d2d",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                    color: "#ffffff"
                },
                "& button": {
                    pointerEvents: "auto",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.2s",
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)"
                    }
                },
                "& input": {
                    pointerEvents: "auto",
                    background: "#1e1e1e",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    color: "#ffffff",
                    padding: "4px 8px",
                    "&:focus": {
                        outline: "none",
                        borderColor: "#6ba5f0"
                    }
                }
            },
        }),
    ];
} 
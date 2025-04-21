import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import OverlayToolbarComp from '#/ui/components/OverlayToolbar';
import { App, Editor, MarkdownView } from "obsidian";
import TextGeneratorPlugin from "#/main";

export default class OverlayToolbar {
    private plugin: TextGeneratorPlugin;

    constructor(plugin: TextGeneratorPlugin) {
        this.plugin = plugin;
        this.init();
    }

    init() {
        this.plugin.app.workspace.onLayoutReady(async () => {
            this.plugin.registerEditorExtension(overlayToolbarExtension);
            
            // Register event for activating on selection
            this.plugin.registerEvent(
                this.plugin.app.workspace.on('active-leaf-change', () => {
                    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                    if (view) {
                        const editor = view.editor;
                        if (editor) {
                            initializeToolbar(view, editor, this.plugin);
                        }
                    }
                })
            );

            // Initialize for the current active view
            const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (view) {
                const editor = view.editor;
                if (editor) {
                    initializeToolbar(view, editor, this.plugin);
                }
            }
        });
    }
}

// Define the types for our toolbar actions
interface BaseToolbarAction {
    name: string;
    icon: string;
    title: string;
}

interface StandardToolbarAction extends BaseToolbarAction {
    action: (view: EditorView) => void;
    type?: never;
    options?: never;
}

interface DropdownToolbarAction extends BaseToolbarAction {
    type: 'dropdown';
    options: Array<{
        name: string;
        label: string;
        icon: string;
        action: (view: EditorView) => void;
    }>;
    action?: never;
}

type ToolbarAction = StandardToolbarAction | DropdownToolbarAction;

// The global container for our toolbar
const TOOLBAR_CONTAINER_ID = 'editor-toolbar-container';

// Create the global container if it doesn't exist yet
function ensureToolbarContainer() {
    let container = document.getElementById(TOOLBAR_CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = TOOLBAR_CONTAINER_ID;
        document.body.appendChild(container);
    }
    return container;
}

// Simple global state to track the toolbar
type ToolbarState = {
    root: Root | null;
    visible: boolean;
    currentSelection: { from: number, to: number } | null;
    plugin: TextGeneratorPlugin | null;
};

const toolbarState: ToolbarState = {
    root: null,
    visible: false,
    currentSelection: null,
    plugin: null
};

// Helper function to initialize the toolbar
function initializeToolbar(view: MarkdownView, editor: Editor, plugin: TextGeneratorPlugin) {
    const container = ensureToolbarContainer();
    toolbarState.plugin = plugin;

    if (!toolbarState.root) {
        toolbarState.root = createRoot(container);
        toolbarState.visible = false;  // Start hidden

        // Initial render with hidden state
        container.style.display = 'none'; // Hide with CSS
        // Use regular createElement for better type safety
        const element = React.createElement(OverlayToolbarComp, {
            view,
            editor,
            position: { top: -1000, left: -1000 }, // Off-screen initially
            onClose: () => hideToolbar(),
            plugin // Pass as a separate prop
        });
        
        toolbarState.root.render(element);
    }
}

// Define the text style options
const textStyleOptions = [
    { name: "paragraph", label: "Paragraph", icon: "¶", action: (view: EditorView) => applyBlockStyle(view, "") },
    { name: "heading1", label: "Heading 1", icon: "H1", action: (view: EditorView) => applyBlockStyle(view, "# ") },
    { name: "heading2", label: "Heading 2", icon: "H2", action: (view: EditorView) => applyBlockStyle(view, "## ") },
    { name: "heading3", label: "Heading 3", icon: "H3", action: (view: EditorView) => applyBlockStyle(view, "### ") },
    { name: "bulletList", label: "Bullet list", icon: "•", action: (view: EditorView) => applyBlockStyle(view, "- ") },
    { name: "numberedList", label: "Numbered list", icon: "1.", action: (view: EditorView) => applyBlockStyle(view, "1. ") },
    { name: "todoList", label: "Todo list", icon: "☐", action: (view: EditorView) => applyBlockStyle(view, "- [ ] ") },
] as const;

// Define the actions
const actions: ToolbarAction[] = [
    {
        name: "textStyle",
        icon: "¶",
        title: "Turn into",
        type: "dropdown",
        options: textStyleOptions as any
    },
    {
        name: "bold",
        icon: "B",
        title: "Bold",
        action: (view: EditorView) => applyMarkdown(view, "**", "**")
    },
    {
        name: "italic",
        icon: "I",
        title: "Italic",
        action: (view: EditorView) => applyMarkdown(view, "*", "*")
    },
    {
        name: "code",
        icon: "`",
        title: "Code",
        action: (view: EditorView) => applyMarkdown(view, "`", "`")
    },
    {
        name: "link",
        icon: "🔗",
        title: "Link",
        action: (view: EditorView) => applyMarkdown(view, "[", "](https://)")
    },
] as const;

// Helper function to apply block-level styles
function applyBlockStyle(view: EditorView, prefix: string) {
    const { state } = view;
    const selection = state.selection.main;
    const line = state.doc.lineAt(selection.from);
    const lineText = line.text;

    // Function to remove existing block style markers
    const removeExistingStyle = (text: string) => {
        return text
            .replace(/^(#{1,6})\s+/, '') // Remove heading markers
            .replace(/^[-*+]\s+(\[[ x]\]\s+)?/, '') // Remove list and todo markers
            .replace(/^\d+\.\s+/, ''); // Remove numbered list markers
    };

    // Get the indentation of the current line
    const indentation = lineText.match(/^\s*/)?.[0] || '';

    // Remove any existing block style and add the new one
    const cleanText = removeExistingStyle(lineText.trim());
    const newText = indentation + prefix + cleanText;

    // Create and dispatch the transaction
    const transaction = state.update({
        changes: {
            from: line.from,
            to: line.to,
            insert: newText
        },
        // Maintain cursor position relative to the content
        selection: {
            anchor: line.from + newText.length,
            head: line.from + newText.length
        }
    });

    view.dispatch(transaction);
}

// Helper function to update the toolbar position and visibility
function updateToolbar(view: EditorView, position: { top: number, left: number }, selection: { from: number, to: number }, markdownView: MarkdownView) {
    const plugin = toolbarState.plugin;
    
    // Find the MarkdownView for the editor
    if (!markdownView) {
        hideToolbar();
        return;
    }
    
    const editor = markdownView.editor;
    
    if (!editor) {
        hideToolbar();
        return;
    }

    toolbarState.visible = true;
    toolbarState.currentSelection = selection;

    const container = document.getElementById(TOOLBAR_CONTAINER_ID);
    if (container) {
        container.style.display = 'block';
        
        // Use regular createElement for better type safety
        const element = React.createElement(OverlayToolbarComp, {
            view: markdownView,
            editor,
            position,
            onClose: () => hideToolbar(),
            plugin // Pass as a separate prop
        });
        
        // Update toolbar position with cursor-like appearance
        toolbarState.root?.render(element);
    }
}

// Helper function to hide the toolbar
function hideToolbar() {
    if (toolbarState.root) {
        toolbarState.visible = false;
        toolbarState.currentSelection = null;

        const container = document.getElementById(TOOLBAR_CONTAINER_ID);
        if (container) {
            container.style.display = 'none';
            // No need to re-render if we're just hiding with CSS
        }
    }
}

// Helper function to apply markdown formatting
function applyMarkdown(view: EditorView, prefix: string, suffix: string) {
    const { state } = view;
    const selection = state.selection.main;

    // Function to check if cursor is inside formatting markers
    const isInsideFormatting = () => {
        if (selection.empty) {
            // Look backward for prefix and forward for suffix
            const docText = state.doc.toString();
            const textBefore = docText.slice(0, selection.from);
            const textAfter = docText.slice(selection.from);

            const prefixRegExp = new RegExp(escapeRegExp(prefix) + "$");
            const suffixRegExp = new RegExp("^" + escapeRegExp(suffix));

            return prefixRegExp.test(textBefore) && suffixRegExp.test(textAfter);
        }
        return false;
    };

    // Function to check if selection is part of a larger formatting
    const isPartOfLargerFormatting = () => {
        if (!selection.empty) {
            const docText = state.doc.toString();
            const textBefore = docText.slice(0, selection.from);
            const textAfter = docText.slice(selection.to);

            const prefixRegExp = new RegExp(escapeRegExp(prefix) + "$");
            const suffixRegExp = new RegExp("^" + escapeRegExp(suffix));

            return prefixRegExp.test(textBefore) && suffixRegExp.test(textAfter);
        }
        return false;
    };

    // Function to check if selection already has the formatting
    const containsFormatting = (text: string) => {
        const escapedPrefix = escapeRegExp(prefix);
        const escapedSuffix = escapeRegExp(suffix);
        const pattern = new RegExp(`^${escapedPrefix}.*${escapedSuffix}$`);
        return pattern.test(text);
    };

    // Helper to escape regex special characters
    function escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Function to remove formatting if already present
    const removeAllFormatting = (text: string) => {
        if (text.startsWith(prefix) && text.endsWith(suffix)) {
            return text.slice(prefix.length, -suffix.length);
        }
        return text;
    };

    // If selection is empty and cursor is inside formatting markers, remove them
    if (selection.empty && isInsideFormatting()) {
        const docText = state.doc.toString();
        const textBefore = docText.slice(0, selection.from);
        const textAfter = docText.slice(selection.from);

        const prefixIndex = textBefore.lastIndexOf(prefix);
        const suffixIndex = textAfter.indexOf(suffix) + selection.from;

        if (prefixIndex >= 0 && suffixIndex > selection.from) {
            const transaction = state.update({
                changes: [
                    { from: prefixIndex, to: prefixIndex + prefix.length, insert: "" },
                    { from: suffixIndex, to: suffixIndex + suffix.length, insert: "" }
                ],
                selection: { anchor: selection.from - prefix.length }
            });
            view.dispatch(transaction);
            return;
        }
    }

    // If selection spans text and is part of a larger formatting, remove it
    if (!selection.empty && isPartOfLargerFormatting()) {
        const docText = state.doc.toString();
        const textBefore = docText.slice(0, selection.from);
        const textAfter = docText.slice(selection.to);

        // Find the last occurrence of prefix before selection
        const prefixIndex = textBefore.lastIndexOf(prefix);
        // Find the first occurrence of suffix after selection
        const suffixIndex = textAfter.indexOf(suffix) + selection.to;

        if (prefixIndex >= 0 && suffixIndex > selection.to) {
            const transaction = state.update({
                changes: [
                    { from: prefixIndex, to: prefixIndex + prefix.length, insert: "" },
                    { from: suffixIndex, to: suffixIndex + suffix.length, insert: "" }
                ],
                selection: {
                    anchor: selection.from - prefix.length,
                    head: selection.to - prefix.length
                }
            });
            view.dispatch(transaction);
            return;
        }
    }

    // If selection already has formatting, remove it
    if (!selection.empty) {
        const selectedText = state.doc.sliceString(selection.from, selection.to);
        if (containsFormatting(selectedText)) {
            const unformatted = removeAllFormatting(selectedText);
            const transaction = state.update({
                changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: unformatted
                },
                selection: {
                    anchor: selection.from,
                    head: selection.from + unformatted.length
                }
            });
            view.dispatch(transaction);
            return;
        }
    }

    // Otherwise, apply the formatting
    if (selection.empty) {
        // If no selection, insert formatting markers and place cursor between them
        const transaction = state.update({
            changes: {
                from: selection.from,
                to: selection.from,
                insert: prefix + suffix
            },
            selection: {
                anchor: selection.from + prefix.length
            }
        });
        view.dispatch(transaction);
    } else {
        // If text is selected, wrap it with formatting markers
        const selectedText = state.doc.sliceString(selection.from, selection.to);
        const transaction = state.update({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: prefix + selectedText + suffix
            },
            selection: {
                anchor: selection.from,
                head: selection.to + prefix.length + suffix.length
            }
        });
        view.dispatch(transaction);
    }
}

// Plugin to handle showing/hiding the toolbar based on selection
const toolbarPlugin = ViewPlugin.fromClass(
    class {
        private timer: ReturnType<typeof setTimeout> | null = null;
        private markdownView: MarkdownView | null = null;

        constructor(private view: EditorView) {
            // Find the MarkdownView for this editor view
            this.markdownView = findMarkdownViewForEditor(view);
            
            // Initialize toolbar on plugin creation
            if (this.markdownView && toolbarState.plugin) {
                initializeToolbar(this.markdownView, this.markdownView.editor, toolbarState.plugin);
                hideToolbar(); // Start hidden
            }
        }

        update(update: ViewUpdate) {
            // Cancel any pending timers
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }

            // Check if selection changed
            if (update.selectionSet) {
                const selection = update.state.selection.main;
                
                // Make sure we have a MarkdownView
                if (!this.markdownView) {
                    this.markdownView = findMarkdownViewForEditor(this.view);
                    if (!this.markdownView) {
                        hideToolbar();
                        return;
                    }
                }

                // If there's a selection, show the toolbar
                if (!selection.empty) {
                    const { from, to } = selection;

                    // Debounce to avoid showing while still selecting
                    this.timer = setTimeout(() => {
                        // Make sure selection still exists
                        if (!this.view.state.selection.main.empty) {
                            // Calculate position
                            const posCoords = this.view.coordsAtPos(to);

                            if (posCoords && this.markdownView) {
                                const editorBounds = this.view.dom.getBoundingClientRect();
                                let left = posCoords.left - editorBounds.left;
                                // Position below the text by adding the line height
                                // Use posCoords.bottom instead of posCoords.top to position below
                                let top = posCoords.top - editorBounds.top + 5; // Add a small offset for better appearance
                                
                                // Keep the existing positioning logic
                                if (left < 100) {
                                    left = 100;
                                }
                                
                                updateToolbar(
                                    this.view,
                                    { top, left },
                                    { from, to },
                                    this.markdownView
                                );
                            }
                        }
                    }, 200); // Slight delay to avoid flickering during selection
                } else {
                    // No selection, hide the toolbar
                    this.timer = setTimeout(() => {
                        this.view.dom.dispatchEvent(new Event('hide'));
                        hideToolbar();
                    }, 100);
                }
            }
        }

        destroy() {
            // Clean up timers
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }

            // Clean up the toolbar
            if (toolbarState.root) {
                toolbarState.root.unmount();
                toolbarState.root = null;
            }

            // Remove the container
            const container = document.getElementById(TOOLBAR_CONTAINER_ID);
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    }
);

// Helper function to find the MarkdownView for a given EditorView
function findMarkdownViewForEditor(editorView: EditorView): MarkdownView | null {
    // Access Obsidian app global instance
    // @ts-ignore - app is defined in Obsidian context
    const app = window.app;
    if (!app || !app.workspace) return null;
    
    const markdownViews = app.workspace.getLeavesOfType('markdown')
        .map((leaf: any) => leaf.view as MarkdownView);
    
    for (const view of markdownViews) {
        // @ts-ignore - access the cm property which is the CodeMirror instance
        if (view.editor && view.editor.cm === editorView) {
            return view;
        }
    }
    return null;
}

// Export a complete, standalone extension for the overlay toolbar
export const overlayToolbarExtension = [
    toolbarPlugin,
    EditorView.theme({
        "#editor-toolbar-container": {
            position: "absolute",
            zIndex: "9999",
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
        }
    })
]; 
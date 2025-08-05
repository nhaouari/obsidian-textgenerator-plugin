import React, { useEffect, useState, useRef, useMemo } from "react";
import { TooltipProvider } from "#/ui/components/tooltip";
import { MarkdownView, Editor } from "obsidian";
import TextGeneratorPlugin from "#/main";
import { InputContext } from "#/scope/context-manager";

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
  plugin,
}: OverlayToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAskAI, setShowAskAI] = useState(false);
  const [userRequest, setUserRequest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Auto-focus input when showing Ask AI
  useEffect(() => {
    if (showAskAI && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showAskAI]);

  // Handle AI generation
  const handleGenerate = async (templatePath?: string) => {
    if (!plugin?.textGenerator || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGenerating(true);
    try {
      // Get selected text
      let selectedText = editor.getSelection();
      if (!selectedText) {
        selectedText = editor.getValue();
      }

      if (plugin.textGenerator) {
        // Create a ContentManager from the current view
        if (!view) {
          throw new Error("No active view found");
        }

        const CM = plugin.contentManager.compile(view, plugin, {
          templatePath: templatePath
        });

        if (templatePath) {
          await plugin.textGenerator.generateFromTemplate({
            params: {},
            templatePath,
            insertMetadata: true,
            editor: CM,
            activeFile: true,
          })
        } else {
          // Create custom context for AI request
          const customContext: InputContext = {
            templatePath: templatePath,
            context: `- do not add any other text other than the user request\n\nUser instructions: continue text \n\nContent to work with:\n\n${selectedText}`,
            options: {
              content: selectedText,
              selection: selectedText,
              keys: plugin.getApiKeys(),
              _variables: {},
              frontmatter: { mode: "replace" }
            }
          };

          // Generate with streaming
          await plugin.textGenerator.generateStreamInEditor(
            { stream: true },
            false,
            CM,
            customContext
          );
        }
      }

      onClose();
    } catch (error) {
      if (plugin) {
        plugin.handelError(error);
      } else {
        console.error("Error generating text:", error);
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };


  const templates = plugin?.textGenerator.getTemplates();


  const usableTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((template) => template.commands?.includes("toolbar"));
  }, [templates, view]);


  console.log(usableTemplates);
  return (
    <TooltipProvider>
      <div
        ref={toolbarRef}
        className="plug-tg-pointer-events-auto plug-tg-absolute plug-tg-flex plug-tg-items-center plug-tg-backdrop-blur-sm plug-tg-rounded-xl plug-tg-bg-gray-900/95 plug-tg-text-white plug-tg-shadow-2xl plug-tg-border plug-tg-border-gray-700/50 plug-tg-transition-all plug-tg-duration-200 plug-tg-ease-out"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 9999,
        }}
      >
        {showAskAI ? (
          // Main toolbar - compact button
          <div className="plug-tg-p-1">
            <button
              onClick={() => setShowAskAI(true)}
              className="plug-tg-group plug-tg-cursor-pointer plug-tg-flex plug-tg-items-center plug-tg-gap-2 plug-tg-px-3 plug-tg-py-2 plug-tg-rounded-lg plug-tg-bg-gray-800/50 hover:plug-tg-bg-gray-700/70 plug-tg-transition-all plug-tg-duration-200 plug-tg-border plug-tg-border-gray-600/30 hover:plug-tg-border-gray-500/50"
              title="Ask AI to improve or edit text"
            >
              <div className="plug-tg-flex plug-tg-items-center plug-tg-justify-center plug-tg-w-4 plug-tg-h-4 plug-tg-text-purple-400 group-hover:plug-tg-text-purple-300 plug-tg-transition-colors">
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
                  className="lucide lucide-sparkles"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l0 0a2 2 0 0 0-1.437 1.437l0 0a2 2 0 0 0 1.437 1.437l0 0a2 2 0 0 0 1.437-1.437Z" />
                  <path d="M14.5 8.5a2 2 0 0 0-1.437-1.437l0 0A2 2 0 0 0 11.626 8.5l0 0a2 2 0 0 0 1.437 1.437l0 0A2 2 0 0 0 14.5 8.5Z" />
                  <path d="M16 12.5a1 1 0 0 0-.707-.707l0 0a1 1 0 0 0-.707.707l0 0a1 1 0 0 0 .707.707l0 0a1 1 0 0 0 .707-.707Z" />
                </svg>
              </div>
              <span className="plug-tg-text-sm plug-tg-font-medium plug-tg-text-gray-200 group-hover:plug-tg-text-white plug-tg-transition-colors">
                Ask AI
              </span>
            </button>
          </div>
        ) : (
          // Ask AI toolbar - expanded form
          <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-3 plug-tg-p-3">
            <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2">
              <div
                onClick={() => handleGenerate()}

                className="plug-tg-flex plug-tg-gap-2 plug-tg-items-center plug-tg-justify-center"
              >
                {isGenerating ? (
                  <div className="plug-tg-flex plug-tg-items-center plug-tg-gap-2">
                    <div className="plug-tg-w-4 plug-tg-h-4 plug-tg-border-2 plug-tg-border-white/30 plug-tg-border-t-white plug-tg-rounded-full plug-tg-animate-spin"></div>
                    <span>Working</span>
                  </div>
                ) : <>
                  <button disabled={isGenerating || (!userRequest.trim() && !editor.getSelection())} className="plug-tg-flex plug-tg-cursor-pointer plug-tg-items-center plug-tg-gap-2 plug-tg-bg-purple-600 hover:plug-tg-bg-purple-700 disabled:plug-tg-bg-gray-700 plug-tg-text-white plug-tg-text-sm plug-tg-font-medium plug-tg-rounded-lg plug-tg-transition-all plug-tg-duration-200 disabled:plug-tg-opacity-50 disabled:plug-tg-cursor-not-allowed plug-tg-min-w-[90px] plug-tg-border plug-tg-border-purple-500/20 hover:plug-tg-border-purple-400/30"  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    <span>Generate</span>
                  </button>

                  {usableTemplates.map((template, index) => (
                    <button
                      onClick={() => {
                        handleGenerate(template.path);
                      }}
                      disabled={isGenerating || (!userRequest.trim() && !editor.getSelection())}
                      key={index} 
                      className="plug-tg-flex plug-tg-cursor-pointer plug-tg-items-center plug-tg-gap-2 plug-tg-bg-purple-600 hover:plug-tg-bg-purple-700 disabled:plug-tg-bg-gray-700 plug-tg-text-white plug-tg-text-sm plug-tg-font-medium plug-tg-rounded-lg plug-tg-transition-all plug-tg-duration-200 disabled:plug-tg-opacity-50 disabled:plug-tg-cursor-not-allowed plug-tg-min-w-[90px] plug-tg-border plug-tg-border-purple-500/20 hover:plug-tg-border-purple-400/30">
                      <span>{template.name || template.title}</span>
                    </button>
                  ))}
                </>
                }
              </div>
{/* 
              <button
                onClick={() => {
                  setShowAskAI(false);
                  setUserRequest("");
                }}
                className="plug-tg-flex plug-tg-items-center plug-tg-justify-center plug-tg-p-2 plug-tg-text-gray-400 hover:plug-tg-text-gray-200 hover:plug-tg-bg-gray-700/50 plug-tg-rounded-lg plug-tg-transition-all plug-tg-duration-200"
                title="Cancel"
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
                >
                  <path d="m18 6-12 12"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button
              > */}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

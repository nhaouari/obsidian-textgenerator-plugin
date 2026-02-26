import React, { useState } from "react";
import clsx from "clsx";
import { useDebounceCallback } from "usehooks-ts";

export default function SettingsTextarea(props: {
  value: string;
  setValue: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  debounceMs?: number;
  spellCheck?: boolean;
}) {
  const [localValue, setLocalValue] = useState(props.value);

  // Visual feedback is instant via local state.
  // The external setter (which triggers saveSettings + triggerReload) is debounced
  // to prevent blocking the main thread on every keystroke.
  const debouncedSetValue = useDebounceCallback(
    props.setValue,
    props.debounceMs ?? 500
  );

  return (
    <textarea
      placeholder={props.placeholder ?? "Textarea will autosize to fit the content"}
      className={clsx(
        "plug-tg-input plug-tg-h-fit plug-tg-w-full plug-tg-resize-y plug-tg-bg-[var(--background-modifier-form-field)] plug-tg-outline-none",
        props.className
      )}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        debouncedSetValue(e.target.value);
      }}
      spellCheck={props.spellCheck ?? false}
      rows={props.rows ?? 10}
    />
  );
}

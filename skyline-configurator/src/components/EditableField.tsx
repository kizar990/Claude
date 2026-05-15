import { useState, useRef, useEffect } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import type { OverrideState } from "../useOverrides";

interface Props {
  fieldKey: string;
  auto: number | string;
  overrideState: OverrideState;
  format?: (v: number | string) => string;
  className?: string;
  inputClassName?: string;
  unit?: string;
  /** If true, render as inline text rather than a bordered box */
  inline?: boolean;
}

export function EditableField({
  fieldKey,
  auto,
  overrideState,
  format = (v) => String(v),
  className = "",
  inputClassName = "",
  unit,
  inline = false,
}: Props) {
  const { overrides, set, revert, isOverridden } = overrideState;
  const overridden = isOverridden(fieldKey);
  const current = overridden ? overrides[fieldKey] : auto;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setDraft(String(current));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === String(auto)) {
      if (overridden) revert(fieldKey);
      return;
    }
    const asNum = Number(trimmed);
    if (!isNaN(asNum) && typeof auto === "number") {
      if (asNum === auto) { revert(fieldKey); return; }
      set(fieldKey, asNum);
    } else {
      if (trimmed === String(auto)) { revert(fieldKey); return; }
      set(fieldKey, trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setEditing(false); }
  }

  const displayValue = format(current);
  const autoDisplay = format(auto);

  const baseBox = inline
    ? "inline-flex items-center gap-1"
    : `flex items-center gap-1 px-2 py-1 rounded border text-sm
       ${overridden
         ? "field-override border-amber-400"
         : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
       }`;

  if (editing) {
    return (
      <span className={`${baseBox} ${className}`}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`w-24 bg-transparent outline-none font-mono text-sm ${inputClassName}`}
          autoFocus
        />
        {unit && <span className="text-gray-400 text-xs">{unit}</span>}
      </span>
    );
  }

  return (
    <span
      className={`${baseBox} group cursor-text ${className}`}
      onClick={startEdit}
      title={overridden ? `Auto: ${autoDisplay}` : "Click to override"}
      data-tooltip={overridden ? `Auto: ${autoDisplay}` : undefined}
    >
      <span className={`font-mono ${overridden ? "text-amber-700 dark:text-amber-300" : ""}`}>
        {displayValue}
      </span>
      {unit && <span className="text-gray-400 text-xs">{unit}</span>}
      {overridden ? (
        <button
          onClick={(e) => { e.stopPropagation(); revert(fieldKey); }}
          className="ml-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 shrink-0"
          title={`Revert to auto: ${autoDisplay}`}
        >
          <RotateCcw size={11} />
        </button>
      ) : (
        <Pencil
          size={10}
          className="opacity-0 group-hover:opacity-40 text-gray-400 shrink-0 transition-opacity"
        />
      )}
    </span>
  );
}

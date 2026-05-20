import type { ProcessorSpec } from "../calculations";

export function ProcessorBadge({
  processor,
  compact = false,
}: {
  processor: ProcessorSpec;
  compact?: boolean;
}) {
  const { status, modelName, panelLoad, panelCapacity, note } = processor;

  if (status === "modular") {
    return (
      <span className={`text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 ${compact ? "" : "inline-block"}`}>
        ⚙ {modelName}
      </span>
    );
  }

  if (status === "insufficient") {
    return (
      <span className={`text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded px-2 py-1 font-medium ${compact ? "" : "inline-block"}`}>
        ✗ {modelName} — insufficient
      </span>
    );
  }

  if (status === "tight") {
    const pct = Math.round(panelLoad * 100);
    return (
      <span className={`text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-2 py-1 ${compact ? "" : "inline-block"}`}>
        ⚡ {modelName} — tight ({pct}% of {panelCapacity})
      </span>
    );
  }

  return (
    <>
      <span className={`text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-2 py-1 ${compact ? "" : "inline-block"}`}>
        ✓ {modelName} — OK
      </span>
      {!compact && note && (
        <span className="block mt-1 text-xs text-blue-600 dark:text-blue-400">
          ℹ {note}
        </span>
      )}
    </>
  );
}

import type { ProcessorSpec } from "../calculations";

export function ProcessorBadge({
  processor,
  compact = false,
}: {
  processor: ProcessorSpec;
  compact?: boolean;
}) {
  const { status, modelName, panelLoad, panelCapacity } = processor;

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
    <span className={`text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-2 py-1 ${compact ? "" : "inline-block"}`}>
      ✓ {modelName} — OK
    </span>
  );
}

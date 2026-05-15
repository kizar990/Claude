import { useState, useCallback } from "react";

export type Overrides = Record<string, number | string>;

export interface OverrideState {
  overrides: Overrides;
  set: (key: string, value: number | string) => void;
  revert: (key: string) => void;
  resetAll: () => void;
  isOverridden: (key: string) => boolean;
}

export function useOverrides(initial: Overrides = {}): OverrideState {
  const [overrides, setOverrides] = useState<Overrides>(initial);

  const set = useCallback((key: string, value: number | string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const revert = useCallback((key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setOverrides({}), []);

  const isOverridden = useCallback(
    (key: string) => key in overrides,
    [overrides]
  );

  return { overrides, set, revert, resetAll, isOverridden };
}

/** Resolve a value: manual override wins, falls back to auto-calculated */
export function resolve<T extends number | string>(
  key: string,
  auto: T,
  overrides: Overrides
): T {
  if (key in overrides) return overrides[key] as T;
  return auto;
}

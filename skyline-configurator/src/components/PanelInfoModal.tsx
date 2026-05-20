import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CONFIG } from "../config";

interface Props {
  panelWidthMm: number;
  panelHeightMm: number;
  onClose: () => void;
}

export function PanelInfoModal({ panelWidthMm, panelHeightMm, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const operatingW = CONFIG.PANEL_OPERATING_POWER_W;
  const maxW = CONFIG.PANEL_MAX_POWER_W;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Panel specifications"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm outline-none"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{CONFIG.PRODUCT_DEFAULT}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Panel specifications</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <section>
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Physical</h4>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1.5 pr-4 text-xs text-gray-500 dark:text-gray-400 w-32">Width</td>
                  <td className="py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">{panelWidthMm} mm</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1.5 pr-4 text-xs text-gray-500 dark:text-gray-400">Height</td>
                  <td className="py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">{panelHeightMm} mm</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1.5 pr-4 text-xs text-gray-500 dark:text-gray-400">Resolution</td>
                  <td className="py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">{CONFIG.PANEL_PIXELS_W} × {CONFIG.PANEL_PIXELS_H} px</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1.5 pr-4 text-xs text-gray-500 dark:text-gray-400">Pixel pitch</td>
                  <td className="py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">{CONFIG.PIXEL_PITCH}</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 text-xs text-gray-500 dark:text-gray-400">Weight</td>
                  <td className="py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">{CONFIG.PANEL_WEIGHT_KG} kg</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Power consumption</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <span className="text-amber-500 text-base leading-none mt-0.5">⚡</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{maxW} W — max (full white)</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Worst-case draw at 100% white. Use this when content is unknown or expected to peak (bright branded content, full-white frames).</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                <span className="text-green-500 text-base leading-none mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300">{operatingW} W — operating (typical content)</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Practical planning figure for typical mixed content. Used by most rental companies for client power requests.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

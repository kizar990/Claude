import { useEffect, useRef } from "react";
import type { ProcessorModel } from "../config";

interface Props {
  processor: ProcessorModel;
  onClose: () => void;
}

export function ProcessorInfoModal({ processor, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fmt = (n: number) => n.toLocaleString();

  const categoryLabel: Record<string, string> = {
    controller: "Controller",
    "all-in-one": "All-in-One",
    splicer: "Splicer",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-y-auto"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{processor.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{processor.processorType}</p>
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {categoryLabel[processor.category] ?? processor.category}
            </span>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="ml-4 mt-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Capacity */}
          {(processor.ethernetPorts != null ||
            processor.recommendedMaxPixels != null ||
            processor.officialTheoreticalMaxPixels != null ||
            processor.devicePixelCap != null) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Capacity</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {processor.ethernetPorts != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Ethernet ports</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">
                      {processor.ethernetPorts} × {processor.ethernetPortType}
                    </dd>
                  </>
                )}
                {processor.recommendedPerPortPixels != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Rec. per-port pixels</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.recommendedPerPortPixels)}</dd>
                  </>
                )}
                {processor.officialPerPortMaxPixels != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Official per-port max</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.officialPerPortMaxPixels)}</dd>
                  </>
                )}
                {processor.recommendedMaxPixels != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Recommended total</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.recommendedMaxPixels)}</dd>
                  </>
                )}
                {processor.officialTheoreticalMaxPixels != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Theoretical max</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.officialTheoreticalMaxPixels)}</dd>
                  </>
                )}
                {processor.devicePixelCap != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Device pixel cap</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.devicePixelCap)}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {/* Output dimensions */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Output Dimensions</h3>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {processor.maxOutputWidth != null && processor.maxOutputHeight != null
                ? `${fmt(processor.maxOutputWidth)} × ${fmt(processor.maxOutputHeight)} px`
                : "Card-dependent"}
            </p>
          </section>

          {/* Input */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Input</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Max input resolution</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{processor.maxInputResolution}</dd>
              {processor.maxInputPixels != null && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Max input pixels</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{fmt(processor.maxInputPixels)}</dd>
                </>
              )}
              {processor.videoInputs.length > 0 && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Video inputs</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{processor.videoInputs.join(", ")}</dd>
                </>
              )}
            </dl>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Features</h3>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>{processor.supportsScaling ? "✓" : "✗"} Scaling</li>
              <li>{processor.supportsLayers ? `✓ Layers (up to ${processor.maxLayers})` : "✗ Layers"}</li>
              <li>{processor.supportsGenlock ? "✓" : "✗"} Genlock</li>
              <li>{processor.supportsFiberMode ? "✓" : "✗"} Fiber mode</li>
              {processor.opticalOutputs != null && (
                <li>Optical outputs: {processor.opticalOutputs}</li>
              )}
            </ul>
          </section>

          {/* Bit depth limits */}
          {processor.bitDepthPortLimits && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Bit Depth Port Limits</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1 text-gray-500 dark:text-gray-400 font-medium">Bit depth</th>
                    <th className="text-right py-1 text-gray-500 dark:text-gray-400 font-medium">Per-port px</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1 text-gray-900 dark:text-gray-100">8-bit / 60 Hz</td>
                    <td className="py-1 text-right text-gray-900 dark:text-gray-100 font-mono">{fmt(processor.bitDepthPortLimits["8bit60Hz"])}</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1 text-gray-900 dark:text-gray-100">10-bit / 60 Hz</td>
                    <td className="py-1 text-right text-gray-900 dark:text-gray-100 font-mono">{fmt(processor.bitDepthPortLimits["10bit60Hz"])}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-900 dark:text-gray-100">12-bit / 60 Hz</td>
                    <td className="py-1 text-right text-gray-900 dark:text-gray-100 font-mono">{fmt(processor.bitDepthPortLimits["12bit60Hz"])}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Best use */}
          {processor.bestUse && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Best Use</h3>
              <blockquote className="border-l-4 border-blue-300 dark:border-blue-700 pl-3 text-sm text-gray-700 dark:text-gray-300 italic">
                {processor.bestUse}
              </blockquote>
            </section>
          )}

          {/* Calculator notes */}
          {processor.calculatorNotes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Calculator Notes</h3>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 list-disc list-inside">
                {processor.calculatorNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

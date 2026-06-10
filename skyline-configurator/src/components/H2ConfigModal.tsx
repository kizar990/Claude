import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { H2Config, H2OutputCard, H2InputCard } from "../profiles";

interface Props {
  initial: H2Config | null;
  panelPixels: number;   // panel pixel count (W × H) for live capacity display
  panelLabel: string;    // e.g. "1.9 mm" for display
  onSave: (config: H2Config) => void;
  onClose: () => void;
}

const INPUT_TYPES = ["HDMI", "SDI", "3G-SDI", "12G-SDI", "DP", "DVI", "VGA", "Other"];

function blankOutput(): H2OutputCard {
  return { id: crypto.randomUUID(), name: "", ports: 4, pixelsPerPort: 600000, quantity: 1 };
}
function blankInput(): H2InputCard {
  return { id: crypto.randomUUID(), name: "", inputType: "HDMI", quantity: 1 };
}

export function H2ConfigModal({ initial, panelPixels, panelLabel, onSave, onClose }: Props) {
  const [chassisSlots, setChassisSlots] = useState(initial?.chassisSlots ?? 8);
  const [outputCards, setOutputCards] = useState<H2OutputCard[]>(
    initial?.outputCards?.length ? initial.outputCards : [blankOutput()]
  );
  const [inputCards, setInputCards] = useState<H2InputCard[]>(initial?.inputCards ?? []);
  const [maxW, setMaxW] = useState(initial?.maxOutputWidth?.toString() ?? "");
  const [maxH, setMaxH] = useState(initial?.maxOutputHeight?.toString() ?? "");

  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalPorts = outputCards.reduce((s, c) => s + (c.ports || 0) * (c.quantity || 0), 0);
  const totalPixelCap = outputCards.reduce((s, c) => s + (c.ports || 0) * (c.pixelsPerPort || 0) * (c.quantity || 0), 0);
  const panelCapacity = panelPixels > 0 ? Math.floor(totalPixelCap / panelPixels) : 0;
  const fmt = (n: number) => n.toLocaleString();

  function updateOutput(id: string, patch: Partial<H2OutputCard>) {
    setOutputCards(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function removeOutput(id: string) {
    setOutputCards(cs => cs.filter(c => c.id !== id));
  }
  function updateInput(id: string, patch: Partial<H2InputCard>) {
    setInputCards(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function removeInput(id: string) {
    setInputCards(cs => cs.filter(c => c.id !== id));
  }

  function handleSave() {
    onSave({
      chassisSlots,
      outputCards,
      inputCards,
      maxOutputWidth: maxW ? parseInt(maxW, 10) : undefined,
      maxOutputHeight: maxH ? parseInt(maxH, 10) : undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Configure NovaStar H2</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter the installed card specifications to calculate capacity</p>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close"
            className="ml-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Chassis */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3">Chassis</h3>
            <label className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300 w-40">Total card slots</span>
              <input type="number" min={1} max={64} value={chassisSlots}
                onChange={e => setChassisSlots(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </label>
          </section>

          {/* Output cards */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3">LED Output Cards</h3>
            <div className="space-y-3">
              {outputCards.map((card) => (
                <div key={card.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Card name / type (e.g. 4× GbE output card)"
                      value={card.name}
                      onChange={e => updateOutput(card.id, { name: e.target.value })}
                      className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                    <button onClick={() => removeOutput(card.id)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ethernet ports</span>
                      <input type="number" min={1} value={card.ports}
                        onChange={e => updateOutput(card.id, { ports: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Pixels per port</span>
                      <input type="number" min={1} value={card.pixelsPerPort}
                        onChange={e => updateOutput(card.id, { pixelsPerPort: Math.max(1, parseInt(e.target.value) || 600000) })}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Quantity</span>
                      <input type="number" min={1} value={card.quantity}
                        onChange={e => updateOutput(card.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </label>
                  </div>
                </div>
              ))}
              <button onClick={() => setOutputCards(cs => [...cs, blankOutput()])}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <Plus size={14} /> Add output card
              </button>
            </div>
          </section>

          {/* Input cards */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Input Cards <span className="text-gray-400 dark:text-gray-500 font-normal normal-case tracking-normal ml-1">(optional — recorded in kit list)</span></h3>
            <div className="space-y-2 mt-3">
              {inputCards.map((card) => (
                <div key={card.id} className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  <input type="text" placeholder="Card name / type"
                    value={card.name}
                    onChange={e => updateInput(card.id, { name: e.target.value })}
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                  <select value={card.inputType}
                    onChange={e => updateInput(card.id, { inputType: e.target.value })}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {INPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Qty
                    <input type="number" min={1} value={card.quantity}
                      onChange={e => updateInput(card.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-14 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  </label>
                  <button onClick={() => removeInput(card.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setInputCards(cs => [...cs, blankInput()])}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <Plus size={14} /> Add input card
              </button>
            </div>
          </section>

          {/* Output dimensions */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Output Dimensions <span className="text-gray-400 dark:text-gray-500 font-normal normal-case tracking-normal ml-1">(optional)</span></h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Leave blank to skip dimension check — you'll see a note to verify manually.</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-32">Max output width</span>
                <input type="number" min={1} placeholder="e.g. 10240"
                  value={maxW}
                  onChange={e => setMaxW(e.target.value)}
                  className="w-28 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                <span className="text-xs text-gray-500">px</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-32">Max output height</span>
                <input type="number" min={1} placeholder="e.g. 7680"
                  value={maxH}
                  onChange={e => setMaxH(e.target.value)}
                  className="w-28 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                <span className="text-xs text-gray-500">px</span>
              </label>
            </div>
          </section>

          {/* Live capacity */}
          <section className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3">Calculated Capacity</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Total Ethernet ports</dt>
              <dd className="font-semibold text-gray-900 dark:text-gray-100">{totalPorts}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Total pixel capacity</dt>
              <dd className="font-semibold text-gray-900 dark:text-gray-100">{fmt(totalPixelCap)} px</dd>
              <dt className="text-gray-500 dark:text-gray-400">Max panels ({panelLabel})</dt>
              <dd className="font-semibold text-gray-900 dark:text-gray-100">{panelCapacity > 0 ? `${panelCapacity} panels` : "—"}</dd>
            </dl>
          </section>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose}
            className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={outputCards.length === 0}
            className="px-5 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
            Save configuration
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import type { InventoryItem, NewRequestFormData } from "@/lib/types";

interface Props {
  inventory: InventoryItem[];
  onClose: () => void;
  onSubmitted: () => void;
}

const FIELD_CLASS =
  "w-full bg-[#112240] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-[#e6f1ff] placeholder-[#8892b0]/60 focus:outline-none focus:border-[#64ffda] transition-colors";

const LABEL_CLASS =
  "block text-[10px] uppercase font-bold text-[#64ffda] mb-1.5 tracking-widest";

export function RequestForm({ inventory, onClose, onSubmitted }: Props) {
  const [form, setForm] = useState<NewRequestFormData>({
    item_name: "",
    quantity: 1,
    requested_by: "",
    notes: "",
    catalog_item_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCatalogSelect(variationId: string) {
    const item = inventory.find((i) => i.variationId === variationId);
    setForm((prev) => ({
      ...prev,
      catalog_item_id: variationId,
      item_name: item
        ? item.variationName && item.variationName !== "Regular"
          ? `${item.name} – ${item.variationName}`
          : item.name
        : prev.item_name,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.item_name.trim()) {
      setError("Item name is required");
      return;
    }
    if (form.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }
    if (!form.requested_by.trim()) {
      setError("Your name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          Array.isArray(data.errors)
            ? data.errors.join(", ")
            : data.error ?? "Submission failed"
        );
        return;
      }

      onSubmitted();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0b112b] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#1e293b] sticky top-0 bg-[#0b112b]">
          <h2 className="text-[#e6f1ff] text-xl font-bold">New Purchase Request</h2>
          <button
            onClick={onClose}
            className="text-[#8892b0] hover:text-[#e6f1ff] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Optional: Link to Square catalog item */}
          {inventory.length > 0 && (
            <div>
              <label className={LABEL_CLASS}>Link to Catalog Item (optional)</label>
              <select
                value={form.catalog_item_id}
                onChange={(e) => handleCatalogSelect(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">— Select from inventory —</option>
                {inventory.map((item) => (
                  <option key={item.variationId} value={item.variationId}>
                    {item.name}
                    {item.variationName && item.variationName !== "Regular"
                      ? ` – ${item.variationName}`
                      : ""}
                    {item.quantity !== null ? ` (${item.quantity} in stock)` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[#8892b0] text-xs mt-1.5">
                Linking enables automatic Square inventory update when marked arrived.
              </p>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className={LABEL_CLASS}>Item Name *</label>
            <input
              type="text"
              value={form.item_name}
              onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))}
              placeholder="e.g. Paper Towels, Coke Syrup"
              className={FIELD_CLASS}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className={LABEL_CLASS}>Quantity Needed *</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))
              }
              className={FIELD_CLASS}
            />
          </div>

          {/* Requested By */}
          <div>
            <label className={LABEL_CLASS}>Your Name *</label>
            <input
              type="text"
              value={form.requested_by}
              onChange={(e) => setForm((p) => ({ ...p, requested_by: e.target.value }))}
              placeholder="e.g. John"
              className={FIELD_CLASS}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL_CLASS}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional details..."
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#112240] hover:bg-[#1e293b] text-[#8892b0] hover:text-[#e6f1ff] py-3 rounded-lg text-sm font-medium transition-all border border-[#1e293b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#64ffda] hover:bg-[#64ffda]/90 disabled:opacity-60 disabled:cursor-not-allowed text-[#0a192f] py-3 rounded-lg text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(100,255,218,0.39)]"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

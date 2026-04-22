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
  "w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-colors";

const LABEL_CLASS =
  "block text-[10px] uppercase font-bold text-[#64748b] mb-2 tracking-widest";

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#f1f5f9] sticky top-0 bg-white">
          <h2 className="text-[#0f172a] text-xl font-bold">New Purchase Request</h2>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#0f172a] transition-colors p-1 rounded-lg hover:bg-[#f8fafc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
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
              <p className="text-[#94a3b8] text-xs mt-2">
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
            <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] py-3 rounded-lg text-sm font-medium transition-all border border-[#e2e8f0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.25)]"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

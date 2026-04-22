"use client";

import { Package, AlertCircle } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

interface Props {
  items: InventoryItem[];
  loading: boolean;
}

export function InventoryPanel({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
        <p className="text-[#64748b]">No inventory data. Check your Square connection.</p>
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, InventoryItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const getQuantityBadge = (qty: number | null) => {
    if (qty === null) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
          Not tracked
        </span>
      );
    }
    if (qty === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          Out of stock
        </span>
      );
    }
    if (qty <= 5) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {qty} — Low
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        {qty} in stock
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div
          key={category}
          className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm"
        >
          <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#2563eb]" />
            <h2 className="text-[#0f172a] font-semibold">{category}</h2>
            <span className="text-[#94a3b8] text-xs ml-auto">
              {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Item</th>
                  <th className="px-6 py-4 font-semibold">Variation</th>
                  <th className="px-6 py-4 font-semibold">Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {categoryItems.map((item) => (
                  <tr
                    key={item.variationId}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-6 py-5 text-[#0f172a] font-medium">{item.name}</td>
                    <td className="px-6 py-5 text-[#64748b] text-sm">{item.variationName}</td>
                    <td className="px-6 py-5">{getQuantityBadge(item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

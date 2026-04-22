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
        <div className="w-10 h-10 border-4 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-12 text-center">
        <AlertCircle className="w-10 h-10 text-[#8892b0] mx-auto mb-3" />
        <p className="text-[#8892b0]">No inventory data. Check your Square connection.</p>
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
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1e293b] text-[#8892b0] border border-[#1e293b]">
          Not tracked
        </span>
      );
    }
    if (qty === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Out of stock
        </span>
      );
    }
    if (qty <= 5) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {qty} — Low
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {qty} in stock
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div
          key={category}
          className="bg-[#0b112b] border border-[#1e293b] rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#1e293b] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#64ffda]" />
            <h2 className="text-[#e6f1ff] font-semibold">{category}</h2>
            <span className="text-[#8892b0] text-xs ml-auto">
              {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#112240] text-[#64ffda] text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Variation</th>
                  <th className="px-6 py-3">Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {categoryItems.map((item) => (
                  <tr
                    key={item.variationId}
                    className="hover:bg-[#112240]/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-[#e6f1ff] font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-[#8892b0] text-sm">{item.variationName}</td>
                    <td className="px-6 py-4">{getQuantityBadge(item.quantity)}</td>
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

"use client";

import { useState } from "react";
import { ShoppingCart, Truck, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { PurchaseRequest } from "@/lib/types";

interface Props {
  requests: PurchaseRequest[];
  loading: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    Icon: Clock,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    nextLabel: "Mark On Order",
    nextStatus: "on_order" as const,
    NextIcon: Truck,
  },
  on_order: {
    label: "On Order",
    Icon: Truck,
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    nextLabel: "Mark Arrived",
    nextStatus: "arrived" as const,
    NextIcon: CheckCheck,
  },
  arrived: {
    label: "Arrived",
    Icon: CheckCheck,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    nextLabel: null,
    nextStatus: null,
    NextIcon: null,
  },
} as const;

export function RequestsPanel({ requests, loading }: Props) {
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function advanceStatus(request: PurchaseRequest) {
    const config = STATUS_CONFIG[request.status];
    if (!config.nextStatus) return;

    setAdvancing(request.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[request.id];
      return next;
    });

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: config.nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors((prev) => ({
          ...prev,
          [request.id]: data.error ?? "Update failed",
        }));
      }
      // On success, Supabase realtime updates state automatically — no local mutation needed
    } catch {
      setErrors((prev) => ({ ...prev, [request.id]: "Network error — please try again" }));
    } finally {
      setAdvancing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-12 text-center">
        <ShoppingCart className="w-10 h-10 text-[#8892b0] mx-auto mb-3" />
        <p className="text-[#8892b0]">No purchase requests yet.</p>
        <p className="text-[#8892b0] text-sm mt-1">
          Click &ldquo;New Request&rdquo; to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const config = STATUS_CONFIG[req.status];
        const { Icon: StatusIcon, NextIcon } = config;
        const isAdvancing = advancing === req.id;
        const error = errors[req.id];

        return (
          <div
            key={req.id}
            className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-6 transition-all hover:border-[#64ffda]/20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                  <span className="text-[#8892b0] text-xs">
                    {new Date(req.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {req.updated_at !== req.created_at && (
                    <span className="text-[#8892b0] text-xs">
                      · Updated{" "}
                      {new Date(req.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <h3 className="text-[#e6f1ff] font-semibold text-lg truncate">
                  {req.item_name}
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#8892b0]">
                  <span>
                    Qty:{" "}
                    <span className="text-[#e6f1ff] font-medium">{req.quantity}</span>
                  </span>
                  <span>
                    Requested by:{" "}
                    <span className="text-[#e6f1ff] font-medium">{req.requested_by}</span>
                  </span>
                  {req.notes && (
                    <span className="truncate max-w-sm">
                      Notes: <span className="text-[#e6f1ff]">{req.notes}</span>
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 w-fit">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {config.nextStatus && NextIcon && (
                <button
                  onClick={() => advanceStatus(req)}
                  disabled={isAdvancing}
                  className="flex items-center gap-2 bg-[#112240] hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-[#64ffda] px-4 py-2.5 rounded-lg border border-[#64ffda]/20 transition-all font-medium text-sm whitespace-nowrap"
                >
                  {isAdvancing ? (
                    <div className="w-4 h-4 border-2 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <NextIcon className="w-4 h-4" />
                  )}
                  {isAdvancing ? "Updating..." : config.nextLabel}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

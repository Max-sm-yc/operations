"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Boxes, Package, ClipboardList, RefreshCw, Plus } from "lucide-react";
import type { InventoryItem, PurchaseRequest } from "@/lib/types";
import { InventoryPanel } from "@/components/inventory-panel";
import { RequestsPanel } from "@/components/requests-panel";
import { RequestForm } from "@/components/request-form";

type Tab = "inventory" | "requests";

export default function OpsTracker() {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setInventory(data.items ?? []);
    } catch (e) {
      console.error("Failed to load inventory", e);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, [fetchInventory, fetchRequests]);

  // Supabase realtime — all open tabs see request changes within ~100ms
  useEffect(() => {
    const channel = supabase
      .channel("purchase_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new as PurchaseRequest, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === (payload.new as PurchaseRequest).id
                  ? (payload.new as PurchaseRequest)
                  : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) =>
              prev.filter((r) => r.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const onOrderCount = requests.filter((r) => r.status === "on_order").length;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a] p-6 md:p-10 lg:p-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-12 gap-6">
        <div className="flex items-center gap-3">
          <Boxes className="w-9 h-9 text-[#2563eb] flex-shrink-0" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ops <span className="text-[#2563eb]">Tracker</span>
            </h1>
            <p className="text-[#64748b] text-sm mt-1">
              Square inventory &amp; purchase request management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick stats */}
          {(pendingCount > 0 || onOrderCount > 0) && (
            <div className="flex gap-2 text-xs">
              {pendingCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  {pendingCount} pending
                </span>
              )}
              {onOrderCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {onOrderCount} on order
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => {
              fetchInventory();
              fetchRequests();
            }}
            className="flex items-center gap-2 bg-white hover:bg-[#f1f5f9] text-[#2563eb] px-5 py-2.5 rounded-lg border border-[#e2e8f0] transition-all font-medium text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg transition-all font-bold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.25)]"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 w-fit mb-10 shadow-sm">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "inventory"
              ? "bg-[#2563eb] text-white shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-[#2563eb] text-white shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Requests
          {requests.length > 0 && (
            <span
              className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "requests"
                  ? "bg-white/20 text-white"
                  : "bg-[#f1f5f9] text-[#64748b]"
              }`}
            >
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "inventory" ? (
        <InventoryPanel items={inventory} loading={loadingInventory} />
      ) : (
        <RequestsPanel requests={requests} loading={loadingRequests} />
      )}

      {/* New Request Modal */}
      {showRequestForm && (
        <RequestForm
          inventory={inventory}
          onClose={() => setShowRequestForm(false)}
          onSubmitted={() => {
            setShowRequestForm(false);
            setActiveTab("requests");
          }}
        />
      )}
    </main>
  );
}

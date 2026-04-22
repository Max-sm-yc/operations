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
    <main className="min-h-screen bg-[#040a21] text-[#e6f1ff] p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6">
        <div className="flex items-center gap-3">
          <Boxes className="w-9 h-9 text-[#64ffda] flex-shrink-0" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ops <span className="text-[#64ffda]">Tracker</span>
            </h1>
            <p className="text-[#8892b0] text-sm mt-1">
              Square inventory &amp; purchase request management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick stats */}
          {(pendingCount > 0 || onOrderCount > 0) && (
            <div className="flex gap-2 text-xs">
              {pendingCount > 0 && (
                <span className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  {pendingCount} pending
                </span>
              )}
              {onOrderCount > 0 && (
                <span className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
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
            className="flex items-center gap-2 bg-[#112240] hover:bg-[#1e293b] text-[#64ffda] px-4 py-2.5 rounded-lg border border-[#64ffda]/20 transition-all font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-[#64ffda] hover:bg-[#64ffda]/90 text-[#0a192f] px-5 py-2.5 rounded-lg transition-all font-bold text-sm shadow-[0_4px_14px_0_rgba(100,255,218,0.39)]"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0b112b] border border-[#1e293b] rounded-xl p-1 w-fit mb-8">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "inventory"
              ? "bg-[#64ffda] text-[#0a192f]"
              : "text-[#8892b0] hover:text-[#e6f1ff]"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-[#64ffda] text-[#0a192f]"
              : "text-[#8892b0] hover:text-[#e6f1ff]"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Requests
          {requests.length > 0 && (
            <span
              className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "requests"
                  ? "bg-[#0a192f]/20 text-[#0a192f]"
                  : "bg-[#1e293b] text-[#8892b0]"
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

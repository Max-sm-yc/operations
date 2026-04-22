import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSquareClient, SQUARE_LOCATION_ID } from "@/lib/square";

type Status = "pending" | "on_order" | "arrived";

const VALID_TRANSITIONS: Record<Status, Status | null> = {
  pending: "on_order",
  on_order: "arrived",
  arrived: null,
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status: Status };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const newStatus = body.status;
  if (!["pending", "on_order", "arrived"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 422 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch current request to validate transition and get catalog_item_id/quantity
  const { data: existing, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const currentStatus = existing.status as Status;
  const expectedNext = VALID_TRANSITIONS[currentStatus];

  if (newStatus !== expectedNext) {
    return NextResponse.json(
      { error: `Cannot transition from "${currentStatus}" to "${newStatus}"` },
      { status: 422 }
    );
  }

  // If marking as "arrived" and a catalog variation ID is linked, update Square inventory first
  if (newStatus === "arrived" && existing.catalog_item_id) {
    try {
      const occurredAt = new Date().toISOString();
      // Deterministic idempotency key: safe to retry on same day without double-counting
      const datePart = occurredAt.substring(0, 10);
      const idempotencyKey = `${id}-arrived-${datePart}`;

      await getSquareClient().inventory.batchCreateChanges({
        idempotencyKey,
        changes: [
          {
            type: "ADJUSTMENT",
            adjustment: {
              fromState: "NONE",
              toState: "IN_STOCK",
              catalogObjectId: existing.catalog_item_id,
              locationId: SQUARE_LOCATION_ID,
              quantity: String(existing.quantity),
              occurredAt,
            },
          },
        ],
      });
    } catch (squareError: unknown) {
      console.error("Square inventory update failed for request", id, squareError);
      return NextResponse.json(
        {
          error: "Square inventory update failed — status not changed.",
          detail: squareError instanceof Error ? squareError.message : "Unknown Square error",
        },
        { status: 502 }
      );
    }
  }

  // Square succeeded (or not needed) — update Supabase status
  const { data: updated, error: updateError } = await supabase
    .from("purchase_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    // Partial failure: Square was updated but Supabase failed — log for manual reconciliation
    console.error(
      "CRITICAL: Square inventory updated but Supabase status update failed for request",
      id,
      updateError
    );
    return NextResponse.json(
      { error: "Database update failed after Square inventory update. Contact admin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ request: updated });
}

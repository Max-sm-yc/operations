import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { NewRequestFormData } from "@/lib/types";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: Request) {
  let body: NewRequestFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const errors: string[] = [];
  if (!body.item_name?.trim()) errors.push("item_name is required");
  if (!body.quantity || body.quantity < 1) errors.push("quantity must be at least 1");
  if (!body.requested_by?.trim()) errors.push("requested_by is required");

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      item_name: body.item_name.trim(),
      quantity: body.quantity,
      requested_by: body.requested_by.trim(),
      notes: body.notes?.trim() || null,
      catalog_item_id: body.catalog_item_id || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
}

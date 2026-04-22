import { NextResponse } from "next/server";
import { getSquareClient, SQUARE_LOCATION_ID } from "@/lib/square";
import type { CatalogObject } from "square";
import type { InventoryItem } from "@/lib/types";

export async function GET() {
  try {
    // Step 1: Fetch all CATEGORY objects to build id → name lookup
    const categoryMap: Record<string, string> = {};
    const categoryPage = await getSquareClient().catalog.list({ types: "CATEGORY" });
    for await (const obj of categoryPage) {
      if (obj.type === "CATEGORY") {
        const cat = obj as Extract<CatalogObject, { type: "CATEGORY" }>;
        if (cat.id && cat.categoryData?.name) {
          categoryMap[cat.id] = cat.categoryData.name;
        }
      }
    }

    // Step 2: Fetch all ITEM catalog objects (auto-paginated)
    const catalogItems: Array<Extract<CatalogObject, { type: "ITEM" }>> = [];
    const itemPage = await getSquareClient().catalog.list({ types: "ITEM" });
    for await (const obj of itemPage) {
      if (obj.type === "ITEM") {
        catalogItems.push(obj as Extract<CatalogObject, { type: "ITEM" }>);
      }
    }

    // Step 3: Build variationId → metadata map
    const variationMeta: Record<string, {
      name: string;
      variationName: string;
      category: string;
      catalogItemId: string;
    }> = {};

    for (const item of catalogItems) {
      const itemName = item.itemData?.name ?? "Unknown Item";

      // Resolve category name: use categories[] (current API), fall back to deprecated categoryId
      let category = "Uncategorized";
      const cats = item.itemData?.categories;
      if (cats && cats.length > 0 && cats[0].id) {
        category = categoryMap[cats[0].id] ?? "Uncategorized";
      } else if (item.itemData?.categoryId) {
        category = categoryMap[item.itemData.categoryId] ?? "Uncategorized";
      }

      const variations = item.itemData?.variations ?? [];
      for (const variation of variations) {
        if (variation.type !== "ITEM_VARIATION" || !variation.id) continue;
        const v = variation as Extract<CatalogObject, { type: "ITEM_VARIATION" }>;
        variationMeta[variation.id] = {
          name: itemName,
          variationName: v.itemVariationData?.name ?? "Regular",
          category,
          catalogItemId: item.id ?? "",
        };
      }
    }

    const variationIds = Object.keys(variationMeta);

    // Step 4: Batch-retrieve inventory counts (max 100 IDs per Square API limit)
    const countMap: Record<string, number> = {};
    const trackedIds = new Set<string>();

    if (variationIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < variationIds.length; i += BATCH_SIZE) {
        const batch = variationIds.slice(i, i + BATCH_SIZE);
        const countsPage = await getSquareClient().inventory.batchGetCounts({
          catalogObjectIds: batch,
          locationIds: [SQUARE_LOCATION_ID],
        });
        for await (const count of countsPage) {
          if (count.catalogObjectId && count.state === "IN_STOCK") {
            trackedIds.add(count.catalogObjectId);
            countMap[count.catalogObjectId] = parseFloat(count.quantity ?? "0");
          }
        }
      }
    }

    // Step 5: Merge into InventoryItem[]
    const items: InventoryItem[] = variationIds.map((varId) => {
      const meta = variationMeta[varId];
      return {
        catalogItemId: meta.catalogItemId,
        variationId: varId,
        name: meta.name,
        variationName: meta.variationName,
        category: meta.category,
        quantity: trackedIds.has(varId) ? (countMap[varId] ?? 0) : null,
      };
    });

    // Sort: tracked items first, then alphabetically by name
    items.sort((a, b) => {
      if (a.quantity !== null && b.quantity === null) return -1;
      if (a.quantity === null && b.quantity !== null) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory from Square" },
      { status: 500 }
    );
  }
}

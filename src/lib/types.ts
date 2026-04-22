// Square catalog item merged with inventory count
export interface InventoryItem {
  catalogItemId: string;    // ITEM object ID (parent)
  variationId: string;      // ITEM_VARIATION ID (used in inventory API calls)
  name: string;
  variationName: string;    // e.g. "Regular", "Large"
  category: string;
  quantity: number | null;  // null = inventory tracking not enabled in Square
}

// Supabase purchase_requests row
export interface PurchaseRequest {
  id: string;
  item_name: string;
  quantity: number;
  requested_by: string;
  notes: string | null;
  status: 'pending' | 'on_order' | 'arrived';
  catalog_item_id: string | null; // Square variation ID for auto-inventory update on arrival
  created_at: string;
  updated_at: string;
}

// Form data for creating a new request
export interface NewRequestFormData {
  item_name: string;
  quantity: number;
  requested_by: string;
  notes: string;
  catalog_item_id: string;
}

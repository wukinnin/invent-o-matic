export type InventoryItemStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  unit_of_measure: string | null;
  current_stock: number;
  minimum_level: number;
  status: InventoryItemStatus;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export interface InventoryItemDetails {
  id: number;
  name: string;
  sku: string | null;
  unit_of_measure: string | null;
  current_stock: number;
  minimum_level: number;
  supplier_ids: number[];
}
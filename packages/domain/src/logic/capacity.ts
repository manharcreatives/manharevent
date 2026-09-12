import type { PassType } from "../entities/pass-type";

export interface CapacityStatus {
  available: number;
  is_sold_out: boolean;
  /** Show low-stock warning when true (only when genuinely low — UX rule). */
  show_low_stock: boolean;
  low_stock_threshold: number;
}

export function getCapacityStatus(pt: PassType): CapacityStatus {
  const available = pt.total_quantity - pt.sold_quantity - pt.held_quantity;
  const threshold = Math.min(10, Math.round(pt.total_quantity * 0.05));
  return {
    available: Math.max(0, available),
    is_sold_out: available <= 0,
    show_low_stock: available > 0 && available <= threshold,
    low_stock_threshold: threshold,
  };
}

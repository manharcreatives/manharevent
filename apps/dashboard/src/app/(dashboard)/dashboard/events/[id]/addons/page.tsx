"use client";

import { Button, Money } from "@manhar-garba/ui";
import { addons } from "@manhar-garba/mock-data";
import { Plus, Zap, Car, ShoppingBag } from "lucide-react";

const KIND_ICON: Record<string, React.ReactNode> = {
  parking: <Car className="h-4 w-4" />,
  wallet_topup: <Zap className="h-4 w-4" />,
  merchandise: <ShoppingBag className="h-4 w-4" />,
};

export default function AddonsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Add-ons</h1>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add add-on
        </Button>
      </div>
      <ul className="space-y-3">
        {addons.map((a) => (
          <li key={a.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
                  {KIND_ICON[a.kind] ?? <Zap className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.kind.replace("_", " ")} · <Money paise={a.price_paise} locale="en" /></p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{a.sold_quantity} sold</span>
                <span className={a.status === "on_sale" ? "text-success" : "text-muted-foreground"}>{a.status === "on_sale" ? "Active" : a.status}</span>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

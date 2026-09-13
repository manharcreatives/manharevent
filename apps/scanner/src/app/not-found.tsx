import Link from "next/link";
import { ScanLine } from "lucide-react";

// Gate-staff surface: one enormous target, no prose. Someone is standing at a
// gate at night with a queue behind them — the only useful action is "get me
// back to the scanner".
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-muted-foreground">404</p>
        <p className="mt-3 text-lg font-semibold text-foreground">Wrong screen</p>
      </div>
      <Link
        href="/scan"
        className="flex h-20 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground active:scale-[0.98]"
      >
        <ScanLine className="h-7 w-7" />
        Back to scanner
      </Link>
    </div>
  );
}

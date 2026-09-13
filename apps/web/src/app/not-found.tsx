import Link from "next/link";
import { Compass, Ticket } from "lucide-react";
import { buttonVariants } from "@manhar-garba/ui";

// Root-level 404. next-intl's middleware means most unmatched paths land here
// *before* a locale is resolved, so this page is deliberately locale-free and
// links back to `/` (the middleware re-adds the visitor's locale).
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <span
          aria-hidden
          className="font-display text-[8rem] font-bold leading-none text-transparent [-webkit-text-stroke:2px_hsl(var(--border-strong))] sm:text-[11rem]"
        >
          404
        </span>
        <Compass className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-primary" />
      </div>

      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
        This page isn&rsquo;t here
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The link may be old, or the event may have finished. Everything on sale right now is on the
        home page.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Go to home
        </Link>
        <Link href="/me/passes" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Ticket className="mr-2 h-4 w-4" />
          My passes
        </Link>
      </div>
    </div>
  );
}

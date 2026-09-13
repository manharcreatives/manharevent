import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@manhar-garba/ui";

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
        No such screen
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This page doesn&rsquo;t exist, or the event it belonged to was deleted. Everything you can
        manage is in the sidebar from the dashboard home.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard home
        </Link>
        <Link href="/dashboard/events" className={buttonVariants({ variant: "outline", size: "lg" })}>
          My events
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Compass } from "lucide-react";
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

      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        That link doesn&rsquo;t exist on ManharEvent. If you were mid-registration, your application
        is saved — pick it up from the registration page.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Go to home
        </Link>
        <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Register your event
        </Link>
      </div>
    </div>
  );
}

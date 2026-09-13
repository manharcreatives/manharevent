import { cva, type VariantProps } from "class-variance-authority";

/**
 * Split out of `button.tsx` (which is `"use client"`) so that server components
 * — 404 pages, static marketing sections, anything rendering a `<Link>` styled
 * as a button — can call it. Importing it from the client file makes Next treat
 * it as a client function and throws at prerender time.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-surface text-foreground border border-border hover:bg-surface-raised",
        ghost: "hover:bg-surface-raised hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-surface-raised hover:text-foreground",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-xs",
        default: "h-10 rounded px-4 py-2 text-sm",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-16 rounded-lg px-8 text-lg",
        icon: "h-10 w-10 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

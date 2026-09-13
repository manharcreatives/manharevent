import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Component gallery",
  description: "Every shared component, in both themes.",
};

export default function DevGalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

"use client";

/**
 * Client-side dynamic imports for the buyer trace page.
 * next/dynamic with ssr:false must live in a Client Component (Next.js 16 rule).
 * This file is the single place that wraps map + signature for SSR-free rendering.
 */

import dynamic from "next/dynamic";

export const BatchTraceMap = dynamic(
  () => import("@/components/map/BatchTraceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-stone-200 animate-pulse aspect-[4/3] md:aspect-[16/10]" />
    ),
  },
);

export { default as SignatureButton } from "@/components/signature/SignatureButton";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/field", label: "Field" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-black/75 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
            <span className="text-base font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              herb
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
              EUDR Ready
            </span>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
            >
              Dashboard
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

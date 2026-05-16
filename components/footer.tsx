import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-4 h-4 text-amber-400" />
              <span className="text-base font-bold text-white">herb</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-zinc-500">
              Farm-to-market trust infrastructure for East African smallholder
              agriculture. Built for EUDR compliance, designed for the farmer.
            </p>
            <div className="flex gap-2 mt-5">
              <span className="px-2.5 py-1 rounded-md text-xs bg-white/[0.05] text-zinc-400 border border-white/[0.07]">
                Tanzania Pilot
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                EUDR Aligned
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/field" className="text-zinc-500 hover:text-white transition-colors duration-200">
                  Field App
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zinc-500 hover:text-white transition-colors duration-200">
                  About & Research
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">Focus Areas</h3>
            <ul className="space-y-2.5 text-sm text-zinc-500">
              <li>Tanzania Coffee</li>
              <li>East Africa Avocado</li>
              <li>EUDR Compliance</li>
              <li>Cooperative Traceability</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-700">
          <p>© 2025 Herb · Farm-to-market traceability infrastructure.</p>
          <p>Shortcut Asia Challenge · Tanzania pilot</p>
        </div>
      </div>
    </footer>
  );
}

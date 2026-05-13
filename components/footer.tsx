import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-white mb-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold">herb</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-stone-400">
              Farm-to-market trust infrastructure for East African smallholder
              agriculture. Built for EUDR compliance, designed for the farmer.
            </p>
            <div className="flex gap-2 mt-4">
              <span className="px-2 py-1 rounded text-xs bg-stone-800 text-stone-300">
                Tanzania Pilot
              </span>
              <span className="px-2 py-1 rounded text-xs bg-emerald-900 text-emerald-300">
                EUDR Aligned
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/field" className="hover:text-white transition-colors">
                  Field App
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About & Research
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Focus Areas</h3>
            <ul className="space-y-2 text-sm">
              <li>Tanzania Coffee</li>
              <li>East Africa Avocado</li>
              <li>EUDR Compliance</li>
              <li>Cooperative Traceability</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>© 2024 Herb · A demonstration platform for smallholder agriculture traceability.</p>
          <p>Built for the Shortcut Asia Challenge · Tanzanian pilot focus</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  Bot,
  Boxes,
  BrainCircuit,
  Gauge,
  Wrench,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    href: "/",
    icon: Gauge,
  },
  {
    label: "Assets",
    href: "/assets",
    icon: Boxes,
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: Wrench,
  },
  {
    label: "Memory Explorer",
    href: "/memory",
    icon: BrainCircuit,
  },
  {
    label: "Agent Activity",
    href: "/activity",
    icon: Activity,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[256px] shrink-0 border-r border-[#25303a] bg-[#10171d] lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-[#25303a] px-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#e7a93a] text-[#10171d] shadow-[0_8px_24px_rgba(231,169,58,0.18)]">
          <Bot size={21} strokeWidth={2.2} />
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
              FIELDfix
            </span>
            <span className="text-xs font-semibold text-[#e7a93a]">
              AI
            </span>
          </div>

          <p className="mt-0.5 text-[11px] text-[#89959f]">
            Infrastructure that remembers
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#68747e]">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-[#9ca7af] hover:bg-white/[0.045] hover:text-white",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  strokeWidth={1.9}
                  className={
                    active
                      ? "text-[#e7a93a]"
                      : "text-[#7f8a93]"
                  }
                />

                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4">
        <div className="rounded-2xl border border-[#2b3741] bg-[#151e25] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-xs font-medium text-[#c7d0d6]">
              Memory system online
            </span>
          </div>

          <p className="text-[11px] leading-5 text-[#74818b]">
            CockroachDB persistent memory and outcome learning are active.
          </p>
        </div>
      </div>
    </aside>
  );
}

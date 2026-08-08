import { Bell, Menu, Search } from "lucide-react";

import { Sidebar } from "./sidebar";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#dfe5e9] bg-[#f5f7f9]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              className="flex size-10 items-center justify-center rounded-xl border border-[#dfe5e9] bg-white text-[#53606b] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-xl border border-[#dfe5e9] bg-white px-3.5 py-2.5 text-[#89949d]">
                <Search size={16} />

                <span className="w-48 text-xs">
                  Search assets, incidents...
                </span>

                <kbd className="rounded-md border border-[#e3e7ea] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#8b969f]">
                  /
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#dbe4df] bg-[#eef8f3] px-3 py-1.5 text-xs font-medium text-[#197250] sm:flex">
              <span className="size-1.5 rounded-full bg-[#1b9669]" />
              Agent healthy
            </div>

            <button
              className="relative flex size-10 items-center justify-center rounded-xl border border-[#dfe5e9] bg-white text-[#596671]"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-[#e7a93a]" />
            </button>

            <div className="flex size-10 items-center justify-center rounded-xl bg-[#172129] text-xs font-semibold text-white">
              SU
            </div>
          </div>
        </header>

        <main className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

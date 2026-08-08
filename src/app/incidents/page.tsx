import Link from "next/link";

import {
  ArrowRight,
  BrainCircuit,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/fieldfix/app-shell";

export default function IncidentsPage() {
  const incidents = [
    {
      asset: "TZ-PUMP-001",
      title: "Heavy vibration and delayed pressure loss",
      site: "Dodoma Central Water Station",
      severity: "High",
    },
    {
      asset: "TZ-PUMP-017",
      title: "Leakage with unstable discharge pressure",
      site: "Morogoro East Pump Station",
      severity: "Medium",
    },
    {
      asset: "TZ-PUMP-041",
      title: "Intermittent unexpected shutdown",
      site: "Dar es Salaam North",
      severity: "High",
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a27120]">
            Maintenance operations
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#17232c]">
            Incidents
          </h1>

          <p className="mt-2 text-sm text-[#74818b]">
            Review active failures and FIELDfix memory-supported diagnoses.
          </p>
        </div>

        <div className="ff-card mt-7 overflow-hidden">
          <div className="divide-y divide-[#e5e9eb]">
            {incidents.map((incident, index) => (
              <Link
                key={incident.asset}
                href={index === 0 ? "/incidents/demo" : "/incidents/demo"}
                className="group flex flex-col justify-between gap-4 p-5 transition hover:bg-[#fafbfb] sm:flex-row sm:items-center sm:px-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Wrench size={14} className="text-[#87939c]" />

                    <span className="font-mono text-xs font-semibold text-[#56636d]">
                      {incident.asset}
                    </span>

                    <span className="rounded-full bg-[#fff0e7] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#b35d25]">
                      {incident.severity}
                    </span>
                  </div>

                  <h2 className="mt-2 text-sm font-semibold text-[#26323b]">
                    {incident.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#87939c]">
                    <span>{incident.site}</span>

                    <span className="flex items-center gap-1.5">
                      <BrainCircuit size={13} />
                      Persistent memory available
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#8d631f]">
                  Open diagnosis
                  <ArrowRight
                    size={15}
                    className="transition group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

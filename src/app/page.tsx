import Link from "next/link";

import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/fieldfix/app-shell";
import { MetricCard } from "@/components/fieldfix/metric-card";

export default function Home() {
  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a27120]">
                Operations overview
              </span>

              <span className="size-1 rounded-full bg-[#c5cdd2]" />

              <span className="text-xs text-[#88949d]">
                Demo environment
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#16212a] sm:text-[38px]">
              Infrastructure that remembers.
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[#6f7c86]">
              FIELDfix turns verified field repairs into durable institutional memory,
              then uses historical outcomes to guide the next maintenance decision.
            </p>
          </div>

          <Link
            href="/incidents"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#172129] px-4 text-sm font-medium text-white transition hover:bg-[#24313b]"
          >
            Review incidents
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            label="Infrastructure assets"
            value="60"
            helper="Across 8 operational sites"
            icon={Boxes}
          />

          <MetricCard
            label="Historical incidents"
            value="360+"
            helper="Outcome-linked maintenance history"
            icon={Wrench}
            tone="warning"
          />

          <MetricCard
            label="Persistent memories"
            value="241"
            helper="Embedded repair episodes in CockroachDB"
            icon={BrainCircuit}
            tone="memory"
          />

          <MetricCard
            label="Verified outcomes"
            value="360+"
            helper="Success, failure and recurrence evidence"
            icon={CheckCircle2}
            tone="success"
          />
        </div>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
          <div className="ff-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e4e8eb] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-[#1b2730]">
                  Priority incidents
                </h2>
                <p className="mt-1 text-xs text-[#87939c]">
                  Incidents where historical memory can improve the repair decision
                </p>
              </div>

              <Link
                href="/incidents"
                className="text-xs font-semibold text-[#9a6919] hover:text-[#76500f]"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-[#e8ecef]">
              <IncidentRow
                asset="TZ-PUMP-001"
                issue="Heavy vibration and delayed pressure loss"
                site="Dodoma Central Water Station"
                severity="High"
                memory="60 comparable outcome memories"
                confidence="94.5%"
              />

              <IncidentRow
                asset="TZ-PUMP-017"
                issue="Leakage with unstable discharge pressure"
                site="Morogoro East Pump Station"
                severity="Medium"
                memory="60 comparable outcome memories"
                confidence="94.5%"
              />

              <IncidentRow
                asset="TZ-PUMP-041"
                issue="Intermittent unexpected shutdown"
                site="Dar es Salaam North"
                severity="High"
                memory="60 comparable outcome memories"
                confidence="94.5%"
              />
            </div>
          </div>

          <div className="ff-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-[#1b2730]">
                  Memory system
                </h2>

                <p className="mt-1 text-xs text-[#87939c]">
                  Persistent learning health
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-[#edf5fb] text-[#3276b1]">
                <Database size={19} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <MemoryHealthRow
                icon={Database}
                label="CockroachDB memory"
                value="Connected"
                good
              />

              <MemoryHealthRow
                icon={BrainCircuit}
                label="Vector index"
                value="Active"
                good
              />

              <MemoryHealthRow
                icon={ShieldCheck}
                label="Human approval gate"
                value="Enforced"
                good
              />

              <MemoryHealthRow
                icon={Sparkles}
                label="Bedrock reasoning"
                value="Fallback ready"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#e0e6e9] bg-[#f7f9fa] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf8f2] text-[#16875f]">
                  <BrainCircuit size={16} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#2b3841]">
                    Latest learned memory
                  </p>

                  <p className="mt-1.5 text-xs leading-5 text-[#71808b]">
                    Drive-end bearing lubrication breakdown learned from a verified
                    repair outcome and retrieved successfully on a later incident.
                  </p>

                  <Link
                    href="/memory"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#277b5d]"
                  >
                    Inspect memory
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <DecisionCard
            icon={CheckCircle2}
            title="Outcome-aware decisions"
            description="FIELDfix ranks repairs using verified success and recurrence history, not vector similarity alone."
            label="45 / 45 successful"
            tone="success"
          />

          <DecisionCard
            icon={TriangleAlert}
            title="Bad repair memory retained"
            description="Failed approaches stay in memory so future technicians can avoid repeating them."
            label="100% recurrence"
            tone="danger"
          />

          <DecisionCard
            icon={Clock3}
            title="Human remains in control"
            description="The agent proposes a repair plan, but a supervisor must approve it before execution."
            label="Approval required"
            tone="neutral"
          />
        </div>
      </section>
    </AppShell>
  );
}

function IncidentRow({
  asset,
  issue,
  site,
  severity,
  memory,
  confidence,
}: {
  asset: string;
  issue: string;
  site: string;
  severity: string;
  memory: string;
  confidence: string;
}) {
  return (
    <Link
      href="/incidents/demo"
      className="group grid gap-4 px-5 py-5 transition hover:bg-[#fafbfb] sm:px-6 lg:grid-cols-[1fr_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#485660]">
            {asset}
          </span>

          <span className="rounded-full bg-[#fff0e7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#b35d25]">
            {severity}
          </span>
        </div>

        <h3 className="mt-2 text-sm font-semibold text-[#1f2b34] transition group-hover:text-[#99691c]">
          {issue}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#83909a]">
          <span>{site}</span>

          <span className="flex items-center gap-1.5">
            <BrainCircuit size={13} />
            {memory}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:justify-end">
        <div className="text-left lg:text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-[#919ca4]">
            Agent confidence
          </p>

          <p className="mt-1 text-sm font-semibold text-[#1a805d]">
            {confidence}
          </p>
        </div>

        <ArrowRight
          size={17}
          className="text-[#a8b1b8] transition group-hover:translate-x-0.5 group-hover:text-[#a27120]"
        />
      </div>
    </Link>
  );
}

function MemoryHealthRow({
  icon: Icon,
  label,
  value,
  good = false,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon
          size={15}
          className="text-[#7d8992]"
        />

        <span className="text-xs font-medium text-[#53616c]">
          {label}
        </span>
      </div>

      <span
        className={[
          "text-xs font-semibold",
          good
            ? "text-[#16875f]"
            : "text-[#a27120]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function DecisionCard({
  icon: Icon,
  title,
  description,
  label,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  label: string;
  tone: "success" | "danger" | "neutral";
}) {
  const tones = {
    success: {
      icon: "bg-[#eaf8f2] text-[#16875f]",
      label: "bg-[#eaf8f2] text-[#16875f]",
    },

    danger: {
      icon: "bg-[#fff0f0] text-[#c74949]",
      label: "bg-[#fff0f0] text-[#b94545]",
    },

    neutral: {
      icon: "bg-[#f0f3f5] text-[#56636d]",
      label: "bg-[#f0f3f5] text-[#56636d]",
    },
  };

  return (
    <div className="ff-card p-5">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${tones[tone].icon}`}
      >
        <Icon size={18} />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#1d2932]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#77848e]">
        {description}
      </p>

      <span
        className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tones[tone].label}`}
      >
        {label}
      </span>
    </div>
  );
}

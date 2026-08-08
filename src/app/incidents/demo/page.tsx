import Link from "next/link";

import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Check,
  CheckCircle2,
  Database,
  ExternalLink,
  Gauge,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wrench,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/fieldfix/app-shell";

export default function IncidentDiagnosisPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#78858f] transition hover:text-[#1c2932]"
        >
          <ArrowLeft size={14} />
          Back to operations
        </Link>

        <section className="ff-card overflow-hidden">
          <div className="border-b border-[#e4e8eb] px-5 py-6 sm:px-7 lg:px-8">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#57646e]">
                    TZ-PUMP-001
                  </span>

                  <span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#b35d25]">
                    High severity
                  </span>

                  <span className="rounded-full bg-[#edf5fb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#3276b1]">
                    Diagnosing
                  </span>
                </div>

                <h1 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-0.035em] text-[#17232c] sm:text-[30px]">
                  Heavy vibration and delayed pressure loss
                </h1>

                <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6f7c86]">
                  Pump vibrates heavily and loses discharge pressure after
                  approximately twenty minutes of operation.
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#84919a]">
                  <span>Dodoma Central Water Station</span>
                  <span>DemoPump Industries · CP-250</span>
                  <span>Criticality: High</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#dbe8e2] bg-[#f2faf6] px-4 py-3">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#1b9669]" />
                </span>

                <div>
                  <p className="text-xs font-semibold text-[#176e50]">
                    FIELDfix analysis complete
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#6e9384]">
                    Persistent memory evidence retrieved
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border-b border-[#e4e8eb] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#edf5fb] text-[#3276b1]">
                  <BrainCircuit size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#84919a]">
                    FIELDfix diagnosis
                  </p>
                  <p className="mt-0.5 text-xs text-[#9aa4ab]">
                    Outcome-aware maintenance recommendation
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#17232c]">
                    Motor capacitor degradation
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#687681]">
                    Historical cases indicate an electrical degradation pattern
                    rather than a hydraulic control failure.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-[#eaf8f2] px-4 py-3 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#57947d]">
                    Confidence
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#16875f]">
                    94.5%
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-[#e0e6e9] bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff5df] text-[#ad761c]">
                    <Wrench size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#89949d]">
                      Recommended repair
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-[#27343d]">
                      Inspect operating voltage and capacitor capacitance, then
                      replace the degraded motor capacitor.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#78858f]">
                      Verify electrical isolation and field conditions before
                      performing any maintenance work.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#26323b]">
                      Verified historical outcome evidence
                    </h3>
                    <p className="mt-1 text-xs text-[#87939c]">
                      Repair performance across comparable persistent memories
                    </p>
                  </div>

                  <Database size={17} className="text-[#8a969f]" />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <EvidenceMetric
                    value="45"
                    label="Similar cases"
                    helper="Verified memories"
                  />

                  <EvidenceMetric
                    value="100%"
                    label="Successful"
                    helper="45 of 45 cases"
                    good
                  />

                  <EvidenceMetric
                    value="0%"
                    label="Recurrence"
                    helper="No repeat failures"
                    good
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center gap-2">
                  <Gauge size={17} className="text-[#65737d]" />

                  <div>
                    <h3 className="text-sm font-semibold text-[#26323b]">
                      Why FIELDfix did not choose the nearest vector match
                    </h3>
                    <p className="mt-1 text-xs text-[#87939c]">
                      Similarity retrieves candidates. Verified outcomes decide
                      which repair deserves recommendation.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#dde4e8]">
                  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#e4e8eb] bg-[#f7faf8] p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CheckCircle2
                          size={16}
                          className="text-[#16875f]"
                        />

                        <p className="text-sm font-semibold text-[#243139]">
                          Replace degraded motor capacitor
                        </p>

                        <span className="rounded-full bg-[#eaf8f2] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#16875f]">
                          Recommended
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#74818b]">
                        Outcome evidence consistently supports this repair.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#8e99a1]">
                        Similarity
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#3d4a53]">
                        0.8718
                      </p>
                    </div>

                    <div className="col-span-2 mt-1 grid gap-2 sm:grid-cols-3">
                      <MiniEvidence label="Cases" value="45" />
                      <MiniEvidence label="Success" value="100%" good />
                      <MiniEvidence label="Recurrence" value="0%" good />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4 bg-[#fffafa] p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <XCircle
                          size={16}
                          className="text-[#c74949]"
                        />

                        <p className="text-sm font-semibold text-[#353d43]">
                          Replace pressure control valve
                        </p>

                        <span className="rounded-full bg-[#fff0f0] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#b94545]">
                          Avoid
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-[#7d878e]">
                        This candidate is actually more similar by embedding
                        distance, but historical outcomes show repeated failure.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#8e99a1]">
                        Similarity
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#b94545]">
                        0.8801
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-[#c96b6b]">
                        Higher match
                      </p>
                    </div>

                    <div className="col-span-2 mt-1 grid gap-2 sm:grid-cols-3">
                      <MiniEvidence label="Cases" value="15" />
                      <MiniEvidence label="Success" value="0%" danger />
                      <MiniEvidence
                        label="Recurrence"
                        value="100%"
                        danger
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff8e9] px-4 py-3 text-xs leading-5 text-[#816026]">
                  <Sparkles size={15} className="mt-0.5 shrink-0" />
                  <span>
                    FIELDfix selected the lower-similarity repair because verified
                    outcome memory shows dramatically better real-world results.
                  </span>
                </div>
              </div>
            </div>

            <aside className="bg-[#fbfcfc] p-5 sm:p-7 lg:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a969f]">
                  Decision control
                </p>

                <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[#202d36]">
                  Supervisor approval required
                </h3>

                <p className="mt-2 text-xs leading-5 text-[#77858f]">
                  FIELDfix can diagnose and propose a repair, but cannot execute
                  physical maintenance without human approval.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-[#dce9e2] bg-[#f3faf6] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#16875f]"
                  />

                  <div>
                    <p className="text-xs font-semibold text-[#23664f]">
                      Human-in-the-loop enforced
                    </p>

                    <p className="mt-1.5 text-[11px] leading-5 text-[#6d8b7e]">
                      No actuator or equipment-control capability is exposed to
                      the agent.
                    </p>
                  </div>
                </div>
              </div>

              <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#172129] text-sm font-semibold text-white transition hover:bg-[#27343e]">
                <Check size={17} />
                Approve repair plan
              </button>

              <button className="mt-2.5 flex h-11 w-full items-center justify-center rounded-xl border border-[#dce2e6] bg-white text-xs font-semibold text-[#596771] transition hover:bg-[#f7f9fa]">
                Request another inspection
              </button>

              <div className="my-7 h-px bg-[#e1e6e9]" />

              <div>
                <h4 className="text-xs font-semibold text-[#36434c]">
                  Agent reasoning
                </h4>

                <div className="mt-3 space-y-3">
                  <StatusRow
                    icon={BrainCircuit}
                    label="Outcome engine"
                    value="Verified"
                    good
                  />

                  <StatusRow
                    icon={Database}
                    label="Memory retrieval"
                    value="8 episodes"
                    good
                  />

                  <StatusRow
                    icon={Sparkles}
                    label="Bedrock adapter"
                    value="Fallback safe"
                  />

                  <StatusRow
                    icon={ShieldCheck}
                    label="Approval gate"
                    value="Pending"
                  />
                </div>
              </div>

              <div className="my-7 h-px bg-[#e1e6e9]" />

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#36434c]">
                    Agent tool trace
                  </h4>

                  <Activity size={15} className="text-[#89959e]" />
                </div>

                <div className="mt-4 space-y-0">
                  <TraceStep
                    label="Get incident context"
                    detail="Incident + symptoms"
                  />
                  <TraceStep
                    label="Get asset context"
                    detail="CP-250 · Dodoma"
                  />
                  <TraceStep
                    label="Search asset history"
                    detail="6 prior incidents"
                  />
                  <TraceStep
                    label="Create query embedding"
                    detail="1024 dimensions"
                  />
                  <TraceStep
                    label="Search similar memories"
                    detail="Vector index"
                  />
                  <TraceStep
                    label="Compare recurrence stats"
                    detail="Outcome ranking"
                    last
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="ff-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#87939c]">
                  Memory evidence
                </p>

                <h2 className="mt-2 text-base font-semibold text-[#24313a]">
                  Historical episodes supporting this decision
                </h2>
              </div>

              <Link
                href="/memory"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8d631f]"
              >
                Memory Explorer
                <ExternalLink size={13} />
              </Link>
            </div>

            <div className="mt-5 divide-y divide-[#e7ebed]">
              <MemoryRow
                title="Vibration + delayed pressure loss"
                repair="Capacitor inspection and replacement"
                outcome="Successful · no recurrence"
                similarity="0.8718"
              />

              <MemoryRow
                title="Vibration + delayed pressure loss"
                repair="Pressure control valve replacement"
                outcome="Partial · recurrence detected"
                similarity="0.8801"
                bad
              />

              <MemoryRow
                title="Electrical performance degradation"
                repair="Operating-voltage verification"
                outcome="Successful · no recurrence"
                similarity="0.8629"
              />
            </div>
          </div>

          <div className="ff-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#16875f]">
                <BrainCircuit size={19} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#87939c]">
                  Institutional memory
                </p>
                <h2 className="mt-1 text-base font-semibold text-[#26323b]">
                  FIELDfix remembers outcomes, not just actions.
                </h2>
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-[#72808a]">
              Repair attempts that fail are retained alongside successful repairs.
              When a future incident occurs, the agent compares what teams tried
              before with what happened afterward.
            </p>

            <div className="mt-5 rounded-2xl border border-[#e0e6e9] bg-[#f7f9fa] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#87939c]">
                Learned lesson
              </p>

              <p className="mt-2 text-xs leading-6 text-[#4f5d67]">
                When vibration appears together with delayed pressure loss,
                inspect the electrical system and capacitor before replacing
                hydraulic valves.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EvidenceMetric({
  value,
  label,
  helper,
  good = false,
}: {
  value: string;
  label: string;
  helper: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e6e9] bg-white p-4">
      <p
        className={[
          "text-2xl font-semibold tracking-[-0.04em]",
          good ? "text-[#16875f]" : "text-[#25323b]",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-1.5 text-xs font-semibold text-[#4f5d67]">
        {label}
      </p>

      <p className="mt-1 text-[10px] text-[#909aa2]">
        {helper}
      </p>
    </div>
  );
}

function MiniEvidence({
  label,
  value,
  good = false,
  danger = false,
}: {
  label: string;
  value: string;
  good?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e5e9ec] bg-white/80 px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#919ba3]">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-xs font-semibold",
          good
            ? "text-[#16875f]"
            : danger
              ? "text-[#c74949]"
              : "text-[#39464f]",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  good = false,
}: {
  icon: typeof BrainCircuit;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="text-[#7c8992]" />
        <span className="text-[11px] text-[#5f6d77]">{label}</span>
      </div>

      <span
        className={[
          "text-[10px] font-semibold",
          good ? "text-[#16875f]" : "text-[#8d681f]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function TraceStep({
  label,
  detail,
  last = false,
}: {
  label: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-5">
      {!last && (
        <div className="absolute left-[7px] top-4 h-full w-px bg-[#dfe5e8]" />
      )}

      <div className="relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eaf8f2]">
        <div className="size-1.5 rounded-full bg-[#16875f]" />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#4c5963]">{label}</p>
        <p className="mt-0.5 text-[10px] text-[#929ca4]">{detail}</p>
      </div>
    </div>
  );
}

function MemoryRow({
  title,
  repair,
  outcome,
  similarity,
  bad = false,
}: {
  title: string;
  repair: string;
  outcome: string;
  similarity: string;
  bad?: boolean;
}) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          {bad ? (
            <TriangleAlert size={14} className="text-[#c74949]" />
          ) : (
            <CheckCircle2 size={14} className="text-[#16875f]" />
          )}

          <p className="text-xs font-semibold text-[#34414a]">{title}</p>
        </div>

        <p className="mt-1.5 text-[11px] text-[#78858e]">{repair}</p>

        <p
          className={[
            "mt-1 text-[10px] font-medium",
            bad ? "text-[#b95858]" : "text-[#3c8a6c]",
          ].join(" ")}
        >
          {outcome}
        </p>
      </div>

      <div className="sm:text-right">
        <p className="text-[9px] uppercase tracking-[0.08em] text-[#949ea5]">
          Similarity
        </p>
        <p className="mt-1 font-mono text-xs font-semibold text-[#52606a]">
          {similarity}
        </p>
      </div>
    </div>
  );
}

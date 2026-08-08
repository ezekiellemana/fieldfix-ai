import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  Fingerprint,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { AppShell } from "@/components/fieldfix/app-shell";

export default function MemoryExplorerPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1450px]">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a27120]">
              Persistent agentic memory
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#17232c] sm:text-[38px]">
              Memory Explorer
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[#6f7c86]">
              Inspect the repair episodes FIELDfix retrieves, the outcomes attached
              to them, and what the agent has learned from verified field work.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#dbe8e2] bg-[#f2faf6] px-4 py-3">
            <span className="size-2 rounded-full bg-[#1b9669]" />

            <div>
              <p className="text-xs font-semibold text-[#176e50]">
                Vector memory online
              </p>

              <p className="mt-0.5 text-[10px] text-[#729485]">
                CockroachDB VECTOR(1024)
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={BrainCircuit}
            label="Persistent episodes"
            value="241"
            helper="Outcome-linked memories"
          />

          <Metric
            icon={Database}
            label="Embedding dimensions"
            value="1024"
            helper="Multilingual E5 vectors"
          />

          <Metric
            icon={CheckCircle2}
            label="Verified outcomes"
            value="360+"
            helper="Success + recurrence evidence"
          />

          <Metric
            icon={ShieldCheck}
            label="New learned episodes"
            value="1"
            helper="Created from verified outcome"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <div className="ff-card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#26323b]">
                    Semantic memory search
                  </h2>

                  <p className="mt-1 text-xs text-[#87939c]">
                    Search by symptoms or maintenance context
                  </p>
                </div>

                <Search size={17} className="text-[#87939c]" />
              </div>

              <div className="mt-5 flex items-center rounded-xl border border-[#dce3e7] bg-white px-3.5 py-3">
                <Search size={15} className="shrink-0 text-[#89959e]" />

                <span className="ml-2.5 text-xs text-[#687681]">
                  bearing squeal and overheating after ten minutes
                </span>
              </div>

              <button className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#172129] text-xs font-semibold text-white">
                Search persistent memory
              </button>

              <div className="mt-6 rounded-2xl border border-[#e1e6e9] bg-[#f8fafb] p-4">
                <div className="flex items-start gap-3">
                  <Fingerprint
                    size={17}
                    className="mt-0.5 shrink-0 text-[#3276b1]"
                  />

                  <div>
                    <p className="text-xs font-semibold text-[#34414a]">
                      Query embedding
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#76838d]">
                      1024-dimensional normalized vector generated using
                      multilingual-e5-large.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {[0.021, -0.014, 0.038, 0.007, -0.026].map((value) => (
                        <span
                          key={value}
                          className="rounded-md bg-[#edf1f3] px-2 py-1 font-mono text-[9px] text-[#66737d]"
                        >
                          {value}
                        </span>
                      ))}

                      <span className="rounded-md bg-[#edf1f3] px-2 py-1 font-mono text-[9px] text-[#66737d]">
                        … 1019 more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ff-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#16875f]">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#87939c]">
                    Learning loop
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-[#26323b]">
                    Latest learned memory
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <TimelineItem
                  label="Outcome verified"
                  value="Repair successful · no recurrence"
                />

                <TimelineItem
                  label="Reflection created"
                  value="Bearing lubrication breakdown"
                />

                <TimelineItem
                  label="Memory embedded"
                  value="VECTOR(1024) persisted"
                />

                <TimelineItem
                  label="Future incident"
                  value="Learned episode retrieved at rank #1"
                  last
                />
              </div>

              <div className="mt-5 rounded-xl bg-[#f0f8f4] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b917d]">
                  Closed-loop proof
                </p>

                <p className="mt-2 text-xs leading-5 text-[#4f6f62]">
                  A later independent incident retrieved this newly created memory,
                  diagnosed the same root cause, and recommended the learned repair.
                </p>
              </div>
            </div>
          </div>

          <div className="ff-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e3e8ea] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-[#24313a]">
                  Retrieved memory episodes
                </h2>

                <p className="mt-1 text-xs text-[#87939c]">
                  Ranked by semantic similarity, enriched with verified outcomes
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-[#edf5fb] px-3 py-1.5 text-[10px] font-semibold text-[#3276b1]">
                <Database size={12} />
                Vector index
              </div>
            </div>

            <div className="divide-y divide-[#e6eaed]">
              <MemoryEpisode
                rank="01"
                similarity="0.8670"
                title="Drive-end bearing lubrication breakdown"
                symptoms="Sharp bearing squeal with localized drive-end bearing housing overheating after sustained operation."
                repair="Replace the drive-end bearing and restore manufacturer-specified lubrication."
                outcome="Successful"
                recurrence="No recurrence"
                learned
              />

              <MemoryEpisode
                rank="02"
                similarity="0.7421"
                title="Mechanical seal degradation"
                symptoms="Leakage combined with unstable discharge pressure during normal pump operation."
                repair="Replace damaged mechanical seal and verify alignment."
                outcome="Successful"
                recurrence="No recurrence"
              />

              <MemoryEpisode
                rank="03"
                similarity="0.7168"
                title="Blocked intake filter"
                symptoms="Persistent low flow with stable motor behavior and restricted inlet conditions."
                repair="Clean intake path and replace blocked filter."
                outcome="Successful"
                recurrence="No recurrence"
              />

              <MemoryEpisode
                rank="04"
                similarity="0.6914"
                title="Incorrect hydraulic component replacement"
                symptoms="Pressure-related symptoms previously treated with an unrelated component replacement."
                repair="Pressure control valve replacement"
                outcome="Failed"
                recurrence="Recurrence detected"
                bad
              />
            </div>
          </div>
        </section>

        <section className="mt-6 ff-card p-5 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#87939c]">
                Selected memory
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[#24313a]">
                Learned outcome: bearing overheating
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#75828c]">
                This episode was not part of the original seed history. FIELDfix
                created it after a verified repair outcome.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge text="Verified" />
                <Badge text="Successful outcome" />
                <Badge text="No recurrence" />
                <Badge text="Quality 0.95" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail
                label="Verified root cause"
                value="Drive-end bearing lubrication breakdown"
              />

              <Detail
                label="Approved repair"
                value="Bearing replacement + correct lubrication"
              />

              <Detail
                label="Memory source"
                value="Verified maintenance outcome"
              />

              <Detail
                label="Retrieval result"
                value="Rank #1 · similarity 0.867"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#e0e6e9] bg-[#f8fafb] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#87939c]">
              Learned lesson
            </p>

            <p className="mt-2 text-sm leading-6 text-[#4f5d67]">
              When a pump develops bearing squeal together with localized
              bearing-housing overheating, inspect bearing condition and
              lubrication before replacing hydraulic components.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof BrainCircuit;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="ff-card p-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-[#edf5fb] text-[#3276b1]">
        <Icon size={17} />
      </div>

      <p className="mt-4 text-xs text-[#74818b]">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1c2932]">
        {value}
      </p>

      <p className="mt-1.5 text-[10px] text-[#929ca4]">{helper}</p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div className="absolute left-[7px] top-4 h-[calc(100%+16px)] w-px bg-[#dbe5e0]" />
      )}

      <div className="relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#dff3e9]">
        <div className="size-1.5 rounded-full bg-[#16875f]" />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#3f4c55]">{label}</p>
        <p className="mt-0.5 text-[10px] text-[#849099]">{value}</p>
      </div>
    </div>
  );
}

function MemoryEpisode({
  rank,
  similarity,
  title,
  symptoms,
  repair,
  outcome,
  recurrence,
  learned = false,
  bad = false,
}: {
  rank: string;
  similarity: string;
  title: string;
  symptoms: string;
  repair: string;
  outcome: string;
  recurrence: string;
  learned?: boolean;
  bad?: boolean;
}) {
  return (
    <article className={learned ? "bg-[#fbfefc] p-5 sm:p-6" : "p-5 sm:p-6"}>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto]">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#f0f3f5] font-mono text-[10px] font-semibold text-[#76838d]">
          {rank}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {bad ? (
              <TriangleAlert size={15} className="text-[#c74949]" />
            ) : (
              <CheckCircle2 size={15} className="text-[#16875f]" />
            )}

            <h3 className="text-sm font-semibold text-[#2a3740]">{title}</h3>

            {learned && (
              <span className="rounded-full bg-[#eaf8f2] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#16875f]">
                Newly learned
              </span>
            )}
          </div>

          <p className="mt-2 text-[11px] leading-5 text-[#7a8790]">
            {symptoms}
          </p>

          <div className="mt-3 flex items-start gap-2">
            <Activity size={13} className="mt-0.5 shrink-0 text-[#8a969f]" />

            <p className="text-[10px] leading-5 text-[#596771]">
              {repair}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[9px] font-semibold",
                bad
                  ? "bg-[#fff0f0] text-[#b94545]"
                  : "bg-[#eaf8f2] text-[#16875f]",
              ].join(" ")}
            >
              {outcome}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-[9px] font-semibold",
                bad
                  ? "bg-[#fff0f0] text-[#b94545]"
                  : "bg-[#f0f3f5] text-[#66737d]",
              ].join(" ")}
            >
              {recurrence}
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#949ea5]">
            Similarity
          </p>

          <p
            className={[
              "mt-1 font-mono text-sm font-semibold",
              learned ? "text-[#16875f]" : "text-[#52606a]",
            ].join(" ")}
          >
            {similarity}
          </p>

          <ArrowUpRight
            size={14}
            className="mt-3 text-[#a0aab1] sm:ml-auto"
          />
        </div>
      </div>
    </article>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#eef5f1] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-[#39735e]">
      {text}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e6e9] bg-[#fafbfb] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#919ba3]">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#46535c]">
        {value}
      </p>
    </div>
  );
}

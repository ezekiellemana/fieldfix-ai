import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "memory";
}) {
  const tones = {
    neutral:
      "bg-[#f1f4f6] text-[#52616c]",
    success:
      "bg-[#eaf8f2] text-[#16875f]",
    warning:
      "bg-[#fff5df] text-[#b47816]",
    memory:
      "bg-[#edf5fb] text-[#3276b1]",
  };

  return (
    <div className="ff-card p-5">
      <div className="mb-5 flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={19} strokeWidth={2} />
        </div>

        <span className="rounded-full bg-[#f4f6f7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#76838d]">
          Live
        </span>
      </div>

      <p className="text-sm text-[#71808b]">
        {label}
      </p>

      <div className="mt-1.5 flex items-end gap-2">
        <p className="text-[30px] font-semibold tracking-[-0.04em] text-[#16212a]">
          {value}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#8b969f]">
        {helper}
      </p>
    </div>
  );
}

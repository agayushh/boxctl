import type { NodeStatus } from "@/engine/search/types";

const STATUS_LABEL: Record<NodeStatus, string> = {
  discovered: "Discovered",
  frontier: "Frontier",
  evaluating: "Current",
  expanded: "Expanded",
  deadlock: "Deadlock",
  pruned: "Pruned",
  solution: "Solution",
};

export function SearchLegend() {
  const items: NodeStatus[] = [
    "frontier",
    "evaluating",
    "expanded",
    "deadlock",
    "pruned",
    "solution",
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
      {items.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <StatusMark status={status} />
          {STATUS_LABEL[status]}
        </li>
      ))}
    </ul>
  );
}

export function StatusMark({ status }: { status: NodeStatus }) {
  const cls =
    status === "evaluating"
      ? "bg-text"
      : status === "frontier"
        ? "border border-blue bg-transparent"
        : status === "solution"
          ? "bg-gold"
          : status === "deadlock"
            ? "bg-rose"
            : status === "pruned"
              ? "border border-faint bg-transparent"
              : "bg-mist/40";
  return (
    <span
      className={[
        "inline-block h-2 w-2",
        status === "deadlock" ? "rotate-45" : "rounded-full",
        cls,
      ].join(" ")}
      aria-hidden
    />
  );
}

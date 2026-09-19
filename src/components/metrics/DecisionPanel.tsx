import { ACTION_GLYPH } from "@/utils/coordinates";
import type { Alternative, SearchNode } from "@/engine/search/types";
import { boxesOnGoals } from "@/engine/sokoban/goals";
import type { Board } from "@/engine/sokoban/types";

type Props = {
  node: SearchNode | null;
  parent: SearchNode | null;
  board: Board;
  reason: string;
  alternatives: Alternative[];
  deadlockReason: string | null;
  explain: boolean;
};

export function DecisionPanel({
  node,
  parent,
  board,
  reason,
  alternatives,
  deadlockReason,
  explain,
}: Props) {
  const why: string[] = [];
  if (node && parent) {
    if (node.h < parent.h) why.push("A box moved closer to its assigned goal.");
    if (node.h > parent.h) why.push("This push increased estimated remaining cost.");
    if (boxesOnGoals(node.state, board) > boxesOnGoals(parent.state, board)) {
      why.push("A box landed on a goal.");
    }
  }
  if (node && !node.deadlock?.detected) why.push("No deadlock detected.");
  if (deadlockReason) why.length = 0;

  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">
        {deadlockReason ? "Why rejected?" : "Why this move?"}
      </h2>
      {node?.action && (
        <p className="mt-2 text-sm text-text">
          Push box {ACTION_GLYPH[node.action]}
        </p>
      )}
      {deadlockReason ? (
        <p className="mt-2 text-sm text-rose">✕ {deadlockReason}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-mute">
          {why.map((line) => (
            <li key={line}>✓ {line}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm leading-relaxed text-text/90">{reason}</p>
      {alternatives.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-faint">Alternatives</p>
          <ul className="mt-1 space-y-1 font-mono text-[12px] text-mute">
            {alternatives.map((alt, index) => (
              <li key={`${alt.nodeId ?? alt.label}-${index}`}>
                {alt.action ? `Push ${ACTION_GLYPH[alt.action]}` : alt.label}
                {alt.f !== undefined ? `  f = ${alt.f}` : ""}
                {alt.status === "deadlock" ? "  DEADLOCK" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {explain && node && (
        <p className="mt-3 text-sm leading-relaxed text-mute">
          g(n) is the cost already paid. h(n) estimates what remains. f(n) = g(n) + h(n).
          The frontier is the set of states still waiting to be evaluated.
        </p>
      )}
    </section>
  );
}

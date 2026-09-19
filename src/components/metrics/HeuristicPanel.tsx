import { matchingDistance } from "@/engine/search/heuristics";
import type { Board } from "@/engine/sokoban/types";
import type { SearchNode } from "@/engine/search/types";
import { unpack } from "@/utils/coordinates";

type Props = {
  board: Board;
  node: SearchNode | null;
  explain: boolean;
};

export function HeuristicPanel({ board, node, explain }: Props) {
  if (!node) {
    return (
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">Current state</h2>
        <p className="mt-2 text-sm text-mute">Waiting for the first search event.</p>
      </section>
    );
  }

  const breakdown = matchingDistance(node.state, board);
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">Current state</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-sm tabular">
        <Metric k="g(n)" v={node.g} d="Path cost" />
        <Metric k="h(n)" v={node.h} d="Heuristic" />
        <Metric k="f(n)" v={node.f} d="Estimated total" />
      </div>
      {explain && (
        <p className="mt-3 text-sm leading-relaxed text-mute">
          h(n) is the minimum-cost assignment of boxes to goals using Manhattan distance.
          It never gives the same goal to two boxes.
        </p>
      )}
      <ul className="mt-3 space-y-1 font-mono text-[11px] text-faint">
        {breakdown.pairs.map((pair) => {
          const box = unpack(pair.box);
          const goal = unpack(pair.goal);
          return (
            <li key={`${pair.box}-${pair.goal}`}>
              box ({box.x},{box.y}) → goal ({goal.x},{goal.y}) · {pair.dist}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Metric({ k, v, d }: { k: string; v: number; d: string }) {
  return (
    <div>
      <div className="text-[11px] text-faint">{d}</div>
      <div className="mt-1 text-text">
        <span className="text-mute">{k}</span> {v}
      </div>
    </div>
  );
}

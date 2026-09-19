import { useMemo } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { useSolver } from "@/hooks/useSolver";
import { usePlayback } from "@/hooks/usePlayback";
import { Board } from "@/components/sokoban/Board";
import { SearchGraph } from "@/components/search/SearchGraph";
import { AlgorithmSelector } from "@/components/controls/AlgorithmSelector";
import { formatInt, formatMs } from "@/utils/statistics";
import type { AlgorithmId } from "@/engine/search/types";
import { ALGORITHMS } from "@/engine/search/solver";

type Props = {
  ascii: string;
  left: AlgorithmId;
  right: AlgorithmId;
  onLeft: (id: AlgorithmId) => void;
  onRight: (id: AlgorithmId) => void;
};

export function Compare({ ascii, left, right, onLeft, onRight }: Props) {
  const parsed = useMemo(() => parseLevel(ascii), [ascii]);
  const a = useSolver(parsed.board, parsed.state, left, `${ascii}|${left}|compare`);
  const b = useSolver(parsed.board, parsed.state, right, `${ascii}|${right}|compare`);
  const playA = usePlayback(a.result, true);
  const playB = usePlayback(b.result, true);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Same puzzle</p>
        <h1 className="mt-1 font-serif text-2xl tracking-tight">Two algorithms, one board.</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Measurements are from this run only. No algorithm is universally better.
        </p>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <Pane
          label={ALGORITHMS.find((item) => item.id === left)?.name ?? left}
          algorithm={left}
          onAlgorithm={onLeft}
          board={parsed.board}
          start={parsed.state}
          result={a.result}
          frame={playA.frame}
        />
        <Pane
          label={ALGORITHMS.find((item) => item.id === right)?.name ?? right}
          algorithm={right}
          onAlgorithm={onRight}
          board={parsed.board}
          start={parsed.state}
          result={b.result}
          frame={playB.frame}
        />
      </div>
    </div>
  );
}

function Pane({
  label,
  algorithm,
  onAlgorithm,
  board,
  start,
  result,
  frame,
}: {
  label: string;
  algorithm: AlgorithmId;
  onAlgorithm: (id: AlgorithmId) => void;
  board: ReturnType<typeof parseLevel>["board"];
  start: ReturnType<typeof parseLevel>["state"];
  result: ReturnType<typeof useSolver>["result"];
  frame: ReturnType<typeof usePlayback>["frame"];
}) {
  const current = frame.currentId ? frame.nodes.get(frame.currentId) : undefined;
  const stats = result?.stats ?? frame.stats;
  return (
    <section className="flex min-h-0 flex-col border-b border-line p-4 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm text-text">{label}</h2>
        <AlgorithmSelector value={algorithm} onChange={onAlgorithm} compact />
      </div>
      <Board board={board} state={current?.state ?? start} maxSize={280} compact />
      <div className="mt-4 min-h-[180px] flex-1">
        <SearchGraph
          nodes={[...frame.nodes.values()]}
          currentId={frame.currentId}
          solutionIds={frame.solution?.pathIds ?? []}
          onSelect={() => undefined}
        />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px] tabular">
        <Stat k="states" v={formatInt(stats.statesGenerated)} />
        <Stat k="moves" v={formatInt(stats.solutionPushes)} />
        <Stat k="time" v={formatMs(stats.elapsedMs)} />
      </dl>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-faint">{k}</dt>
      <dd className="text-text">{v}</dd>
    </div>
  );
}

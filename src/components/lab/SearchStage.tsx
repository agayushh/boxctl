import { useMemo } from "react";
import { Board } from "@/components/sokoban/Board";
import { SearchGraph } from "@/components/search/SearchGraph";
import { SolverControls } from "@/components/controls/SolverControls";
import { SearchMetrics } from "@/components/metrics/SearchMetrics";
import { HeuristicPanel } from "@/components/metrics/HeuristicPanel";
import { DecisionPanel } from "@/components/metrics/DecisionPanel";
import type { AlgorithmId, SearchNode, SearchProgress, SolverResult } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { PlaybackFrame } from "@/visualization/search/SearchState";
import { ACTION_GLYPH } from "@/utils/coordinates";

type Props = {
  board: SokobanBoard;
  start: SokobanState;
  algorithm: AlgorithmId;
  onAlgorithm: (id: AlgorithmId) => void;
  result: SolverResult | null;
  status: string;
  frame: PlaybackFrame;
  playing: boolean;
  speed: number;
  cursor: number;
  eventCount: number;
  onToggle: () => void;
  onRestart: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSpeed: (value: number) => void;
  onSeek: (value: number) => void;
  onSelectNode: (id: string) => void;
  explain: boolean;
  subtitle?: string;
  cinema?: boolean;
  compact?: boolean;
  overrideState?: SokobanState | null;
  liveStats?: SearchProgress | null;
  focusId?: string | null;
  highlight?: number[];
};

export function SearchStage(props: Props) {
  const current = currentNode(props.frame, props.result, props.focusId);
  const parent = current?.parentId ? props.frame.nodes.get(current.parentId) ?? null : null;
  const display = props.overrideState ?? current?.state ?? props.start;
  const solutionIds = props.frame.solution?.pathIds ?? [];
  const highlight = props.highlight ?? current?.deadlock?.affectedBoxes ?? [];
  const live = props.status === "running";
  const liveStats = live
    ? {
        ...props.frame.stats,
        algorithm: props.algorithm,
        ...props.liveStats,
      }
    : (props.result?.stats ?? props.frame.stats);
  const focusId = props.focusId ?? props.frame.currentId;

  const nodes = useMemo(() => [...props.frame.nodes.values()], [props.frame.nodes]);
  const algoName = props.algorithm === "astar" ? "A*" : props.algorithm.toUpperCase();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className={`grid min-h-0 flex-1 ${props.cinema ? "lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]" : "lg:grid-cols-[minmax(260px,0.74fr)_minmax(0,1.26fr)]"}`}>
        <section className="relative flex min-h-0 flex-col justify-center border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            {live ? `${algoName} searching` : algoName}
            {current ? ` · g ${current.g} · h ${current.h} · f ${current.f}` : ""}
            {current?.action ? ` · ${ACTION_GLYPH[current.action]}` : ""}
          </p>
          <Board
            board={props.board}
            state={display}
            maxSize={props.cinema ? 520 : props.compact ? 280 : 420}
            highlight={highlight}
            compact={props.compact}
          />
          {props.subtitle && (
            <p className="mt-4 max-w-sm text-sm text-mute">{props.subtitle}</p>
          )}
        </section>
        <section className="min-h-[240px] min-h-0 overflow-hidden p-4 sm:p-6">
          <SearchGraph
            nodes={nodes}
            currentId={focusId}
            solutionIds={solutionIds}
            onSelect={props.onSelectNode}
            compact={props.cinema}
            emptyHint={
              live
                ? "The tree grows as states are expanded."
                : "Each node is a box push. Play to watch the tree unfold."
            }
          />
        </section>
      </div>
      {!props.cinema && (
        <div className="shrink-0 border-t border-line">
          <div className="flex flex-col gap-3 p-4 sm:px-6 sm:py-3">
            <SolverControls
              algorithm={props.algorithm}
              onAlgorithm={props.onAlgorithm}
              playing={props.playing}
              speed={props.speed}
              cursor={props.cursor}
              eventCount={props.eventCount}
              onToggle={props.onToggle}
              onRestart={props.onRestart}
              onNext={props.onNext}
              onPrev={props.onPrev}
              onSpeed={props.onSpeed}
              onSeek={props.onSeek}
              loading={live}
            />
          </div>
          <details className="border-t border-line px-4 py-3 sm:px-6">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-faint">
              Why this state
            </summary>
            <div className="mt-4 grid gap-8 lg:grid-cols-3">
              <SearchMetrics stats={liveStats} live={live} />
              <HeuristicPanel board={props.board} node={current} explain={props.explain} />
              <DecisionPanel
                node={current}
                parent={parent}
                board={props.board}
                reason={props.frame.reason}
                alternatives={props.frame.alternatives}
                deadlockReason={props.frame.deadlockReason}
                explain={props.explain}
              />
            </div>
          </details>
        </div>
      )}
      {props.cinema && (
        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-mute">
          <span>{algoName} expanding the push graph</span>
          <span className="font-mono tabular">{liveStats.statesExpanded} states</span>
        </div>
      )}
    </div>
  );
}

function currentNode(
  frame: PlaybackFrame,
  result: SolverResult | null,
  focusId?: string | null,
): SearchNode | null {
  const id = focusId ?? frame.currentId;
  if (!id) return null;
  return frame.nodes.get(id) ?? result?.nodes.find((node) => node.id === id) ?? null;
}

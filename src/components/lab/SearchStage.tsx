import { useMemo } from "react";
import { Board } from "@/components/sokoban/Board";
import { SearchGraph } from "@/components/search/SearchGraph";
import { SolverControls } from "@/components/controls/SolverControls";
import { SearchMetrics } from "@/components/metrics/SearchMetrics";
import { HeuristicPanel } from "@/components/metrics/HeuristicPanel";
import { DecisionPanel } from "@/components/metrics/DecisionPanel";
import type { AlgorithmId, SearchNode, SolverResult } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { PlaybackFrame } from "@/visualization/search/SearchState";

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
  title?: string;
  subtitle?: string;
  cinema?: boolean;
  compact?: boolean;
  overrideState?: SokobanState | null;
};

export function SearchStage(props: Props) {
  const current = currentNode(props.frame, props.result);
  const parent = current?.parentId ? props.frame.nodes.get(current.parentId) ?? null : null;
  const display = props.overrideState ?? current?.state ?? props.start;
  const solutionIds = props.frame.solution?.pathIds ?? [];
  const highlight = current?.deadlock?.affectedBoxes ?? [];
  const live = props.status === "running";

  const nodes = useMemo(() => [...props.frame.nodes.values()], [props.frame.nodes]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className={`grid min-h-0 flex-1 ${props.cinema ? "" : "md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"}`}>
        <section className="flex min-h-0 flex-col justify-center border-b border-line p-4 sm:p-6 md:border-b-0 md:border-r">
          {props.title && (
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-faint">{props.title}</p>
              {props.subtitle && <p className="mt-1 text-sm text-mute">{props.subtitle}</p>}
            </div>
          )}
          <Board
            board={props.board}
            state={display}
            maxSize={props.cinema ? 560 : props.compact ? 280 : 480}
            highlight={highlight}
            compact={props.compact}
          />
        </section>
        <section className="min-h-[220px] min-h-0 overflow-hidden p-4 sm:p-6">
          <SearchGraph
            nodes={nodes}
            currentId={props.frame.currentId}
            solutionIds={solutionIds}
            onSelect={props.onSelectNode}
            compact={props.cinema}
          />
        </section>
      </div>
      {!props.cinema && (
        <div className="grid max-h-[40vh] shrink-0 gap-6 overflow-auto border-t border-line p-4 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]">
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
          <SearchMetrics stats={live ? props.frame.stats : (props.result?.stats ?? props.frame.stats)} live={live} />
          <div className="grid gap-6">
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
        </div>
      )}
      {props.cinema && (
        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-mute">
          <span>
            Watching {props.algorithm.toUpperCase()} solve Sokoban
          </span>
          <span className="font-mono tabular">
            {props.frame.stats.statesExpanded} states expanded
          </span>
        </div>
      )}
    </div>
  );
}

function currentNode(frame: PlaybackFrame, result: SolverResult | null): SearchNode | null {
  if (!frame.currentId) return null;
  return frame.nodes.get(frame.currentId) ?? result?.nodes.find((node) => node.id === frame.currentId) ?? null;
}

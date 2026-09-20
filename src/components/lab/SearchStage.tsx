import { Board } from "@/components/sokoban/Board";
import { SolverControls } from "@/components/controls/SolverControls";
import { StoryGraph } from "@/components/search/StoryGraph";
import { narrate } from "@/visualization/story/narrate";
import { layoutStory } from "@/visualization/story/layoutStory";
import { isSolved } from "@/engine/sokoban/goals";
import { formatInt, formatMs } from "@/utils/statistics";
import { ACTION_GLYPH } from "@/utils/coordinates";
import type { Action } from "@/utils/coordinates";
import type { AlgorithmId, SearchProgress, SolutionStep, SolverResult } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { TrailSegment } from "@/components/sokoban/PathTrail";
import { useMemo } from "react";

const EMPTY_STEPS: SolutionStep[] = [];
const NAMES: Record<AlgorithmId, string> = {
  astar: "A*",
  bfs: "BFS",
  greedy: "Greedy",
  idastar: "A*",
  beam: "A*",
};

type Props = {
  board: SokobanBoard;
  algorithm: AlgorithmId;
  requestedAlgorithm?: AlgorithmId;
  onAlgorithm: (id: AlgorithmId) => void;
  result: SolverResult | null;
  status: string;
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
  cinema?: boolean;
  display: SokobanState;
  frames: SokobanState[];
  highlight?: number[];
  trail?: TrailSegment[];
  liveStats?: SearchProgress | null;
  action?: Action;
  steps?: SolutionStep[];
  awaiting?: boolean;
};

export function SearchStage(props: Props) {
  const awaiting =
    props.awaiting ?? (props.status === "idle" || props.status === "running");
  const steps = props.steps ?? props.result?.solution?.steps ?? EMPTY_STEPS;
  const pushes = props.result?.solution?.pushes.length;
  const stats = props.result?.stats;
  const glyph = props.action ? ACTION_GLYPH[props.action] : "";
  const solved = isSolved(props.display, props.board);
  const requested = props.requestedAlgorithm ?? props.algorithm;
  const story = useMemo(
    () => layoutStory(props.board, props.frames, steps, props.cursor, props.algorithm),
    [props.board, props.frames, steps, props.cursor, props.algorithm],
  );
  const current = story.nodes.find((node) => node.current);
  const copy = narrate({
    algorithm: props.algorithm,
    index: props.cursor,
    total: props.frames.length,
    frontierCount: story.frontierCount,
    searching: awaiting,
    solved: !awaiting && solved,
    g: current?.g ?? props.cursor,
    h: current?.h ?? 0,
    f: current?.f ?? 0,
  });
  const fallback =
    !awaiting && requested !== props.algorithm
      ? `Playing ${NAMES[props.algorithm]}’s path while ${NAMES[requested]} keeps looking for a shorter one.`
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
        <section className="relative flex min-h-0 flex-col justify-center border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            {copy.kicker}
            {pushes != null && !awaiting ? ` · ${pushes} pushes` : ""}
            {glyph ? ` · ${glyph}` : ""}
          </p>
          <Board
            board={props.board}
            state={props.display}
            maxSize={props.cinema ? 520 : 420}
            highlight={props.highlight}
            trail={props.trail}
            trailIndex={props.cursor}
            trailKeep={18}
          />
          <div className="mt-5 max-w-lg">
            <h2 className="font-serif text-xl tracking-tight text-text sm:text-2xl">{copy.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{copy.body}</p>
            {fallback ? <p className="mt-2 text-sm text-gold">{fallback}</p> : null}
            {awaiting && props.liveStats ? (
              <p className="mt-2 font-mono text-[11px] tabular text-faint">
                {formatInt(props.liveStats.statesExpanded)} states so far
                {props.liveStats.elapsedMs != null ? ` · ${formatMs(props.liveStats.elapsedMs)}` : ""}
              </p>
            ) : null}
          </div>
        </section>
        <section className="min-h-0 overflow-hidden p-4 sm:p-6">
          <StoryGraph
            board={props.board}
            frames={props.frames}
            steps={steps}
            index={props.cursor}
            algorithm={props.algorithm}
            onSelect={props.onSeek}
            compact={props.cinema}
          />
        </section>
      </div>
      <div className={["shrink-0 border-t border-line", props.cinema ? "bg-void px-6 py-3" : "p-4 sm:px-6 sm:py-3"].join(" ")}>
        <SolverControls
          algorithm={requested}
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
          loading={awaiting}
          ready={props.eventCount > 1}
        />
        {stats && !awaiting && (
          <p className="mt-3 font-mono text-[11px] tabular text-faint">
            {formatInt(stats.statesExpanded)} states searched · {formatMs(stats.elapsedMs)}
            {stats.playerMoves != null ? ` · ${formatInt(stats.playerMoves)} steps` : ""}
            {props.result?.failedReason ? ` · ${props.result.failedReason}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

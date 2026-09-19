import { Board } from "@/components/sokoban/Board";
import { SolverControls } from "@/components/controls/SolverControls";
import { StoryGraph } from "@/components/search/StoryGraph";
import { DsaGuide } from "@/components/search/DsaGuide";
import { narrate } from "@/visualization/story/narrate";
import { layoutStory } from "@/visualization/story/layoutStory";
import { isSolved } from "@/engine/sokoban/goals";
import { formatInt, formatMs } from "@/utils/statistics";
import { ACTION_GLYPH } from "@/utils/coordinates";
import type { Action } from "@/utils/coordinates";
import type { AlgorithmId, SearchProgress, SolverResult } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { TrailSegment } from "@/components/sokoban/PathTrail";
import { useMemo } from "react";

type Props = {
  board: SokobanBoard;
  algorithm: AlgorithmId;
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
};

export function SearchStage(props: Props) {
  const live = props.status === "running";
  const steps = props.result?.solution?.steps ?? [];
  const pushes = props.result?.solution?.pushes.length;
  const stats = props.result?.stats;
  const glyph = props.action ? ACTION_GLYPH[props.action] : "";
  const solved = isSolved(props.display, props.board);
  const story = useMemo(
    () => layoutStory(props.board, props.frames, steps, props.cursor),
    [props.board, props.frames, steps, props.cursor],
  );
  const current = story.nodes.find((node) => node.current);
  const speech = narrate({
    algorithm: props.algorithm,
    index: props.cursor,
    total: props.frames.length,
    frontierCount: story.frontierCount,
    searching: live,
    solved,
    g: current?.g ?? props.cursor,
    h: current?.h ?? 0,
    f: current?.f ?? 0,
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
        <section className="relative flex min-h-0 flex-col justify-center border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            {speech.kicker}
            {pushes != null && !live ? ` · ${pushes} pushes` : ""}
            {glyph ? ` · ${glyph}` : ""}
          </p>
          <Board
            board={props.board}
            state={props.display}
            maxSize={props.cinema ? 520 : 440}
            highlight={props.highlight}
            trail={props.trail}
            trailIndex={props.cursor}
            trailKeep={24}
          />
          <div className="mt-5 max-w-lg">
            <h2 className="font-serif text-2xl tracking-tight text-text sm:text-[1.7rem]">{speech.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{speech.body}</p>
          </div>
        </section>
        <section className="min-h-[260px] min-h-0 overflow-hidden p-4 sm:p-6">
          {live ? (
            <div className="grid h-full place-items-center text-center">
              <p className="max-w-sm text-sm text-mute">
                Building the graph of possible snapshots
                {props.liveStats
                  ? ` · ${formatInt(props.liveStats.statesExpanded)} states expanded`
                  : "…"}
              </p>
            </div>
          ) : (
            <StoryGraph
              board={props.board}
              frames={props.frames}
              steps={steps}
              index={props.cursor}
              onSelect={props.onSeek}
              compact={props.cinema}
            />
          )}
        </section>
      </div>
      {!props.cinema && (
        <div className="shrink-0 border-t border-line">
          <div className="p-4 sm:px-6 sm:py-3">
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
            {stats && !live && (
              <p className="mt-3 font-mono text-[11px] tabular text-faint">
                {formatInt(stats.statesExpanded)} states searched · {formatMs(stats.elapsedMs)}
                {stats.playerMoves != null ? ` · ${formatInt(stats.playerMoves)} steps` : ""}
              </p>
            )}
          </div>
          <div className="border-t border-line px-4 py-3 sm:px-6">
            <DsaGuide focus={speech.focus} algorithm={props.algorithm} />
          </div>
        </div>
      )}
      {props.cinema && (
        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4 text-sm text-mute">
          <span>{speech.title}</span>
          <span className="font-mono tabular text-faint">
            {pushes != null ? `${pushes} pushes` : live ? "searching" : "no route"}
          </span>
        </div>
      )}
    </div>
  );
}

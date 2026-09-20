import { Board } from "@/components/sokoban/Board";
import { PlaybackControls } from "@/components/controls/PlaybackControls";
import { useSolver } from "@/hooks/useSolver";
import { replaySteps, trailFromSteps, useSharedClock } from "@/hooks/useSolutionPlayback";
import { rankRoutes } from "@/utils/rankRoutes";
import { formatInt, formatMs } from "@/utils/statistics";
import { ALGORITHMS } from "@/engine/search/solver";
import type { AlgorithmId, SolutionStep } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { SolvedRun } from "@/hooks/useProgress";
import { useMemo } from "react";

type Props = {
  board: SokobanBoard;
  start: SokobanState;
  ascii: string;
  yours?: SolvedRun;
};

const INSTANT = { instant: true as const };

export function Compare({ board, start, ascii, yours }: Props) {
  const astar = useSolver(board, start, "astar", `${ascii}|astar|viz`, true, INSTANT);
  const bfs = useSolver(board, start, "bfs", `${ascii}|bfs|viz`, true, INSTANT);
  const greedy = useSolver(board, start, "greedy", `${ascii}|greedy|viz`, true, INSTANT);

  const youSteps = yours?.steps;
  const youFrames = useMemo(() => replaySteps(start, youSteps ?? []), [start, youSteps]);
  const astarSteps = astar.result?.solution?.steps;
  const bfsSteps = bfs.result?.solution?.steps;
  const greedySteps = greedy.result?.solution?.steps;
  const astarFrames = useMemo(() => replaySteps(start, astarSteps ?? []), [start, astarSteps]);
  const bfsFrames = useMemo(() => replaySteps(start, bfsSteps ?? []), [start, bfsSteps]);
  const greedyFrames = useMemo(() => replaySteps(start, greedySteps ?? []), [start, greedySteps]);

  const clockLength = Math.max(youFrames.length, astarFrames.length, bfsFrames.length, greedyFrames.length, 1);
  const searching =
    astar.status === "idle" ||
    astar.status === "running" ||
    bfs.status === "idle" ||
    bfs.status === "running" ||
    greedy.status === "idle" ||
    greedy.status === "running";
  const clock = useSharedClock(
    clockLength,
    !searching && clockLength > 1,
    `${ascii}:${clockLength}:${youFrames.length}:${astarFrames.length}:${bfsFrames.length}:${greedyFrames.length}`,
    true,
  );

  const cards: CardModel[] = [
    {
      id: "you",
      name: "You",
      status: yours ? "done" : "idle",
      steps: youSteps ?? [],
      pushes: yours?.pushes ?? null,
      moves: yours?.moves ?? null,
      elapsedMs: null,
      frames: youFrames,
      expanded: undefined,
      empty: !yours || !youSteps?.length,
      emptyLabel: yours
        ? "This saved run has no path to replay. Play the level again."
        : "Solve it in Play to drop your route here.",
    },
    toCard("astar", astar, astarFrames),
    toCard("bfs", bfs, bfsFrames),
    toCard("greedy", greedy, greedyFrames),
  ];

  const ranked = rankRoutes(cards);
  const rankedById = new Map(ranked.map((item) => [item.id, item]));
  const pushWinner = ranked.find((item) => item.fewestPushes);
  const walkWinner = ranked.find((item) => item.fewestWalks);
  const astarCard = cards.find((card) => card.id === "astar");
  const samePushesDifferentWalk =
    yours != null &&
    astarCard?.pushes != null &&
    yours.pushes === astarCard.pushes &&
    yours.moves != null &&
    astarCard.moves != null &&
    yours.moves !== astarCard.moves;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-line px-4 py-3 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Compare</p>
        <h1 className="mt-1 font-serif text-xl tracking-tight">You, A*, BFS, and Greedy.</h1>
        <p className="mt-1 max-w-2xl text-xs text-mute">
          Four boards, one clock. Gold is fewest box pushes.
          {samePushesDifferentWalk
            ? ` You and A* tied on pushes (${yours.pushes}) but took different routes.`
            : ""}
          {pushWinner ? ` Fewest pushes: ${pushWinner.name}.` : ""}
          {walkWinner && walkWinner.id !== pushWinner?.id ? ` Fewest steps: ${walkWinner.name}.` : ""}
        </p>
        {!yours && (
          <p className="mt-1 text-xs text-gold">Play the level first to record your route.</p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2 md:grid-rows-2">
          {cards.map((card) => {
            const marks = rankedById.get(card.id);
            const fewestPushes = Boolean(marks?.fewestPushes);
            const fewestWalks = Boolean(marks?.fewestWalks);
            const index = Math.min(clock.index, Math.max(0, card.frames.length - 1));
            const step = card.steps[Math.max(0, index - 1)];
            return (
              <article
                key={card.id}
                className={[
                  "flex min-h-0 flex-col overflow-hidden rounded-2xl border p-3",
                  fewestPushes ? "border-gold/50 bg-gold/5" : "border-line bg-canvas",
                ].join(" ")}
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-sm text-text">
                      {card.name}
                      {fewestPushes ? (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-gold">
                          fewest pushes
                        </span>
                      ) : null}
                      {fewestWalks ? (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-blue">
                          fewest steps
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-faint">{ruleFor(card.id)}</p>
                  </div>
                  <p className="font-mono text-xs tabular text-mute">
                    {card.id !== "you" && (card.status === "idle" || card.status === "running")
                      ? "searching"
                      : card.pushes == null
                        ? card.id === "you"
                          ? "unplayed"
                        : "limit"
                        : `${formatInt(card.pushes)} pushes`}
                  </p>
                </div>
                {card.empty ? (
                  <p className="grid min-h-0 flex-1 place-items-center text-center text-sm text-mute">
                    {card.emptyLabel}
                  </p>
                ) : card.id !== "you" && (card.status === "idle" || card.status === "running") ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
                    <Board board={board} state={start} maxSize={260} compact />
                    <p className="text-center text-xs text-mute">
                      {card.name} is searching
                      {card.expanded != null ? ` · ${formatInt(card.expanded)} states` : "…"}
                    </p>
                  </div>
                ) : card.pushes == null ? (
                  <p className="grid min-h-0 flex-1 place-items-center text-center text-sm text-mute">
                    Search hit its limit. The level is still playable.
                  </p>
                ) : (
                  <div className="min-h-0 flex-1">
                    <Board
                      board={board}
                      state={card.frames[index] ?? start}
                      maxSize={260}
                      compact
                      trail={trailFromSteps(card.steps)}
                      trailIndex={index}
                      trailKeep={10}
                      highlight={step && index > 0 ? [step.pushedFrom, step.pushedTo] : []}
                    />
                  </div>
                )}
                <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px] tabular">
                  <Stat k="pushes" v={formatInt(card.pushes)} done={fewestPushes} />
                  <Stat k="steps" v={formatInt(card.moves)} done={fewestWalks} accent="walks" />
                  <Stat
                    k={card.id === "you" ? "saved" : "time"}
                    v={
                      card.id === "you"
                        ? yours
                          ? "yes"
                          : "no"
                        : card.elapsedMs == null
                          ? "—"
                          : formatMs(card.elapsedMs)
                    }
                  />
                </dl>
              </article>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-void px-4 py-3 sm:px-6">
        <PlaybackControls
          playing={clock.playing}
          speed={clock.speed}
          cursor={clock.index}
          eventCount={clockLength}
          onToggle={clock.toggle}
          onRestart={clock.restart}
          onNext={clock.next}
          onPrev={clock.prev}
          onSpeed={clock.setSpeed}
          onSeek={clock.setCursor}
        />
      </div>
    </div>
  );
}

type SolverHook = ReturnType<typeof useSolver>;

type CardModel = {
  id: string;
  name: string;
  status: string;
  steps: SolutionStep[];
  pushes: number | null;
  moves: number | null;
  elapsedMs: number | null;
  frames: SokobanState[];
  expanded?: number;
  empty?: boolean;
  emptyLabel?: string;
};

function ruleFor(id: string): string {
  if (id === "you") return "Your saved route";
  if (id === "bfs") return "Oldest state first";
  if (id === "greedy") return "Smallest leftover guess";
  if (id === "astar") return "Smallest f = g + h";
  return "";
}

function toCard(id: AlgorithmId, hook: SolverHook, frames: SokobanState[]): CardModel {
  const name = ALGORITHMS.find((item) => item.id === id)?.name ?? id;
  return {
    id,
    name,
    status: hook.status,
    steps: hook.result?.solution?.steps ?? [],
    pushes: hook.result?.stats.solutionPushes ?? null,
    moves: hook.result?.stats.playerMoves ?? null,
    elapsedMs: hook.result ? hook.result.stats.elapsedMs : null,
    frames,
    expanded: hook.progress?.statesExpanded,
  };
}

function Stat({
  k,
  v,
  done,
  accent,
}: {
  k: string;
  v: string;
  done?: boolean;
  accent?: "walks";
}) {
  return (
    <div>
      <dt className="text-faint">{k}</dt>
      <dd className={done ? (accent === "walks" ? "text-blue" : "text-gold") : "text-text"}>{v}</dd>
    </div>
  );
}

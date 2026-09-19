import { Board } from "@/components/sokoban/Board";
import { useSolver } from "@/hooks/useSolver";
import { trailFromSteps, useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { rankRoutes } from "@/utils/rankRoutes";
import { formatInt, formatMs } from "@/utils/statistics";
import { ALGORITHMS } from "@/engine/search/solver";
import type { AlgorithmId, SolutionStep } from "@/engine/search/types";
import type { Board as SokobanBoard, SokobanState } from "@/engine/sokoban/types";
import type { SolvedRun } from "@/hooks/useProgress";

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
  const youPlay = useSolutionPlayback(start, youSteps, Boolean(youSteps?.length), "fast", true);
  const astarPlay = useSolutionPlayback(
    start,
    astar.result?.solution?.steps,
    astar.status === "done" && Boolean(astar.result?.solution),
    "fast",
    true,
  );
  const bfsPlay = useSolutionPlayback(
    start,
    bfs.result?.solution?.steps,
    bfs.status === "done" && Boolean(bfs.result?.solution),
    "fast",
    true,
  );
  const greedyPlay = useSolutionPlayback(
    start,
    greedy.result?.solution?.steps,
    greedy.status === "done" && Boolean(greedy.result?.solution),
    "fast",
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
      play: youPlay,
      empty: !yours || !youSteps?.length,
      emptyLabel: yours
        ? "This saved run has no path to replay. Play the level again."
        : "Solve it in Play to drop your route here.",
    },
    toCard("astar", astar, astarPlay),
    toCard("bfs", bfs, bfsPlay),
    toCard("greedy", greedy, greedyPlay),
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
      <div className="shrink-0 border-b border-line px-4 py-4 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Compare</p>
        <h1 className="mt-1 font-serif text-2xl tracking-tight">You, A*, BFS, and Greedy.</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Three searches worth watching. A* uses a priority queue (f = g + h). BFS uses a plain
          queue. Greedy chases the heuristic only. Gold is fewest box pushes — that is what
          these algorithms search. Steps are how far the person walked.
          {samePushesDifferentWalk
            ? ` You and A* tied on pushes (${yours.pushes}) but took different routes — A* does not minimize walking.`
            : ""}
          {pushWinner ? ` Fewest pushes: ${pushWinner.name}.` : ""}
          {walkWinner && walkWinner.id !== pushWinner?.id ? ` Fewest steps: ${walkWinner.name}.` : ""}
        </p>
        {!yours && (
          <p className="mt-2 text-xs text-gold">Play the level first to record your route.</p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const marks = rankedById.get(card.id);
            const fewestPushes = Boolean(marks?.fewestPushes);
            const fewestWalks = Boolean(marks?.fewestWalks);
            const play = card.play;
            return (
              <article
                key={card.id}
                className={[
                  "rounded-2xl border p-4",
                  fewestPushes ? "border-gold/50 bg-gold/5" : "border-line bg-canvas",
                ].join(" ")}
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
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
                  <p className="font-mono text-xs tabular text-mute">
                    {card.id !== "you" && (card.status === "idle" || card.status === "running")
                      ? "searching"
                      : card.pushes == null
                        ? card.id === "you"
                          ? "unplayed"
                          : "no route"
                        : `${formatInt(card.pushes)} pushes`}
                  </p>
                </div>
                {card.empty ? (
                  <p className="grid min-h-[200px] place-items-center text-center text-sm text-mute">
                    {card.emptyLabel}
                  </p>
                ) : card.id !== "you" && (card.status === "idle" || card.status === "running") ? (
                  <p className="grid min-h-[200px] place-items-center text-center text-sm text-mute">
                    Searching with {card.name}…
                  </p>
                ) : card.pushes == null ? (
                  <p className="grid min-h-[200px] place-items-center text-center text-sm text-mute">
                    No route inside this search budget.
                  </p>
                ) : (
                  <Board
                    board={board}
                    state={play.state}
                    maxSize={340}
                    compact
                    trail={trailFromSteps(card.steps)}
                    trailIndex={play.index}
                    trailKeep={10}
                    highlight={play.highlight}
                  />
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
    </div>
  );
}

type Playback = ReturnType<typeof useSolutionPlayback>;
type SolverHook = ReturnType<typeof useSolver>;

type CardModel = {
  id: string;
  name: string;
  status: string;
  steps: SolutionStep[];
  pushes: number | null;
  moves: number | null;
  elapsedMs: number | null;
  play: Playback;
  empty?: boolean;
  emptyLabel?: string;
};

function toCard(id: AlgorithmId, hook: SolverHook, play: Playback): CardModel {
  const name = ALGORITHMS.find((item) => item.id === id)?.name ?? id;
  return {
    id,
    name,
    status: hook.status,
    steps: hook.result?.solution?.steps ?? [],
    pushes: hook.result?.stats.solutionPushes ?? null,
    moves: hook.result?.stats.playerMoves ?? null,
    elapsedMs: hook.result ? hook.result.stats.elapsedMs : null,
    play,
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

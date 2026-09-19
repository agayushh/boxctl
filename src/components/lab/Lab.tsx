import { useEffect, useMemo, useState } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { useSokoban } from "@/hooks/useSokoban";
import { useSolver } from "@/hooks/useSolver";
import { usePlayback } from "@/hooks/usePlayback";
import { useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { SearchStage } from "@/components/lab/SearchStage";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useProgress } from "@/hooks/useProgress";
import { Board } from "@/components/sokoban/Board";
import { LevelSelect } from "@/components/campaign/LevelSelect";
import { LevelComplete } from "@/components/campaign/LevelComplete";
import { CAMPAIGN_STATS, asDefinition, campaignAscii, levelByNumber, levels } from "@/levels";
import { formatInt, formatMs } from "@/utils/statistics";
import type { AlgorithmId } from "@/engine/search/types";
import type { LevelDefinition } from "@/engine/sokoban/types";

export type PlayMode = "play" | "watch" | "compare";

type Props = {
  levelId: string;
  ascii?: string | null;
  algorithm: AlgorithmId;
  mode: PlayMode;
  cinema?: boolean;
  onAlgorithm: (id: AlgorithmId) => void;
  onLevel: (level: LevelDefinition) => void;
  onMode: (mode: PlayMode) => void;
};

export function Lab({
  levelId,
  ascii: asciiOverride,
  algorithm,
  mode,
  cinema,
  onAlgorithm,
  onLevel,
  onMode,
}: Props) {
  const numeric = Number(levelId);
  const campaign = Number.isInteger(numeric) && numeric >= 1 && numeric <= 60;
  const level = levelByNumber(campaign ? numeric : 1);
  const ascii = asciiOverride ?? campaignAscii(level);
  const parsed = useMemo(() => parseLevel(ascii), [ascii]);
  const game = useSokoban(parsed.board, parsed.state);
  const { progress, markSolved, solvedCount } = useProgress();
  const [selector, setSelector] = useState(false);
  const [complete, setComplete] = useState(false);

  const watching = cinema || mode === "watch";
  const { result, status, progress: searchProgress } = useSolver(
    parsed.board,
    parsed.state,
    algorithm,
    `${ascii}|${algorithm}`,
    watching || mode === "compare",
  );
  const search = usePlayback(result, watching);
  const route = useSolutionPlayback(parsed.state, result, false);
  const [watchView, setWatchView] = useState<"search" | "path">("search");

  useEffect(() => {
    setComplete(false);
    setWatchView("search");
  }, [level.id, ascii, algorithm]);

  useEffect(() => {
    if (!watching || !result?.solution) return;
    if (watchView !== "search") return;
    if (search.playing || search.eventCount === 0) return;
    if (search.cursor < search.eventCount - 1) return;
    setWatchView("path");
  }, [watching, result, watchView, search.playing, search.cursor, search.eventCount]);

  useEffect(() => {
    if (watchView === "path") route.restart();
    // Restart only when the watch phase changes, not on every route identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchView]);

  useEffect(() => {
    if (mode === "play" && campaign && game.solved) {
      markSolved(level.id, { pushes: game.pushes, moves: game.moves });
      setComplete(true);
    }
  }, [game.solved, mode, campaign, game.pushes, game.moves, level.id, markSolved]);

  const go = (nextId: number) => {
    const next = levelByNumber(Math.min(60, Math.max(1, nextId)));
    onLevel(asDefinition(next));
  };

  useKeyboard({
    enabled: !selector && !cinema,
    onMove: mode === "play" ? game.move : undefined,
    onToggle: watching ? (watchView === "path" ? route.toggle : search.toggle) : undefined,
    onReset: () => {
      game.reset();
      search.restart();
      route.restart();
    },
    onNext: watching
      ? watchView === "path"
        ? route.next
        : search.next
      : () => go(level.id + 1),
    onPrev: watching
      ? watchView === "path"
        ? route.prev
        : search.prev
      : () => go(level.id - 1),
  });

  const ai = CAMPAIGN_STATS[level.id];
  const yours = progress.solved[level.id];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {!cinema && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-2 sm:px-6">
          <p className="font-mono text-sm tabular">
            {campaign ? `${String(level.id).padStart(2, "0")} / 60` : "Custom"}
          </p>
          {campaign && <p className="text-xs capitalize text-mute">{level.difficulty}</p>}
          <p className="text-xs text-faint">{solvedCount} / 60 solved</p>
          <div className="mx-2 flex rounded-full border border-line p-0.5">
            {(["play", "watch", "compare"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onMode(item)}
                className={[
                  "rounded-full px-3 py-1 text-xs capitalize",
                  mode === item ? "bg-text text-void" : "text-mute",
                ].join(" ")}
              >
                {item === "watch" ? "Watch AI" : item === "play" ? "Play" : "Compare"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1">
            <NavButton label="Previous" onClick={() => go(level.id - 1)} />
            <NavButton
              label="Restart"
              onClick={() => {
                game.reset();
                search.restart();
                route.restart();
                setComplete(false);
              }}
            />
            <NavButton label="Next" onClick={() => go(level.id + 1)} />
            <NavButton label="Select Level" onClick={() => setSelector(true)} />
            <NavButton label="Solve with AI" onClick={() => onMode("watch")} />
          </div>
        </div>
      )}

      {mode === "compare" && !cinema ? (
        <ComparePane
          yours={yours}
          result={result}
          status={status}
          algorithm={algorithm}
          cached={ai}
        />
      ) : watching ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {result?.solution && !cinema && (
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2 sm:px-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Watch</p>
              {(["search", "path"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setWatchView(item);
                    if (item === "search") search.restart();
                  }}
                  className={[
                    "rounded-full px-3 py-1 text-xs",
                    watchView === item ? "bg-text text-void" : "text-mute",
                  ].join(" ")}
                >
                  {item === "search" ? "Search tree" : "Solution path"}
                </button>
              ))}
            </div>
          )}
          <SearchStage
            board={parsed.board}
            start={parsed.state}
            algorithm={algorithm}
            onAlgorithm={onAlgorithm}
            result={result}
            status={status}
            liveStats={searchProgress}
            frame={search.frame}
            playing={watchView === "path" ? route.playing : search.playing}
            speed={watchView === "path" ? route.speed : search.speed}
            cursor={watchView === "path" ? route.index : search.cursor}
            eventCount={watchView === "path" ? route.frames.length : search.eventCount}
            onToggle={watchView === "path" ? route.toggle : search.toggle}
            onRestart={watchView === "path" ? route.restart : search.restart}
            onNext={watchView === "path" ? route.next : search.next}
            onPrev={watchView === "path" ? route.prev : search.prev}
            onSpeed={watchView === "path" ? route.setSpeed : search.setSpeed}
            onSeek={watchView === "path" ? route.setCursor : search.setCursor}
            onSelectNode={() => undefined}
            explain
            cinema={cinema}
            overrideState={watchView === "path" ? route.state : null}
            focusId={
              watchView === "path" && result?.solution
                ? (result.solution.pathIds[route.index] ?? result.solution.nodeId)
                : search.frame.currentId
            }
            highlight={watchView === "path" ? route.highlight : undefined}
            subtitle={
              status === "running"
                ? `${algorithm === "astar" ? "A*" : algorithm.toUpperCase()} is expanding the graph${
                    searchProgress ? ` · ${formatInt(searchProgress.statesExpanded)} states` : ""
                  }`
                : result?.solution
                  ? watchView === "path"
                    ? `Tracing the ${result.solution.pushes.length}-push route through the graph.`
                    : `Found in ${result.solution.pushes.length} pushes. The gold line is the route.`
                  : "No route inside this search budget — you can still play the level."
            }
          />
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-auto p-4 sm:p-6">
          <Board board={parsed.board} state={game.state} maxSize={560} />
          <p className="text-center font-mono text-sm tabular text-mute">
            Moves {game.moves} · Pushes {game.pushes}
            <span className="mt-1 block text-xs text-faint">Arrow keys or WASD</span>
          </p>
        </section>
      )}

      {selector && (
        <LevelSelect
          levels={levels}
          currentId={level.id}
          solved={progress.solved}
          solvedCount={solvedCount}
          onSelect={(next) => {
            setSelector(false);
            go(next);
          }}
          onClose={() => setSelector(false)}
        />
      )}

      {complete && mode === "play" && (
        <LevelComplete
          level={level.id}
          pushes={game.pushes}
          moves={game.moves}
          aiPushes={result?.stats.solutionPushes ?? ai?.solutionPushes}
          onNext={() => {
            setComplete(false);
            go(level.id + 1);
          }}
          onWatch={() => {
            setComplete(false);
            onMode("watch");
          }}
          onClose={() => setComplete(false)}
        />
      )}
    </div>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line px-2.5 py-1 text-xs text-mute hover:text-text"
    >
      {label}
    </button>
  );
}

function ComparePane({
  yours,
  result,
  status,
  algorithm,
  cached,
}: {
  yours?: { pushes: number; moves: number };
  result: ReturnType<typeof useSolver>["result"];
  status: string;
  algorithm: AlgorithmId;
  cached?: { solutionPushes?: number; solutionMoves?: number; statesExplored?: number; deadlocks?: number };
}) {
  const ai = result?.stats;
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 p-6 md:grid-cols-2">
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">Your solution</h2>
        {yours ? (
          <div className="mt-4 space-y-2 font-mono text-sm tabular">
            <Row k="Pushes" v={formatInt(yours.pushes)} />
            <Row k="Moves" v={formatInt(yours.moves)} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-mute">Play this level first to record your route.</p>
        )}
      </section>
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">AI solution</h2>
        {status === "running" ? (
          <p className="mt-4 text-sm text-mute">Solving with {algorithm === "astar" ? "A*" : algorithm.toUpperCase()}…</p>
        ) : null}
        <div className="mt-4 space-y-2 font-mono text-sm tabular">
          <Row k="Pushes" v={formatInt(ai?.solutionPushes ?? cached?.solutionPushes)} />
          <Row k="Moves" v={formatInt(ai?.playerMoves ?? cached?.solutionMoves)} />
          <Row k="States explored" v={formatInt(ai?.statesExpanded ?? cached?.statesExplored)} />
          <Row k="Deadlocks" v={formatInt(ai?.deadlocksDetected ?? cached?.deadlocks)} />
          {ai ? <Row k="Runtime" v={formatMs(ai.elapsedMs)} /> : null}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-faint">{k}</span>
      <span>{v}</span>
    </p>
  );
}

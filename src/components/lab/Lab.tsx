import { useEffect, useMemo, useState } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { useSokoban } from "@/hooks/useSokoban";
import { useSolver } from "@/hooks/useSolver";
import { useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useProgress } from "@/hooks/useProgress";
import { Board } from "@/components/sokoban/Board";
import { AlgorithmSelector } from "@/components/controls/AlgorithmSelector";
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
  const { result, status } = useSolver(
    parsed.board,
    parsed.state,
    algorithm,
    `${ascii}|${algorithm}`,
    watching || mode === "compare",
  );
  const playback = useSolutionPlayback(parsed.state, result, watching);

  useEffect(() => {
    setComplete(false);
  }, [level.id, ascii]);

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
    onToggle: watching ? playback.toggle : undefined,
    onReset: () => {
      game.reset();
      if (watching) playback.restart();
    },
    onNext: watching ? playback.next : () => go(level.id + 1),
    onPrev: watching ? playback.prev : () => go(level.id - 1),
  });

  const boardState = watching ? playback.state : game.state;
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
                playback.restart();
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
      ) : (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-auto p-4 sm:p-6">
          <Board
            board={parsed.board}
            state={boardState}
            maxSize={watching ? 480 : 560}
            highlight={watching ? playback.highlight : undefined}
          />
          {mode === "play" && (
            <p className="text-center font-mono text-sm tabular text-mute">
              Moves {game.moves} · Pushes {game.pushes}
              <span className="mt-1 block text-xs text-faint">Arrow keys or WASD</span>
            </p>
          )}
          {watching && (
            <WatchStatus
              status={status}
              result={result}
              playback={playback}
              algorithm={algorithm}
              cinema={cinema}
              onAlgorithm={onAlgorithm}
            />
          )}
        </section>
      )}

      {cinema && (
        <div className="flex justify-between border-t border-line px-6 py-3 text-sm text-mute">
          <span>
            {result?.solution
              ? `${algorithm.toUpperCase()} · push ${playback.index} of ${playback.total}`
              : status === "running"
                ? "Searching…"
                : "No route in this search budget"}
          </span>
          <span className="font-mono tabular">{formatInt(result?.stats.statesExpanded)} states</span>
        </div>
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

function WatchStatus({
  status,
  result,
  playback,
  algorithm,
  cinema,
  onAlgorithm,
}: {
  status: string;
  result: ReturnType<typeof useSolver>["result"];
  playback: ReturnType<typeof useSolutionPlayback>;
  algorithm: AlgorithmId;
  cinema?: boolean;
  onAlgorithm: (id: AlgorithmId) => void;
}) {
  if (status === "running") {
    return <p className="text-sm text-mute">Searching for a route…</p>;
  }
  if (!result?.solution) {
    return (
      <div className="max-w-md text-center text-sm text-mute">
        <p>No route inside this search budget.</p>
        {result && (
          <p className="mt-2 font-mono text-xs tabular text-faint">
            {formatInt(result.stats.statesExpanded)} states ·{" "}
            {formatInt(result.stats.deadlocksDetected)} deadlocks · {formatMs(result.stats.elapsedMs)}
          </p>
        )}
        {!cinema && <div className="mt-4"><AlgorithmSelector value={algorithm} onChange={onAlgorithm} compact /></div>}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-3">
      <p className="font-mono text-sm tabular">
        Push {playback.index} / {playback.total}
        {playback.action ? ` · ${playback.action}` : ""}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <NavButton label={playback.playing ? "Pause" : "Play"} onClick={playback.toggle} />
        <NavButton label="Step" onClick={playback.next} />
        <NavButton label="Restart" onClick={playback.restart} />
        <div className="flex gap-1">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => playback.setSpeed(speed)}
              className={[
                "rounded-full px-2 py-0.5 text-[11px]",
                playback.speed === speed ? "bg-text text-void" : "text-mute",
              ].join(" ")}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
      <p className="font-mono text-[11px] tabular text-faint">
        {formatInt(result.stats.statesExpanded)} states ·{" "}
        {formatInt(result.stats.deadlocksDetected)} deadlocks · {formatMs(result.stats.elapsedMs)}
        {result.stats.playerMoves != null ? ` · ${result.stats.playerMoves} walks` : ""}
      </p>
      {!cinema && <AlgorithmSelector value={algorithm} onChange={onAlgorithm} compact />}
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

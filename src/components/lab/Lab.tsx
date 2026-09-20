import { useEffect, useMemo, useState } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { useSokoban } from "@/hooks/useSokoban";
import { useSolver } from "@/hooks/useSolver";
import { useWatchPlayback } from "@/hooks/useSolutionPlayback";
import { SearchStage } from "@/components/lab/SearchStage";
import { Compare } from "@/components/lab/Compare";
import { PlayPad } from "@/components/lab/PlayPad";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useProgress } from "@/hooks/useProgress";
import { Board } from "@/components/sokoban/Board";
import { LevelSelect } from "@/components/campaign/LevelSelect";
import { LevelComplete } from "@/components/campaign/LevelComplete";
import { asDefinition, campaignAscii, levelByNumber, levels } from "@/levels";
import type { AlgorithmId } from "@/engine/search/types";
import type { LevelDefinition } from "@/engine/sokoban/types";

export type PlayMode = "play" | "watch" | "compare";

const INSTANT = { instant: true as const };

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
  const puzzleKey = `${ascii}|${algorithm}|watch`;
  const greedyFirst = watching && algorithm !== "greedy";
  const fallback = useSolver(
    parsed.board,
    parsed.state,
    "greedy",
    `${ascii}|greedy|watch-fallback`,
    greedyFirst,
    INSTANT,
  );
  const greedyHasRoute =
    !greedyFirst ||
    fallback.status === "done" ||
    fallback.status === "error" ||
    (fallback.result?.solution?.steps.length ?? 0) > 0 ||
    (fallback.progress?.steps?.length ?? 0) >= 8;
  const primary = useSolver(
    parsed.board,
    parsed.state,
    algorithm,
    puzzleKey,
    watching && greedyHasRoute,
    INSTANT,
  );
  const path =
    primary.result?.solution ??
    fallback.result?.solution ??
    null;
  const pathSource = primary.result?.solution ? algorithm : path ? "greedy" : algorithm;
  const pathResult = primary.result?.solution ? primary.result : fallback.result;
  const live =
    (primary.progress?.steps?.length ?? 0) >= (fallback.progress?.steps?.length ?? 0)
      ? primary.progress
      : fallback.progress;
  const route = useWatchPlayback(parsed.state, path?.steps, live, watching, puzzleKey);
  const playable = route.frames.length > 1;

  useEffect(() => {
    setComplete(false);
  }, [level.id, ascii, algorithm]);

  useEffect(() => {
    if (mode === "play" && campaign && game.solved) {
      markSolved(level.id, {
        pushes: game.pushes,
        moves: game.moves,
        steps: game.steps,
      });
      setComplete(true);
    }
  }, [game.solved, mode, campaign, game.pushes, game.moves, game.steps, level.id, markSolved]);

  const go = (nextId: number) => {
    const next = levelByNumber(Math.min(60, Math.max(1, nextId)));
    onLevel(asDefinition(next));
  };

  useKeyboard({
    enabled: !selector && !cinema,
    onMove:
      mode === "play"
        ? game.move
        : watching
          ? (action) => {
              if (action === "LEFT" || action === "UP") route.prev();
              else route.next();
            }
          : undefined,
    onToggle: watching ? route.toggle : undefined,
    onReset: () => {
      game.reset();
      route.restart();
    },
    onNext: watching ? route.next : () => go(level.id + 1),
    onPrev: watching ? route.prev : () => go(level.id - 1),
  });

  const yours = progress.solved[level.id];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {!cinema && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setSelector(true)}
            className="font-mono text-sm tabular text-text hover:text-gold"
          >
            {campaign ? `${String(level.id).padStart(2, "0")} / 60` : "Custom"}
          </button>
          {campaign && <p className="text-xs capitalize text-mute">{level.difficulty}</p>}
          <p className="text-xs text-faint">{solvedCount} / 60 solved</p>
          <div className="ml-auto flex flex-wrap gap-1">
            <NavButton label="Prev" onClick={() => go(level.id - 1)} />
            <NavButton
              label="Restart"
              onClick={() => {
                game.reset();
                route.restart();
                setComplete(false);
              }}
            />
            <NavButton label="Next" onClick={() => go(level.id + 1)} />
            <NavButton label="Levels" onClick={() => setSelector(true)} />
          </div>
        </div>
      )}

      {mode === "compare" && !cinema ? (
        <Compare board={parsed.board} start={parsed.state} ascii={ascii} yours={yours} />
      ) : watching ? (
        <SearchStage
          board={parsed.board}
          algorithm={pathSource}
          requestedAlgorithm={algorithm}
          onAlgorithm={onAlgorithm}
          result={pathResult}
          status={playable ? "done" : primary.status}
          liveStats={live}
          awaiting={!playable}
          playing={route.playing}
          speed={route.speed}
          cursor={route.index}
          eventCount={route.frames.length}
          onToggle={route.toggle}
          onRestart={route.restart}
          onNext={route.next}
          onPrev={route.prev}
          onSpeed={route.setSpeed}
          onSeek={route.setCursor}
          cinema={cinema}
          display={route.state}
          frames={route.frames}
          highlight={route.highlight}
          trail={route.trail}
          action={route.action}
          steps={route.steps}
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-auto p-4 sm:p-6">
          <Board
            board={parsed.board}
            state={game.state}
            maxSize={560}
            onCellClick={game.click}
          />
          <div className="flex flex-col items-center gap-3">
            <PlayPad onMove={game.move} />
            <p className="text-center font-mono text-sm tabular text-mute">
              Moves {game.moves} · Pushes {game.pushes}
              <span className="mt-1 block text-xs text-faint">
                Click a tile, use the pad, or arrow keys
              </span>
            </p>
          </div>
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
          aiPushes={pathResult?.stats.solutionPushes ?? undefined}
          onNext={() => {
            setComplete(false);
            go(level.id + 1);
          }}
          onWatch={() => {
            setComplete(false);
            onMode("watch");
          }}
          onCompare={() => {
            setComplete(false);
            onMode("compare");
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

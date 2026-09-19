import { useEffect, useMemo, useState } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { useSokoban } from "@/hooks/useSokoban";
import { useSolver } from "@/hooks/useSolver";
import { useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { SearchStage } from "@/components/lab/SearchStage";
import { Compare } from "@/components/lab/Compare";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useProgress } from "@/hooks/useProgress";
import { Board } from "@/components/sokoban/Board";
import { LevelSelect } from "@/components/campaign/LevelSelect";
import { LevelComplete } from "@/components/campaign/LevelComplete";
import { asDefinition, campaignAscii, levelByNumber, levels } from "@/levels";
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
    watching,
    { instant: true },
  );
  const route = useSolutionPlayback(parsed.state, result?.solution?.steps, watching);

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
    onMove: mode === "play" ? game.move : undefined,
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
        <Compare board={parsed.board} start={parsed.state} ascii={ascii} yours={yours} />
      ) : watching ? (
        <SearchStage
          board={parsed.board}
          algorithm={algorithm}
          onAlgorithm={onAlgorithm}
          result={result}
          status={status}
          liveStats={searchProgress}
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
        />
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
          aiPushes={result?.stats.solutionPushes ?? undefined}
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

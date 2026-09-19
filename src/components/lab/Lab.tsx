import { useMemo, useState } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { tryMove } from "@/engine/sokoban/moves";
import { useSolver } from "@/hooks/useSolver";
import { usePlayback } from "@/hooks/usePlayback";
import { useKeyboard } from "@/hooks/useKeyboard";
import { SearchStage } from "@/components/lab/SearchStage";
import { Sidebar } from "@/components/layout/Sidebar";
import { LEVELS, levelById } from "@/levels";
import type { AlgorithmId } from "@/engine/search/types";
import type { LevelDefinition, SokobanState } from "@/engine/sokoban/types";

type Props = {
  levelId: string;
  ascii: string;
  algorithm: AlgorithmId;
  explain: boolean;
  cinema?: boolean;
  onAlgorithm: (id: AlgorithmId) => void;
  onLevel: (level: LevelDefinition) => void;
};

export function Lab({
  levelId,
  ascii,
  algorithm,
  explain,
  cinema,
  onAlgorithm,
  onLevel,
}: Props) {
  const parsed = useMemo(() => parseLevel(ascii), [ascii]);
  const { result, status } = useSolver(
    parsed.board,
    parsed.state,
    algorithm,
    `${ascii}|${algorithm}`,
  );
  const playback = usePlayback(result, true);
  const [human, setHuman] = useState<SokobanState | null>(null);
  const level = levelById(levelId) ?? LEVELS[0]!;
  const custom = !levelById(levelId);

  const inspect = (id: string) => {
    const index =
      result?.events.findIndex((event) => "nodeId" in event && event.nodeId === id) ?? -1;
    if (index >= 0) {
      playback.setPlaying(false);
      playback.setCursor(index);
    }
  };

  useKeyboard({
    enabled: true,
    onMove: (action) => {
      playback.setPlaying(false);
      const current =
        human ??
        (playback.frame.currentId
          ? playback.frame.nodes.get(playback.frame.currentId)?.state
          : undefined) ??
        parsed.state;
      const moved = tryMove(current, parsed.board, action);
      if (moved.valid && moved.state) setHuman(moved.state);
    },
    onToggle: playback.toggle,
    onReset: () => {
      setHuman(null);
      playback.restart();
    },
    onNext: playback.next,
    onPrev: playback.prev,
  });

  return (
    <div className={cinema ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "grid min-h-0 flex-1 overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]"}>
      {!cinema && (
        <Sidebar
          levelId={levelId}
          custom={custom}
          onSelect={(item) => {
            setHuman(null);
            onLevel(item);
          }}
        />
      )}
      <SearchStage
        board={parsed.board}
        start={parsed.state}
        overrideState={human}
        algorithm={algorithm}
        onAlgorithm={onAlgorithm}
        result={result}
        status={status}
        frame={playback.frame}
        playing={playback.playing}
        speed={playback.speed}
        cursor={playback.cursor}
        eventCount={playback.eventCount}
        onToggle={playback.toggle}
        onRestart={() => {
          setHuman(null);
          playback.restart();
        }}
        onNext={playback.next}
        onPrev={playback.prev}
        onSpeed={playback.setSpeed}
        onSeek={(value) => {
          playback.setPlaying(false);
          playback.setCursor(value);
        }}
        onSelectNode={inspect}
        explain={explain}
        title={cinema ? "Heuristic" : level.title}
        subtitle={
          cinema
            ? "Watching search reason in public"
            : `${level.name} — ${level.description}`
        }
        cinema={cinema}
      />
    </div>
  );
}

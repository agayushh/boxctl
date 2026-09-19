import { useMemo } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { Board } from "@/components/sokoban/Board";
import { SearchGraph } from "@/components/search/SearchGraph";
import { useSolver } from "@/hooks/useSolver";
import { usePlayback } from "@/hooks/usePlayback";
import { LEVELS } from "@/levels";

type Props = {
  onExplore: () => void;
  onHow: () => void;
};

export function Landing({ onExplore, onHow }: Props) {
  const parsed = useMemo(() => parseLevel(LEVELS[0]!.ascii), []);
  const { result } = useSolver(parsed.board, parsed.state, "astar", "landing-tutorial");
  const playback = usePlayback(result, true);
  const current = playback.frame.currentId
    ? playback.frame.nodes.get(playback.frame.currentId)
    : undefined;
  const boardState = current?.state ?? parsed.state;
  const solutionIds = playback.frame.solution?.pathIds ?? [];

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-void">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-14">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-faint">Heuristic</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-text sm:text-6xl">
            Watch an AI solve Sokoban.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-mute">
            Explore search, heuristics, deadlocks, and planning — one move at a time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onExplore}
              className="rounded-full bg-text px-5 py-2.5 text-sm text-void"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={onHow}
              className="rounded-full border border-line px-5 py-2.5 text-sm text-mute hover:text-text"
            >
              How it works
            </button>
          </div>
        </div>
        <p className="max-w-sm text-sm text-faint">
          Left: the puzzle a person sees. Right: every push the algorithm considers.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
        <div className="flex items-center justify-center rounded-2xl border border-line bg-canvas p-6">
          <Board board={parsed.board} state={boardState} maxSize={360} />
        </div>
        <div className="min-h-[280px] rounded-2xl border border-line bg-canvas p-4">
          <SearchGraph
            nodes={[...playback.frame.nodes.values()]}
            currentId={playback.frame.currentId}
            solutionIds={solutionIds}
            onSelect={() => undefined}
          />
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { Board } from "@/components/sokoban/Board";
import { useSolver } from "@/hooks/useSolver";
import { useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { LEVELS } from "@/levels";

type Props = {
  onExplore: () => void;
  onWatch: () => void;
  onHow: () => void;
};

export function Landing({ onExplore, onWatch, onHow }: Props) {
  const parsed = useMemo(() => parseLevel(LEVELS[0]!.ascii), []);
  const { result, status } = useSolver(parsed.board, parsed.state, "astar", "landing-l1");
  const playback = useSolutionPlayback(parsed.state, result, true);

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-void">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-14">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-faint">Heuristic</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-text sm:text-6xl">
            Watch search unfold.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-mute">
            A Sokoban board on one side, the growing state graph on the other — the same idea as
            solving a cube with graph theory. Play if you want. The point is the tree.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onWatch}
              className="rounded-full bg-text px-5 py-2.5 text-sm text-void"
            >
              Watch the search
            </button>
            <button
              type="button"
              onClick={onExplore}
              className="rounded-full border border-line px-5 py-2.5 text-sm text-mute hover:text-text"
            >
              Play 60 levels
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
          {status === "running"
            ? "Finding a route for level 1…"
            : result?.solution
              ? `Level 1 · ${result.solution.pushes.length} pushes through the graph`
              : "Level 1 of 60"}
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center px-5 pb-16 lg:px-8">
        <div className="w-full rounded-2xl border border-line bg-canvas p-6">
          <Board
            board={parsed.board}
            state={playback.state}
            maxSize={420}
            highlight={playback.highlight}
          />
        </div>
      </div>
    </div>
  );
}

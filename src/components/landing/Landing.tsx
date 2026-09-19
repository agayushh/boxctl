import { useMemo } from "react";
import { parseLevel } from "@/engine/sokoban/parser";
import { Board } from "@/components/sokoban/Board";
import { StoryGraph } from "@/components/search/StoryGraph";
import { useSolver } from "@/hooks/useSolver";
import { useSolutionPlayback } from "@/hooks/useSolutionPlayback";
import { LEVELS } from "@/levels";

type Props = {
  onExplore: () => void;
  onWatch: () => void;
  onHow: () => void;
  onCompare?: () => void;
};

export function Landing({ onExplore, onWatch, onHow, onCompare }: Props) {
  const parsed = useMemo(() => parseLevel(LEVELS[0]!.ascii), []);
  const { result, status } = useSolver(parsed.board, parsed.state, "astar", "landing-l1", true, {
    instant: true,
  });
  const playback = useSolutionPlayback(parsed.state, result?.solution?.steps, true, "story");

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-void">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-14">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-faint">Heuristic</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-text sm:text-6xl">
            Sokoban is a graph. Watch search walk it.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-mute">
            Same idea as solving a cube with graph theory. The puzzle is on the left. Each tiny
            board on the right is one snapshot. Gold is the path that solves it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onWatch}
              className="rounded-full bg-text px-5 py-2.5 text-sm text-void"
            >
              Watch it solved
            </button>
            <button
              type="button"
              onClick={onCompare ?? onWatch}
              className="rounded-full border border-line px-5 py-2.5 text-sm text-mute hover:text-text"
            >
              Compare A*, BFS, Greedy
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
            ? "Finding A*’s route for level 1…"
            : result?.solution
              ? `Level 1 · A* in ${result.solution.pushes.length} pushes through the graph`
              : "Level 1 of 60"}
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl min-h-0 gap-4 px-5 pb-16 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-line bg-canvas p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-faint">The puzzle</p>
          <Board
            board={parsed.board}
            state={playback.state}
            maxSize={420}
            highlight={playback.highlight}
            trail={playback.trail}
            trailIndex={playback.index}
            trailKeep={16}
          />
        </div>
        <div className="min-h-[280px] rounded-2xl border border-line bg-canvas p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-faint">The graph</p>
          <div className="h-[320px]">
            <StoryGraph
              board={parsed.board}
              frames={playback.frames}
              steps={result?.solution?.steps ?? []}
              index={playback.index}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

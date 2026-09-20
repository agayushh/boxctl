import { useEffect, useMemo, useState } from "react";
import { Header, type NavId } from "@/components/layout/Header";
import { Landing } from "@/components/landing/Landing";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Lab } from "@/components/lab/Lab";
import { LevelEditor } from "@/components/editor/LevelEditor";
import { useUrlState } from "@/hooks/useUrlState";
import { LEVELS, levelById } from "@/levels";

export default function App() {
  const { state, patch, shareUrl } = useUrlState();
  const [copied, setCopied] = useState(false);

  const ascii = useMemo(() => {
    if (state.puzzle) return state.puzzle;
    return levelById(state.level)?.ascii ?? LEVELS[0]!.ascii;
  }, [state.puzzle, state.level]);

  useEffect(() => {
    document.title =
      state.view === "landing"
        ? "Heuristic — Watch an AI solve Sokoban"
        : "Heuristic";
  }, [state.view]);

  const share = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const nav: NavId =
    state.view === "lab" || state.view === "cinema" || state.view === "compare"
      ? state.view === "cinema"
        ? "cinema"
        : state.mode
      : state.view;

  const goNav = (next: NavId) => {
    if (next === "play") patch({ view: "lab", mode: "play" });
    else if (next === "watch") patch({ view: "lab", mode: "watch" });
    else if (next === "compare") patch({ view: "lab", mode: "compare" });
    else if (next === "cinema") patch({ view: "cinema", mode: "watch" });
    else patch({ view: next, mode: next === "landing" ? "play" : state.mode });
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-void text-text">
      {state.view !== "landing" && (
        <Header nav={nav} cinema={state.view === "cinema"} onNav={goNav} onShare={share} />
      )}
      {copied && (
        <div className="border-b border-line px-4 py-1 text-center text-[11px] text-mute">
          Link copied
        </div>
      )}
      {state.view === "landing" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <Landing
            onExplore={() => patch({ view: "lab", mode: "play" })}
            onWatch={() => patch({ view: "lab", mode: "watch" })}
            onCompare={() => patch({ view: "lab", mode: "compare" })}
            onHow={() => patch({ view: "how" })}
          />
        </div>
      ) : state.view === "how" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <HowItWorks onBack={() => patch({ view: "lab", mode: "watch" })} />
        </div>
      ) : state.view === "editor" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <LevelEditor
            onSolve={(puzzle) => patch({ view: "lab", puzzle, level: "custom", mode: "play" })}
          />
        </div>
      ) : (
        <Lab
          levelId={state.level}
          ascii={state.puzzle ? ascii : undefined}
          algorithm={state.algo}
          mode={state.view === "cinema" ? "watch" : state.mode}
          cinema={state.view === "cinema"}
          onAlgorithm={(algo) => patch({ algo })}
          onLevel={(level) => patch({ level: level.id, puzzle: null })}
          onMode={(mode) => patch({ view: "lab", mode })}
        />
      )}
    </div>
  );
}

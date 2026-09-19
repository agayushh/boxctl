import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Landing } from "@/components/landing/Landing";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Lab } from "@/components/lab/Lab";
import { Compare } from "@/components/lab/Compare";
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

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-void text-text">
      {state.view !== "landing" && (
        <Header
          view={state.view}
          explain={state.explain}
          cinema={state.view === "cinema"}
          onView={(view) => patch({ view })}
          onExplain={(explain) => patch({ explain })}
          onShare={share}
        />
      )}
      {copied && (
        <div className="border-b border-line px-4 py-1 text-center text-[11px] text-mute">
          Link copied
        </div>
      )}
      {state.view === "landing" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <Landing
            onExplore={() => patch({ view: "lab" })}
            onHow={() => patch({ view: "how" })}
          />
        </div>
      ) : state.view === "how" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <HowItWorks onBack={() => patch({ view: "lab" })} />
        </div>
      ) : state.view === "editor" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <LevelEditor
            onSolve={(puzzle) => patch({ view: "lab", puzzle, level: "custom" })}
          />
        </div>
      ) : state.view === "compare" ? (
        <Compare
          ascii={ascii}
          left={state.algo}
          right={state.vs}
          onLeft={(algo) => patch({ algo })}
          onRight={(vs) => patch({ vs })}
        />
      ) : (
        <Lab
          levelId={state.level}
          ascii={ascii}
          algorithm={state.algo}
          explain={state.explain}
          cinema={state.view === "cinema"}
          onAlgorithm={(algo) => patch({ algo })}
          onLevel={(level) => patch({ level: level.id, puzzle: null })}
        />
      )}
    </div>
  );
}

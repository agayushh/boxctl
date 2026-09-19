import { LEVELS } from "@/levels";
import type { LevelDefinition } from "@/engine/sokoban/types";

type Props = {
  levelId: string;
  custom: boolean;
  onSelect: (level: LevelDefinition) => void;
};

export function Sidebar({ levelId, custom, onSelect }: Props) {
  return (
    <aside className="overflow-auto border-b border-line p-4 md:border-b-0 md:border-r">
      <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Puzzles</p>
      <ul className="mt-3 space-y-1">
        {LEVELS.map((level) => {
          const active = !custom && level.id === levelId;
          return (
            <li key={level.id}>
              <button
                type="button"
                onClick={() => onSelect(level)}
                className={[
                  "w-full rounded-lg px-2 py-2 text-left",
                  active ? "bg-raised" : "hover:bg-raised/50",
                ].join(" ")}
              >
                <div className="text-[11px] text-faint">{level.title}</div>
                <div className="text-sm text-text">{level.name}</div>
              </button>
            </li>
          );
        })}
        {custom && (
          <li className="rounded-lg bg-raised px-2 py-2">
            <div className="text-[11px] text-faint">CUSTOM</div>
            <div className="text-sm text-text">Shared puzzle</div>
          </li>
        )}
      </ul>
    </aside>
  );
}

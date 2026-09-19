import type { ViewId } from "@/hooks/useUrlState";

type Props = {
  view: ViewId;
  onView: (view: ViewId) => void;
  onShare: () => void;
  cinema?: boolean;
};

const LINKS: Array<{ id: ViewId; label: string }> = [
  { id: "lab", label: "Play" },
  { id: "compare", label: "Compare" },
  { id: "editor", label: "Editor" },
  { id: "how", label: "How it works" },
];

export function Header({ view, onView, onShare, cinema }: Props) {
  if (cinema) {
    return (
      <header className="flex items-center justify-between px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-faint">Heuristic</p>
        <button
          type="button"
          onClick={() => onView("lab")}
          className="text-xs text-mute hover:text-text"
        >
          Exit cinema
        </button>
      </header>
    );
  }

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={() => onView("landing")}
        className="font-serif text-xl tracking-tight text-text"
      >
        Heuristic
      </button>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
        {LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onView(link.id)}
            className={[
              "rounded-full px-2.5 py-1 text-xs",
              view === link.id ? "bg-raised text-text" : "text-mute hover:text-text",
            ].join(" ")}
          >
            {link.label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onView("cinema")}
          className="rounded-full border border-line px-2.5 py-1 text-xs text-mute hover:text-text"
        >
          Cinema
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-full border border-line px-2.5 py-1 text-xs text-mute hover:text-text"
        >
          Copy link
        </button>
      </div>
    </header>
  );
}

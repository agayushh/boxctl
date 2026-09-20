export type NavId = "play" | "watch" | "compare" | "how" | "editor" | "landing" | "cinema";

type Props = {
  nav: NavId;
  onNav: (nav: NavId) => void;
  onShare: () => void;
  cinema?: boolean;
};

const LINKS: Array<{ id: NavId; label: string }> = [
  { id: "play", label: "Play" },
  { id: "watch", label: "Watch" },
  { id: "compare", label: "Compare" },
  { id: "how", label: "Guide" },
];

export function Header({ nav, onNav, onShare, cinema }: Props) {
  if (cinema) {
    return (
      <header className="flex items-center justify-between px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-faint">Heuristic</p>
        <button
          type="button"
          onClick={() => onNav("watch")}
          className="text-xs text-mute hover:text-text"
        >
          Exit cinema
        </button>
      </header>
    );
  }

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5 sm:px-6">
      <button
        type="button"
        onClick={() => onNav("landing")}
        className="font-serif text-xl tracking-tight text-text"
      >
        Heuristic
      </button>
      <nav className="flex items-center rounded-full border border-line p-0.5" aria-label="Primary">
        {LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNav(link.id)}
            className={[
              "rounded-full px-3 py-1 text-xs",
              nav === link.id ? "bg-text text-void" : "text-mute hover:text-text",
            ].join(" ")}
          >
            {link.label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNav("editor")}
          className={[
            "text-xs",
            nav === "editor" ? "text-text" : "text-faint hover:text-text",
          ].join(" ")}
        >
          Editor
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

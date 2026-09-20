const STEPS = [
  {
    title: "Left is the puzzle. Right is snapshots of it.",
    body: "The big board is one picture. Each tiny board is the same puzzle after a push. That is all a “state” is.",
  },
  {
    title: "Gold is the plan. Grey is everything else.",
    body: "From here, several pushes may be legal. Grey boards are those options. Gold is the one this algorithm kept.",
  },
  {
    title: "A*, BFS, and Greedy only differ in what they pick next.",
    body: "BFS takes the oldest snapshot. Greedy chases the smallest leftover guess h. A* uses f = g + h so it does not wander.",
  },
  {
    title: "Follow the gold chain and you have the solution.",
    body: "When every box sits on a goal, walk back along gold. You do not need the whole tree — just the puzzle, the snapshots, and that path.",
  },
];

export function HowItWorks({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-faint">How it works</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Puzzle on the left. Path on the right.</h1>
      <p className="mt-3 text-mute">
        Watch it like a map: gold is the way home. Switch algorithms to see who picks which next
        push.
      </p>
      <ol className="mt-10 space-y-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid gap-2 sm:grid-cols-[64px_1fr]">
            <div className="font-mono text-sm text-gold">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2 className="text-lg text-text">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-mute">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onBack}
        className="mt-12 rounded-full bg-text px-5 py-2.5 text-sm text-void"
      >
        Watch a puzzle solved
      </button>
    </div>
  );
}

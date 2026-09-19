const STEPS = [
  {
    title: "This looks like a simple puzzle.",
    body: "A person sees walls, a player, boxes, and goals. The question is only: which way do I push?",
  },
  {
    title: "The AI considers possible pushes.",
    body: "Walking around the room is cheap. The meaningful decision is which box to push, and in which direction.",
  },
  {
    title: "Some paths look promising.",
    body: "A heuristic estimates remaining work by matching boxes to goals. Lower is better — but it is only an estimate.",
  },
  {
    title: "Some lead to deadlocks.",
    body: "A box in a non-goal corner can never be pulled out. Entire futures disappear in a single push.",
  },
  {
    title: "The heuristic ranks the unknown.",
    body: "f(n) = g(n) + h(n). Paid cost plus estimated cost. That number is how the search chooses.",
  },
  {
    title: "Different algorithms see different worlds.",
    body: "BFS is thorough. Greedy is impatient. A* balances both. IDA* repeats itself to save memory. Beam keeps only a few candidates.",
  },
  {
    title: "The search discovers the solution.",
    body: "When a state has every box on a goal, the path back to the start is the plan. The interesting part was everything that almost worked.",
  },
];

export function HowItWorks({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-faint">How it works</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">AI reasoning, made visible.</h1>
      <p className="mt-3 text-mute">
        Heuristic is not a solver demo. It is a way to watch an algorithm think.
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
        Open the lab
      </button>
    </div>
  );
}

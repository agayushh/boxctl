const STEPS = [
  {
    title: "The board is just one picture of the puzzle.",
    body: "Walls, a person, boxes, goals. A human asks: which way do I push? The computer asks a bigger question: what are all the pictures I can reach?",
  },
  {
    title: "Each picture is a state. Each push is an edge.",
    body: "Put those snapshots on a page and connect the ones that differ by one box push. That drawing is a graph. Sokoban search is walking that graph.",
  },
  {
    title: "The frontier is a to-do list.",
    body: "From the current snapshot, several pushes might be legal. Those next snapshots sit in a list called the frontier. BFS treats it as a queue. A* treats it as a priority queue. Greedy peeks only at the heuristic.",
  },
  {
    title: "A guess ranks the unknown.",
    body: "h is a heuristic: match leftover boxes to leftover goals, walking around walls. g is pushes already made. A* uses f = g + h so it does not wander, and it does not get greedy-blind.",
  },
  {
    title: "Some edges are dead ends.",
    body: "A box in a corner that is not a goal can never be pulled out. The search marks that state and never spends time on its children.",
  },
  {
    title: "The gold path is the plan.",
    body: "When every box sits on a goal, the walk back to the start is the solution. You do not need the whole tree. You need to see the puzzle, the graph, and that gold chain together — the same idea as solving a cube with graph theory.",
  },
];

export function HowItWorks({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-faint">How it works</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Graph search, in plain sight.</h1>
      <p className="mt-3 text-mute">
        You do not need a CS degree. If you can follow a map, you can follow this: the left side
        is the place, the right side is every useful snapshot, gold is the way home.
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

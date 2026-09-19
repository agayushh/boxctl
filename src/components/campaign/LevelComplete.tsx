type Props = {
  level: number;
  pushes: number;
  moves: number;
  aiPushes?: number;
  onNext: () => void;
  onWatch: () => void;
  onClose: () => void;
};

export function LevelComplete({
  level,
  pushes,
  moves,
  aiPushes,
  onNext,
  onWatch,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-void/80 p-4" role="dialog" aria-label="Level complete">
      <div className="w-full max-w-md rounded-2xl border border-line bg-canvas p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Level complete</p>
        <h2 className="mt-2 font-serif text-3xl">Level {level}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm tabular">
          <div>
            <dt className="text-faint">Your pushes</dt>
            <dd>{pushes}</dd>
          </div>
          <div>
            <dt className="text-faint">Your moves</dt>
            <dd>{moves}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-faint">AI solver result</dt>
            <dd>{aiPushes === undefined ? "Not run yet" : `${aiPushes} pushes`}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={onNext} className="rounded-full bg-text px-4 py-2 text-sm text-void">
            Next Level
          </button>
          <button type="button" onClick={onWatch} className="rounded-full border border-line px-4 py-2 text-sm">
            Watch AI Solve
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-mute">
            Keep playing
          </button>
        </div>
      </div>
    </div>
  );
}

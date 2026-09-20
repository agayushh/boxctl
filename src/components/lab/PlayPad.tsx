import { ACTION_GLYPH, type Action } from "@/utils/coordinates";

type Props = {
  onMove: (action: Action) => void;
};

export function PlayPad({ onMove }: Props) {
  return (
    <div className="grid w-[9.5rem] grid-cols-3 gap-1" aria-label="Move">
      <span />
      <PadButton label="Up" action="UP" onMove={onMove} />
      <span />
      <PadButton label="Left" action="LEFT" onMove={onMove} />
      <span className="grid place-items-center text-[10px] text-faint">or click</span>
      <PadButton label="Right" action="RIGHT" onMove={onMove} />
      <span />
      <PadButton label="Down" action="DOWN" onMove={onMove} />
      <span />
    </div>
  );
}

function PadButton({
  label,
  action,
  onMove,
}: {
  label: string;
  action: Action;
  onMove: (action: Action) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onMove(action)}
      className="rounded-xl border border-line bg-raised py-2 text-sm text-text hover:border-line-strong"
    >
      {ACTION_GLYPH[action]}
    </button>
  );
}

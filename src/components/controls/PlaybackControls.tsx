import { SPEEDS } from "@/hooks/usePlayback";
import { formatInt } from "@/utils/statistics";

type Props = {
  playing: boolean;
  speed: number;
  cursor: number;
  eventCount: number;
  onToggle: () => void;
  onRestart: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSpeed: (value: number) => void;
  onSeek: (value: number) => void;
};

export function PlaybackControls({
  playing,
  speed,
  cursor,
  eventCount,
  onToggle,
  onRestart,
  onNext,
  onPrev,
  onSpeed,
  onSeek,
}: Props) {
  const max = Math.max(0, eventCount - 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={playing ? "Pause" : "Play"} onClick={onToggle}>
          {playing ? "Pause" : "Play"}
        </IconButton>
        <IconButton label="Previous push" onClick={onPrev}>
          Prev
        </IconButton>
        <IconButton label="Next push" onClick={onNext}>
          Next
        </IconButton>
        <IconButton label="Restart route" onClick={onRestart}>
          Restart
        </IconButton>
        <div className="ml-auto flex flex-wrap gap-1">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={speed === value}
              onClick={() => onSpeed(value)}
              className={[
                "rounded-full px-2 py-0.5 text-[11px] tabular",
                speed === value ? "bg-text text-void" : "text-mute hover:text-text",
              ].join(" ")}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 flex justify-between text-[11px] text-mute">
          <span>Timeline</span>
          <span className="tabular">
            {formatInt(eventCount === 0 ? 0 : cursor + 1)} / {formatInt(eventCount)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={Math.min(cursor, max)}
          disabled={eventCount <= 1}
          onInput={(event) => onSeek(Number(event.currentTarget.value))}
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
          className="timeline-slider w-full"
          aria-label="Solution timeline"
        />
      </label>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-full border border-line px-3 py-1 text-xs text-mute hover:border-line-strong hover:text-text"
    >
      {children}
    </button>
  );
}

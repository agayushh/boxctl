import { AlgorithmSelector } from "@/components/controls/AlgorithmSelector";
import { PlaybackControls } from "@/components/controls/PlaybackControls";
import { WATCH_SPEEDS } from "@/hooks/usePlayback";
import type { AlgorithmId } from "@/engine/search/types";

type Props = {
  algorithm: AlgorithmId;
  onAlgorithm: (id: AlgorithmId) => void;
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
  loading?: boolean;
};

export function SolverControls(props: Props) {
  return (
    <div className="flex flex-col gap-4">
      <AlgorithmSelector value={props.algorithm} onChange={props.onAlgorithm} />
      {props.loading ? (
        <p className="text-xs text-mute">
          Searching… the board updates one snapshot at a time. Play pauses. The timeline starts
          after a path is found and plays through once.
        </p>
      ) : null}
      <PlaybackControls
        playing={props.playing}
        speed={props.speed}
        cursor={props.cursor}
        eventCount={props.eventCount}
        onToggle={props.onToggle}
        onRestart={props.onRestart}
        onNext={props.onNext}
        onPrev={props.onPrev}
        onSpeed={props.onSpeed}
        onSeek={props.onSeek}
        speeds={WATCH_SPEEDS}
        timelineLabel="Solution"
      />
    </div>
  );
}

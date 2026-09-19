/// <reference lib="webworker" />

import { solve } from "@/engine/search/solver";
import { deserializeBoard, deserializeState } from "@/engine/search/serialize";
import type { WorkerIn, WorkerOut } from "@/engine/search/serialize";

self.onmessage = (event: MessageEvent<WorkerIn>) => {
  const data = event.data;
    const result = solve({
      algorithm: data.algorithm,
      heuristicId: data.heuristicId,
      maxNodes: data.maxNodes,
      beamWidth: data.beamWidth,
      board: deserializeBoard(data.board),
      state: deserializeState(data.state),
      onProgress: (progress) => {
        self.postMessage({ requestId: data.requestId, progress });
      },
    });
    const out: WorkerOut = { requestId: data.requestId, result };
    self.postMessage(out);
};

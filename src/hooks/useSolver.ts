import { useEffect, useRef, useState } from "react";
import type { AlgorithmId, SearchProgress, SolverResult } from "@/engine/search/types";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import { solve, nodesFor } from "@/engine/search/solver";
import { serializeBoard, serializeState, reviveProgress } from "@/engine/search/serialize";
import type { WorkerIn, WorkerOut } from "@/engine/search/serialize";

type Status = "idle" | "running" | "done" | "error";

type Options = {
  instant?: boolean;
};

export function useSolver(
  board: Board | null,
  state: SokobanState | null,
  algorithm: AlgorithmId,
  puzzleKey: string,
  enabled = true,
  options: Options = {},
) {
  const [result, setResult] = useState<SolverResult | null>(null);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL("../engine/search/solver.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      workerRef.current = null;
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !board || !state || !puzzleKey) {
      if (!enabled) {
        setStatus("idle");
        setResult(null);
        setProgress(null);
      }
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("running");
    setError(null);
    setProgress(null);
    setResult(null);

    const finish = (next: SolverResult) => {
      if (requestId !== requestRef.current) return;
      setResult(next);
      setStatus("done");
    };
    const fail = (message: string) => {
      if (requestId !== requestRef.current) return;
      try {
        finish(solve({ board, state, algorithm }));
      } catch {
        setError(message);
        setStatus("error");
      }
    };

    const worker = workerRef.current;
    if (worker) {
      const onMessage = (event: MessageEvent<WorkerOut>) => {
        if (event.data.requestId !== requestId) return;
        if (event.data.progress) {
          setProgress(reviveProgress(event.data.progress));
          return;
        }
        if (event.data.result) finish(event.data.result);
      };
      const onError = () => fail("Worker failed; ran search on the main thread.");
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      const payload: WorkerIn = {
        requestId,
        algorithm,
        mode: options.instant ? "instant" : "visualization",
        maxNodes: nodesFor(algorithm, state.boxes.size),
        board: serializeBoard(board),
        state: serializeState(state),
      };
      worker.postMessage(payload);
      return () => {
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
      };
    }

    fail("No worker available.");
    return undefined;
  }, [algorithm, puzzleKey, board, state, enabled, options.instant]);

  return { result, status, error, progress };
}

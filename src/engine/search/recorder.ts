import type {
  Alternative,
  SearchEvent,
  SearchNode,
  SearchStats,
  Solution,
} from "@/engine/search/types";
import type { AlgorithmId } from "@/engine/search/types";

export class SearchRecorder {
  readonly nodes = new Map<string, SearchNode>();
  readonly events: SearchEvent[] = [];
  readonly stats: SearchStats;
  solution: Solution | null = null;
  private discovery = 0;
  private readonly maxEvents: number;
  private recording: boolean;

  constructor(algorithm: AlgorithmId, heuristic: string, maxEvents = 12_000) {
    this.maxEvents = maxEvents;
    this.recording = true;
    this.stats = {
      algorithm,
      heuristic,
      statesGenerated: 0,
      statesExpanded: 0,
      statesPruned: 0,
      deadlocksDetected: 0,
      peakFrontier: 0,
      solutionPushes: null,
      playerMoves: null,
      elapsedMs: 0,
    };
  }

  noteFrontier(size: number): void {
    if (size > this.stats.peakFrontier) this.stats.peakFrontier = size;
  }

  get accepting(): boolean {
    return this.recording && this.events.length < this.maxEvents;
  }

  nextDiscovery(): number {
    const value = this.discovery;
    this.discovery += 1;
    return value;
  }

  put(node: SearchNode): void {
    this.nodes.set(node.id, node);
  }

  get(id: string): SearchNode | undefined {
    return this.nodes.get(id);
  }

  private emit(event: SearchEvent): void {
    if (!this.recording) return;
    if (this.events.length >= this.maxEvents && event.type !== "SOLUTION" && event.type !== "SEARCH_COMPLETE") {
      return;
    }
    this.events.push(event);
  }

  discovered(node: SearchNode, overwrite = true): void {
    this.stats.statesGenerated += 1;
    if (overwrite || !this.nodes.has(node.id)) this.put(node);
    this.emit({
      type: "STATE_DISCOVERED",
      nodeId: node.id,
      parentId: node.parentId,
      action: node.action,
      g: node.g,
      h: node.h,
      f: node.f,
    });
  }

  evaluated(node: SearchNode, reason: string, alternatives: Alternative[]): void {
    node.status = "evaluating";
    this.put(node);
    this.emit({ type: "STATE_EVALUATED", nodeId: node.id, reason, alternatives });
  }

  expanded(node: SearchNode): void {
    node.status = "expanded";
    this.stats.statesExpanded += 1;
    this.put(node);
    this.emit({ type: "STATE_EXPANDED", nodeId: node.id });
  }

  deadlock(node: SearchNode, reason: string): void {
    node.status = "deadlock";
    this.stats.deadlocksDetected += 1;
    this.put(node);
    this.emit({ type: "DEADLOCK", nodeId: node.id, reason });
  }

  pruned(node: SearchNode, reason: string, overwrite = true): void {
    if (overwrite) {
      node.status = "pruned";
      this.put(node);
    }
    this.stats.statesPruned += 1;
    this.emit({ type: "PRUNED", nodeId: node.id, reason });
  }

  bound(bound: number, iteration: number): void {
    this.stats.boundIterations = iteration;
    this.emit({ type: "BOUND", bound, iteration });
  }

  markSolution(solution: Solution): void {
    this.solution = solution;
    this.stats.solutionPushes = solution.pushes.length;
    this.stats.playerMoves = solution.playerMoves;
    for (const id of solution.pathIds) {
      const node = this.nodes.get(id);
      if (node) {
        node.status = "solution";
        this.put(node);
      }
    }
    this.emit({ type: "SOLUTION", nodeId: solution.nodeId });
  }

  complete(elapsedMs: number, failedReason?: string): void {
    this.stats.elapsedMs = elapsedMs;
    this.emit({ type: "SEARCH_COMPLETE" });
    this.recording = false;
    void failedReason;
  }

  snapshot(failedReason?: string) {
    const keep = new Set<string>();
    for (const event of this.events) {
      if ("nodeId" in event && event.nodeId) keep.add(event.nodeId);
      if ("alternatives" in event) {
        for (const alt of event.alternatives) {
          if (alt.nodeId) keep.add(alt.nodeId);
        }
      }
    }
    if (this.solution) {
      for (const id of this.solution.pathIds) keep.add(id);
    }
    const nodes =
      keep.size === 0
        ? [...this.nodes.values()]
        : [...keep]
            .map((id) => this.nodes.get(id))
            .filter((node): node is SearchNode => node !== undefined);
    return {
      events: this.events,
      nodes,
      stats: { ...this.stats },
      solution: this.solution,
      failedReason,
    };
  }
}

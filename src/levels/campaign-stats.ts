import type { LevelStats } from "@/levels/campaign";

export const CAMPAIGN_STATS: Record<number, LevelStats> = {
  "1": {
    "solutionFound": true,
    "solutionPushes": 12,
    "solutionMoves": 48,
    "statesExplored": 61,
    "deadlocks": 71,
    "branchingFactor": 5.7
  },
  "2": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 495,
    "branchingFactor": 2.6
  },
  "3": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 1823,
    "branchingFactor": 4.6
  },
  "4": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 2753,
    "branchingFactor": 4.9
  },
  "5": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 8362,
    "branchingFactor": 9
  },
  "6": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 1972,
    "branchingFactor": 7.3
  },
  "7": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 5550,
    "branchingFactor": 9.1
  },
  "8": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 5669,
    "branchingFactor": 7.6
  },
  "9": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 431,
    "branchingFactor": 13.1
  },
  "10": {
    "solutionFound": false,
    "statesExplored": 2000,
    "deadlocks": 4969,
    "branchingFactor": 8.2
  }
};

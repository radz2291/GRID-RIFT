/** Proposed authoritative boundary. Implementation is a Stage 0 task. */
import type { ActionProposal, ControllerBudget, ControllerId, JsonObject, JsonValue, Observation, Tick } from "./agent-interface.js";

export interface AuthenticatedCommand extends ActionProposal {
  readonly controllerId: ControllerId; // Trusted runner stamps this after assignment checks.
  readonly receivedTick: Tick;
}
export type EventAudience =
  | { readonly kind: "public" }
  | { readonly kind: "controllers"; readonly ids: readonly ControllerId[] }
  | { readonly kind: "evaluator-only" };
export interface DomainEvent {
  readonly tick: Tick;
  readonly index: number; // Internal journal order, not exposed to player observations.
  readonly moduleId: string;
  readonly kind: string;
  readonly data: JsonObject;
  readonly audience: EventAudience;
}
export type TerminalResult =
  | { readonly kind: "running" }
  | { readonly kind: "finished"; readonly tick: Tick; readonly winners: readonly string[]; readonly reason: string; readonly scores: JsonObject }
  | { readonly kind: "draw"; readonly tick: Tick; readonly reason: string; readonly scores: JsonObject };
export interface WorldSnapshot {
  readonly apiVersion: "grid-rift/v0";
  readonly tick: Tick;
  readonly moduleStates: JsonObject;
  readonly randomStates: JsonObject;
  readonly pendingEffects: readonly JsonObject[];
  readonly idAllocatorState: JsonValue;
  readonly terminal: TerminalResult;
}
export interface StepResult {
  readonly tick: Tick;
  readonly events: readonly DomainEvent[];
  readonly terminal: TerminalResult;
}
/** Call only from trusted composition code. Policies never receive this object. */
export interface Simulation {
  readonly tick: Tick;
  step(commands: readonly AuthenticatedCommand[]): StepResult;
  observe(controllerId: ControllerId): Observation;
  snapshot(): WorldSnapshot;
  restore(snapshot: WorldSnapshot): void;
  stateHash(): string;
}
export interface ModuleDescriptor {
  readonly id: string;
  readonly version: string;
  readonly apiVersion: "grid-rift/v0";
  readonly dependencies: readonly { readonly id: string; readonly version: string }[];
  readonly phase: string;
  readonly reads: readonly string[];
  readonly writes: readonly string[];
  readonly configurationSchemaId: string;
  readonly stateSchemaId: string;
}
/** A descriptor is NOT an executable module. Codex defines and tests lifecycle registration. */
export interface RunManifest {
  readonly runId: string;
  readonly schemaVersion: "0.1.0";
  readonly apiVersion: "grid-rift/v0";
  readonly experimentId: string;
  readonly experimentVersion: string;
  readonly experimentHash: string;
  readonly expandedConfiguration: JsonObject;
  readonly seed: number;
  readonly sourceCommit: string;
  readonly dirtyTreeFingerprint: string | null;
  readonly dependencyLockHash: string;
  readonly runtime: JsonObject;
  readonly modules: readonly { readonly id: string; readonly version: string }[];
  readonly controllers: readonly { readonly id: string; readonly policyId: string; readonly policyVersion: string; readonly budget: ControllerBudget }[];
  readonly evaluationVersion: string;
  readonly inputMode: "live" | "policy-rerun" | "action-replay";
}
export interface RunCheckpoint {
  readonly manifestHash: string;
  readonly world: WorldSnapshot;
  readonly runnerState: JsonObject; // Assignments, queue, next sequences, delivery schedule.
  readonly policyMemories: JsonObject;
  readonly continuation: "full-local" | "recorded-actions-only";
}

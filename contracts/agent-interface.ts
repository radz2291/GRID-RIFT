/** GRID-RIFT controller boundary v0.1.0. Types only; no policy or runtime exists yet.
 * Wire data must also pass runtime schemas, finite-number and size checks.
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };
export type EntityId = string;
export type ControllerId = string;
export type Tick = number; // Runtime: non-negative safe integer.
export type Version = string;

/** Copy data into observations; never expose world-store references. */
export interface VisibleEntity {
  readonly id: EntityId;
  readonly components: JsonObject;
}
export interface VisibleEvent {
  readonly localId: string; // Per-controller ID; never expose hidden global event counts.
  readonly tick: Tick;
  readonly kind: string;
  readonly data: JsonObject;
}
export interface ActionCapability {
  readonly kind: string;
  readonly version: Version;
  readonly payloadSchemaId: string;
}
export interface ActionReceipt {
  readonly sequence: number;
  readonly tick: Tick;
  readonly result: "accepted" | "rejected" | "expired";
  readonly reason: string; // Sanitized: must not disclose hidden target state.
}
export interface Observation {
  readonly apiVersion: "grid-rift/v0";
  readonly controllerId: ControllerId;
  readonly tick: Tick;
  readonly controlledEntityIds: readonly EntityId[];
  readonly world: JsonObject; // Permitted static/public knowledge only; NOT world state.
  readonly entities: readonly VisibleEntity[];
  readonly events: readonly VisibleEvent[];
  readonly receipts: readonly ActionReceipt[];
  readonly capabilities: readonly ActionCapability[];
  readonly messages: readonly VisibleEvent[];
}
export interface ActionIntent<K extends string = string, P extends JsonObject = JsonObject> {
  readonly kind: K;
  readonly version: Version;
  readonly payload: P;
}
/** Controller ID is deliberately absent; the runner stamps authenticated identity. */
export interface ActionProposal {
  readonly actorId: EntityId;
  readonly sequence: number;
  readonly observedTick: Tick;
  readonly executeTick: Tick;
  readonly action: ActionIntent;
}
export interface ControllerBudget {
  readonly decisionIntervalTicks: number;
  readonly reactionTicks: number;
  readonly actionLimitPerTick: number;
}
export interface DecisionContext {
  readonly observation: Observation;
  readonly memory: JsonValue;
  readonly budget: ControllerBudget;
  readonly earliestExecuteTick: Tick;
  readonly deadlineTick: Tick;
  readonly nextSequence: number;
}
export interface PolicyDecision {
  readonly actions: readonly ActionProposal[];
  readonly nextMemory: JsonValue;
  readonly reasonTags?: readonly string[]; // Optional self-report; not private chain-of-thought.
}
export interface PolicyIdentity {
  readonly id: string;
  readonly version: Version;
  readonly determinism: "local-replayable" | "record-actions-only";
}
/** Policy-local randomness must be seeded and saved in memory, not a hidden global. */
export interface AgentPolicy {
  readonly identity: PolicyIdentity;
  initialMemory(seed: number): JsonValue;
  decide(context: DecisionContext): PolicyDecision | Promise<PolicyDecision>;
}
/** Human adapters submit the same ActionProposal; they do not need to imitate a policy. */
export interface HumanControllerAdapter {
  sample(observation: Observation, nextSequence: number): readonly ActionProposal[];
}

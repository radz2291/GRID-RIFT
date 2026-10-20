import type { ActionCapability, ControllerBudget, JsonObject, VisibleEntity } from '../../contracts/agent-interface.js';
import type { AuthenticatedCommand, DomainEvent, ModuleDescriptor, TerminalResult } from '../../contracts/simulation-interface.js';

export interface ControllerSpec {
  id: string;
  actors: string[];
  budget: ControllerBudget;
}
export interface ModuleContext {
  tick: number;
  tickRateHz: number;
  maxTicks: number;
  controllers: readonly ControllerSpec[];
  states: JsonObject;
  random(stream: string): number;
  emit(kind: string, data: JsonObject, audience: DomainEvent['audience']): void;
  finish(result: Exclude<TerminalResult, { kind: 'running' }>): void;
}
/** Trusted, locally registered code only. State and config schemas validate JSON data. */
export interface RuntimeModule {
  descriptor: ModuleDescriptor;
  configSchema: object;
  stateSchema: object;
  actions: readonly { capability: ActionCapability; schema: object }[];
  eventKinds: readonly string[];
  initial(config: JsonObject, context: ModuleContext): JsonObject;
  validate(state: JsonObject, command: AuthenticatedCommand, context: ModuleContext): boolean;
  advance(state: JsonObject, commands: readonly AuthenticatedCommand[], config: JsonObject, context: ModuleContext): JsonObject;
  project(state: JsonObject, controllerId: string, context: ModuleContext): { world: JsonObject; entities: readonly VisibleEntity[] };
}
export interface ModuleSelection { id: string; version: string; config: JsonObject }
export interface SimulationConfig {
  seed: number;
  tickRateHz: number;
  maxTicks: number;
  maxCommandLeadTicks: number;
  maxCommandAgeTicks: number;
  controllers: ControllerSpec[];
  modules: ModuleSelection[];
}

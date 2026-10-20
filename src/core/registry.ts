import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import type { ModuleSelection, RuntimeModule } from './types.js';

export const phases = ['input', 'resolve', 'effects', 'termination'] as const;
export interface RegisteredModule { module: RuntimeModule; selection: ModuleSelection; stateValidator: ValidateFunction; actions: Map<string, ValidateFunction> }
export function resolveModules(selected: readonly ModuleSelection[], available: readonly RuntimeModule[]): RegisteredModule[] {
  const ajv = new Ajv2020({strict:true, allErrors:true});
  const implementations = new Map<string, RuntimeModule>();
  for (const module of available) {
    if (implementations.has(module.descriptor.id)) throw new Error('Duplicate registered module');
    implementations.set(module.descriptor.id, module);
  }
  const chosen = new Map<string, RegisteredModule>();
  const owners = new Set<string>();
  const actionOwners = new Set<string>();
  for (const selection of selected) {
    if (chosen.has(selection.id)) throw new Error('Duplicate selected module');
    const module = implementations.get(selection.id);
    if (!module) throw new Error(`Unimplemented module: ${selection.id}`);
    const descriptor = module.descriptor;
    if (descriptor.version !== selection.version || descriptor.apiVersion !== 'grid-rift/v0') throw new Error(`Unsupported module version: ${selection.id}@${selection.version}`);
    if (!phases.includes(descriptor.phase as typeof phases[number])) throw new Error('Unknown module phase');
    const valid = ajv.compile(module.configSchema);
    if (!valid(selection.config)) throw new Error(`Invalid config for ${selection.id}: ${ajv.errorsText(valid.errors)}`);
    for (const write of descriptor.writes) {
      if (owners.has(write)) throw new Error(`Duplicate write ownership: ${write}`);
      owners.add(write);
    }
    const actions = new Map<string, ValidateFunction>();
    for (const action of module.actions) {
      const key = `${action.capability.kind}@${action.capability.version}`;
      if (actionOwners.has(key)) throw new Error(`Duplicate action ownership: ${key}`);
      actionOwners.add(key); actions.set(key, ajv.compile(action.schema));
    }
    chosen.set(selection.id, {module,selection,stateValidator:ajv.compile(module.stateSchema),actions});
  }
  for (const entry of chosen.values()) for (const dependency of entry.module.descriptor.dependencies) {
    const target = chosen.get(dependency.id);
    if (!target || target.selection.version !== dependency.version) throw new Error(`Missing/incompatible dependency ${dependency.id}`);
    if (phases.indexOf(target.module.descriptor.phase as typeof phases[number]) > phases.indexOf(entry.module.descriptor.phase as typeof phases[number])) throw new Error('Dependency points to later phase');
  }
  const ordered: RegisteredModule[] = [];
  const pending = new Map(chosen);
  while (pending.size) {
    const ready = [...pending.values()].filter(entry => entry.module.descriptor.dependencies.every(dep => !pending.has(dep.id)));
    if (!ready.length) throw new Error('Module dependency cycle');
    ready.sort((a,b) => phases.indexOf(a.module.descriptor.phase as typeof phases[number]) - phases.indexOf(b.module.descriptor.phase as typeof phases[number]) || compare(a.selection.id,b.selection.id));
    const next = ready[0]!; ordered.push(next); pending.delete(next.selection.id);
  }
  return ordered;
}
export function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

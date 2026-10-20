import type { ActionReceipt, AgentPolicy, JsonValue, Observation, PolicyDecision } from '../../contracts/agent-interface.js';
import type { AuthenticatedCommand, RunCheckpoint, StepResult } from '../../contracts/simulation-interface.js';
import { Engine } from '../core/engine.js';
import { canonical, clone, hash } from '../core/data.js';

export class Runner {
  readonly diagnostics: string[] = [];
  readonly inputJournal: AuthenticatedCommand[] = [];
  readonly admissionJournal: {receivedTick:number;controllerId:string;proposal:JsonValue;result:string;reason:string}[] = [];
  readonly observationJournal: {tick:number;controllerId:string;observationHash:string}[] = [];
  private rejectionReceipts: Record<string,ActionReceipt[]> = {};
  private queue: AuthenticatedCommand[] = [];
  private sequences: Record<string, number> = {};
  private schedule: Record<string, number> = {};
  private memories: Record<string, JsonValue> = {};
  private assignments: Record<string, string[]> = {};
  constructor(readonly engine: Engine, readonly policies: Record<string, AgentPolicy>, readonly manifestHash: string,
    private readonly controllers: readonly { id: string; actors: string[]; budget: { decisionIntervalTicks: number; reactionTicks: number; actionLimitPerTick: number } }[],
    seed = 0, private readonly sink?: (observation: Observation) => void) {
    for (const c of controllers) {
      this.sequences[c.id] = -1; this.schedule[c.id] = 0; this.assignments[c.id] = [...c.actors];
      const p = policies[c.id];
      if (p) this.memories[c.id] = clone(p.initialMemory(seed));
    }
  }
  submit(controllerId: string, proposal: unknown): { accepted: boolean; reason: string } {
    let safe:JsonValue=null;
    try { safe=clone(proposal) as JsonValue; } catch { /* Preserve an explicit null for non-JSON proposals. */ }
    const reject = (reason: string) => {
      this.diagnostics.push(`${this.engine.tick}:${controllerId}:${reason}`);
      this.admissionJournal.push({receivedTick:this.engine.tick,controllerId,proposal:safe,result:'rejected',reason});
      const seq = proposal && typeof proposal==='object' ? (proposal as {sequence?:unknown}).sequence : undefined;
      if(Object.hasOwn(this.sequences,controllerId) && typeof seq==='number' && Number.isSafeInteger(seq) && seq>=0) (this.rejectionReceipts[controllerId]??=[]).push({sequence:seq,tick:this.engine.tick,result:reason==='late'?'expired':'rejected',reason});
      return { accepted: false, reason };
    };
    if(this.engine.snapshot().terminal.kind!=='running') return reject('terminal');
    if (!Object.hasOwn(this.sequences, controllerId)) return reject('unknown-controller');
    if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) return reject('invalid-proposal');
    const keys = Object.keys(proposal);
    if (keys.length !== 5 || keys.some(k => !['actorId','sequence','observedTick','executeTick','action'].includes(k))) return reject('invalid-proposal');
    let command: AuthenticatedCommand;
    try { command = clone({ ...proposal, controllerId, receivedTick: this.engine.tick }) as AuthenticatedCommand; } catch { return reject('invalid-proposal'); }
    const error = this.engine.checkCommand(command);
    if (error) return reject(error);
    if (command.sequence <= this.sequences[controllerId]!) return reject('sequence-not-increasing');
    const limit = this.controllers.find(c => c.id === controllerId)!.budget.actionLimitPerTick;
    if (this.queue.filter(c => c.controllerId === controllerId && c.executeTick === command.executeTick).length >= limit) return reject('action-limit');
    this.sequences[controllerId] = command.sequence;
    this.queue.push(clone(command)); this.inputJournal.push(clone(command));
    this.admissionJournal.push({receivedTick:this.engine.tick,controllerId,proposal:safe,result:'accepted',reason:'queued'});
    return { accepted: true, reason: 'queued' };
  }
  step(runPolicies = true): StepResult {
    const tick = this.engine.tick;
    if(this.engine.snapshot().terminal.kind!=='running') return this.engine.step([]);
    // Every controller sees the same pre-step world; observers only receive their permitted projection.
    const observations = this.controllers.map(c => this.observe(c.id));
    this.rejectionReceipts={};
    for (const observation of observations) {
      this.observationJournal.push({tick,controllerId:observation.controllerId,observationHash:hash(observation)});
      if (this.sink) try { this.sink(clone(observation)); } catch { this.diagnostics.push(`${tick}:observer-error`); }
    }
    if (runPolicies) for (let i = 0; i < this.controllers.length; i++) {
      const c = this.controllers[i]!; const policy = this.policies[c.id];
      if (!policy || tick < this.schedule[c.id]!) continue;
      this.schedule[c.id] = tick + c.budget.decisionIntervalTicks;
      try {
        const decision = policy.decide({ observation: clone(observations[i]!), memory: clone(this.memories[c.id]!), budget: clone(c.budget), earliestExecuteTick: tick + c.budget.reactionTicks, deadlineTick: tick, nextSequence: this.sequences[c.id]! + 1 });
        if (decision && typeof (decision as Promise<PolicyDecision>).then === 'function') {
          void Promise.resolve(decision).catch(() => undefined); this.diagnostics.push(`${tick}:${c.id}:async-policy-no-op`); continue;
        }
        const result = decision as PolicyDecision;
        if (!result || !Array.isArray(result.actions)) throw new Error('invalid decision');
        const memory = clone(result.nextMemory);
        for (const action of result.actions) this.submit(c.id, action);
        this.memories[c.id] = memory;
      } catch { this.diagnostics.push(`${tick}:${c.id}:policy-error-no-op`); }
    }
    const due = this.queue.filter(c => c.executeTick === tick);
    this.queue = this.queue.filter(c => c.executeTick > tick);
    return this.engine.step(due);
  }
  observe(controllerId:string):Observation {
    const observation=this.engine.observe(controllerId);
    return clone({...observation,receipts:[...observation.receipts,...(this.rejectionReceipts[controllerId]??[])]});
  }
  checkpoint(): RunCheckpoint {
    return clone({ manifestHash: this.manifestHash, world: this.engine.snapshot(), runnerState: { queue: this.queue, sequences: this.sequences, schedule: this.schedule, assignments: this.assignments, diagnostics: this.diagnostics, rejectionReceipts:this.rejectionReceipts }, policyMemories: this.memories, continuation: 'full-local' }) as unknown as RunCheckpoint;
  }
  restore(checkpoint: RunCheckpoint): void {
    if (checkpoint.manifestHash !== this.manifestHash || checkpoint.continuation !== 'full-local') throw new Error('Checkpoint identity mismatch');
    const state = clone(checkpoint.runnerState) as unknown as {queue: AuthenticatedCommand[]; sequences: Record<string, number>; schedule: Record<string, number>; assignments: Record<string,string[]>; diagnostics: string[]; rejectionReceipts:Record<string,ActionReceipt[]>};
    if (Object.keys(state).sort().join(',')!=='assignments,diagnostics,queue,rejectionReceipts,schedule,sequences' || canonical(state.assignments) !== canonical(this.assignments) || !Array.isArray(state.queue) || !Array.isArray(state.diagnostics) || state.diagnostics.some(d=>typeof d!=='string')) throw new Error('Invalid checkpoint runner state');
    const ids=this.controllers.map(c=>c.id).sort().join(',');
    if(Object.keys(state.sequences).sort().join(',')!==ids || Object.keys(state.schedule).sort().join(',')!==ids || Object.keys(checkpoint.policyMemories).sort().join(',')!==Object.keys(this.memories).sort().join(',')) throw new Error('Invalid checkpoint controller maps');
    for(const [id,receipts] of Object.entries(state.rejectionReceipts)) {
      if(!Object.hasOwn(this.sequences,id) || !Array.isArray(receipts) || receipts.some(r=>!Number.isSafeInteger(r.sequence)||r.sequence<0||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>checkpoint.world.tick||!['rejected','expired'].includes(r.result)||typeof r.reason!=='string')) throw new Error('Invalid checkpoint receipts');
    }
    for (const c of this.controllers) {
      if (!Number.isSafeInteger(state.sequences[c.id]) || state.sequences[c.id]! < -1 || !Number.isSafeInteger(state.schedule[c.id]) || state.schedule[c.id]! < 0) throw new Error('Invalid checkpoint sequence or schedule');
      if (this.policies[c.id] && !Object.hasOwn(checkpoint.policyMemories, c.id)) throw new Error('Missing policy memory');
    }
    const before = this.engine.snapshot();
    try {
      this.engine.restore(checkpoint.world);
      const queueSequences = new Set<string>();
      const counts=new Map<string,number>();
      for (const command of state.queue) {
        // Admission age/reaction are checked against original receipt, while future delivery remains bounded.
        const key = `${command.controllerId}:${command.sequence}`;
        const invalid = this.engine.checkCommand(command);
        if ((invalid && invalid !== 'not-permitted') || queueSequences.has(key) || command.executeTick < this.engine.tick || command.sequence > state.sequences[command.controllerId]! || !this.assignments[command.controllerId]?.includes(command.actorId)) throw new Error('Invalid checkpoint queue');
        queueSequences.add(key);
        const slot=`${command.controllerId}:${command.executeTick}`;
        const count=(counts.get(slot)??0)+1;counts.set(slot,count);
        if(count>this.controllers.find(c=>c.id===command.controllerId)!.budget.actionLimitPerTick) throw new Error('Invalid checkpoint queue action limit');
      }
    } catch (error) { this.engine.restore(before); throw error; }
    this.queue = state.queue; this.sequences = state.sequences; this.schedule = state.schedule;
    this.memories = clone(checkpoint.policyMemories); this.diagnostics.splice(0, this.diagnostics.length, ...state.diagnostics);
    this.rejectionReceipts=clone(state.rejectionReceipts);
  }
}

import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ActionReceipt, JsonObject, Observation } from '../../contracts/agent-interface.js';
import type { AuthenticatedCommand, DomainEvent, Simulation, TerminalResult, WorldSnapshot } from '../../contracts/simulation-interface.js';
import { canonical, clone, freeze, hash, nextRandom, streamSeed } from './data.js';
import { compare, resolveModules, type RegisteredModule } from './registry.js';
import type { ModuleContext, RuntimeModule, SimulationConfig } from './types.js';

const tickField = {type:'integer',minimum:0,maximum:Number.MAX_SAFE_INTEGER};
const ajv = new Ajv2020({strict:true});
const idSchema = {type:'string',pattern:'^[a-z0-9][a-z0-9._-]*$',maxLength:100};
const positiveInteger = {type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER};
const configValidator = ajv.compile({type:'object',additionalProperties:false,required:['seed','tickRateHz','maxTicks','maxCommandLeadTicks','maxCommandAgeTicks','controllers','modules'],properties:{
  seed:{type:'integer',minimum:0,maximum:4294967295},tickRateHz:positiveInteger,maxTicks:positiveInteger,maxCommandLeadTicks:positiveInteger,maxCommandAgeTicks:positiveInteger,
  controllers:{type:'array',minItems:1,maxItems:256,items:{type:'object',additionalProperties:false,required:['id','actors','budget'],properties:{id:idSchema,actors:{type:'array',items:idSchema,uniqueItems:true},budget:{type:'object',additionalProperties:false,required:['decisionIntervalTicks','reactionTicks','actionLimitPerTick'],properties:{decisionIntervalTicks:positiveInteger,reactionTicks:tickField,actionLimitPerTick:{type:'integer',minimum:1,maximum:16}}}}}},
  modules:{type:'array',minItems:1,items:{type:'object',additionalProperties:false,required:['id','version','config'],properties:{id:idSchema,version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},config:{type:'object'}}}}
}});
const commandSchema = ajv.compile({type:'object',additionalProperties:false,required:['controllerId','receivedTick','actorId','sequence','observedTick','executeTick','action'],properties:{
  controllerId:{type:'string',minLength:1,maxLength:100},actorId:{type:'string',minLength:1,maxLength:100},receivedTick:tickField,sequence:tickField,observedTick:tickField,executeTick:tickField,
  action:{type:'object',additionalProperties:false,required:['kind','version','payload'],properties:{kind:{type:'string',maxLength:100},version:{type:'string',maxLength:30},payload:{type:'object'}}}
}});
type Authority = { sequences: Record<string,number>; receipts: Record<string,ActionReceipt[]>; events: DomainEvent[]; configHash: string };

export class Engine implements Simulation {
  readonly config: SimulationConfig;
  private readonly modules: RegisteredModule[];
  private world: WorldSnapshot;
  constructor(config: SimulationConfig, registry: RuntimeModule[]) {
    canonical(config);
    if (!configValidator(config)) throw new Error(`Invalid simulation config: ${ajv.errorsText(configValidator.errors)}`);
    this.config = freeze(clone(config));
    for (const key of ['tickRateHz','maxTicks','maxCommandLeadTicks','maxCommandAgeTicks'] as const) if (!Number.isSafeInteger(config[key]) || config[key] < 1) throw new Error(`Invalid ${key}`);
    if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) throw new Error('Invalid seed');
    const ids = new Set<string>(); const actors = new Set<string>();
    for (const controller of config.controllers) {
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(controller.id) || ids.has(controller.id)) throw new Error('Invalid/duplicate controller');
      ids.add(controller.id);
      const b = controller.budget;
      if (![b.decisionIntervalTicks,b.actionLimitPerTick].every(n=>Number.isSafeInteger(n)&&n>0) || !Number.isSafeInteger(b.reactionTicks) || b.reactionTicks<0 || b.reactionTicks>config.maxCommandLeadTicks) throw new Error('Invalid controller budget');
      for (const actor of controller.actors) { if (!actor || actors.has(actor)) throw new Error('Duplicate/invalid actor assignment'); actors.add(actor); }
    }
    this.modules = resolveModules(this.config.modules,registry);
    this.world = {apiVersion:'grid-rift/v0',tick:0,moduleStates:{},randomStates:{},pendingEffects:[],idAllocatorState:{sequences:{},receipts:{},events:[],configHash:hash(this.config)} as unknown as JsonObject,terminal:{kind:'running'}};
    for (const entry of this.modules) {
      const state = entry.module.initial(entry.selection.config,this.context(entry,true,[]));
      this.assertState(entry,state);
      this.world = {...this.world,moduleStates:{...this.world.moduleStates,[entry.selection.id]:clone(state)}};
    }
  }
  get tick(): number { return this.world.tick; }
  private authority(): Authority { return this.world.idAllocatorState as unknown as Authority; }
  private context(entry: RegisteredModule, mutable: boolean, events: DomainEvent[]): ModuleContext {
    return {
      tick:this.tick,tickRateHz:this.config.tickRateHz,maxTicks:this.config.maxTicks,controllers:this.config.controllers,states:freeze(clone(this.world.moduleStates)),
      random:stream=>{
        if (!mutable) throw new Error('Read-only context cannot draw randomness');
        const key = `${entry.selection.id}:${stream}`;
        const previous = this.world.randomStates[key] as number | undefined;
        const state = nextRandom(previous ?? streamSeed(this.config.seed,key));
        this.world = {...this.world,randomStates:{...this.world.randomStates,[key]:state}};
        return state/0x100000000;
      },
      emit:(kind,data,audience)=>{
        if (!mutable || !entry.module.eventKinds.includes(kind)) throw new Error('Undeclared/read-only event');
        canonical(data);
        events.push(clone({tick:this.tick,index:events.length,moduleId:entry.selection.id,kind,data,audience}));
      },
      finish:result=>{
        if (!mutable || this.world.terminal.kind !== 'running') throw new Error('Invalid terminal transition');
        canonical(result);
        if (!['finished','draw'].includes(result.kind) || result.tick !== this.tick+1) throw new Error('Invalid terminal result');
        this.world = {...this.world,terminal:clone(result)};
      }
    };
  }
  private assertState(entry:RegisteredModule,state:JsonObject): void {
    canonical(state);
    if (!entry.stateValidator(state)) throw new Error(`Invalid module state: ${entry.selection.id}`);
  }
  checkCommand(value: unknown): string | null {
    try { if (canonical(value).length>16384) return 'invalid-command'; } catch { return 'invalid-command'; }
    if (!commandSchema(value)) return 'invalid-command';
    const command = value as AuthenticatedCommand;
    const controller = this.config.controllers.find(c=>c.id===command.controllerId);
    if (!controller || !controller.actors.includes(command.actorId)) return 'unauthorized';
    if (command.receivedTick>this.tick || command.observedTick>command.receivedTick || command.receivedTick-command.observedTick>this.config.maxCommandAgeTicks || this.tick-command.observedTick>this.config.maxCommandAgeTicks+this.config.maxCommandLeadTicks) return 'invalid-timing';
    if (command.executeTick<this.tick) return 'late';
    if (command.executeTick>command.receivedTick+this.config.maxCommandLeadTicks || command.executeTick<command.observedTick+controller.budget.reactionTicks) return 'invalid-timing';
    const key = `${command.action.kind}@${command.action.version}`;
    const entry = this.modules.find(m=>m.actions.has(key));
    if (!entry || !entry.actions.get(key)!(command.action.payload)) return 'invalid-action';
    if (!entry.module.validate(freeze(clone(this.world.moduleStates[entry.selection.id] as JsonObject)),clone(command),this.context(entry,false,[]))) return 'not-permitted';
    return null;
  }
  step(commands: readonly AuthenticatedCommand[]) {
    if (this.world.terminal.kind!=='running') return clone({tick:this.tick,events:[],terminal:this.world.terminal});
    const before = this.snapshot();
    try {
      const authority = clone(this.authority()); authority.receipts = {}; authority.events=[];
      const accepted: AuthenticatedCommand[] = [];
      const counts = new Map<string,number>();
      // Malformed data is rejected before comparison, which only handles validated shapes.
      const validShapes = commands.filter(command=>{
        if (!commandSchema(command)) return false;
        try { canonical(command); return true; } catch { return false; }
      }).map(clone).sort((a,b)=>a.executeTick-b.executeTick || compare(a.controllerId,b.controllerId) || a.sequence-b.sequence || compare(a.actorId,b.actorId));
      for (const command of validShapes) {
        let reason = this.checkCommand(command);
        const last = authority.sequences[command.controllerId] ?? -1;
        if (!reason && command.executeTick!==this.tick) reason='invalid-timing';
        if (!reason && command.sequence<=last) reason='duplicate-sequence';
        if (!reason) {
          authority.sequences[command.controllerId]=command.sequence;
          const count = counts.get(command.controllerId) ?? 0;
          const limit=this.config.controllers.find(c=>c.id===command.controllerId)!.budget.actionLimitPerTick;
          if (count>=limit) reason='rate-limit'; else counts.set(command.controllerId,count+1);
        }
        const receipts=authority.receipts[command.controllerId]??=[];
        receipts.push({sequence:command.sequence,tick:this.tick,result:reason==='late'?'expired':reason?'rejected':'accepted',reason:reason??'accepted'});
        if (!reason) accepted.push(command);
      }
      const events:DomainEvent[]=[];
      for (const entry of this.modules) {
        const state=entry.module.advance(freeze(clone(this.world.moduleStates[entry.selection.id] as JsonObject)),freeze(clone(accepted.filter(c=>entry.actions.has(`${c.action.kind}@${c.action.version}`)))),entry.selection.config,this.context(entry,true,events));
        this.assertState(entry,state);
        this.world={...this.world,moduleStates:{...this.world.moduleStates,[entry.selection.id]:clone(state)}};
      }
      authority.events=events;
      this.world={...this.world,tick:this.tick+1,idAllocatorState:authority as unknown as JsonObject};
      if (this.tick>=this.config.maxTicks && this.world.terminal.kind==='running') this.world={...this.world,terminal:{kind:'draw',tick:this.tick,reason:'tick-limit',scores:{}}};
      return clone({tick:this.tick,events,terminal:this.world.terminal});
    } catch (error) { this.world=before; throw error; }
  }
  observe(controllerId:string):Observation {
    const controller=this.config.controllers.find(c=>c.id===controllerId);
    if (!controller) throw new Error('Unknown controller');
    let world:JsonObject={}; const entities:Observation['entities'][number][]=[];
    for (const entry of this.modules) {
      const projected=entry.module.project(freeze(clone(this.world.moduleStates[entry.selection.id] as JsonObject)),controllerId,this.context(entry,false,[]));
      // Namespacing public module state prevents collisions between independently registered modules.
      world={...world,[entry.selection.id]:projected.world}; entities.push(...projected.entities);
    }
    const visible=this.authority().events.filter(e=>e.audience.kind==='public'||(e.audience.kind==='controllers'&&e.audience.ids.includes(controllerId)));
    return clone({apiVersion:'grid-rift/v0',controllerId,tick:this.tick,controlledEntityIds:controller.actors,world,entities,events:visible.map((e,i)=>({localId:`${this.tick}:${i}`,tick:e.tick,kind:e.kind,data:e.data})),receipts:this.authority().receipts[controllerId]??[],capabilities:this.modules.flatMap(m=>m.module.actions.map(a=>a.capability)),messages:[]});
  }
  snapshot():WorldSnapshot { return clone(this.world); }
  restore(snapshot:WorldSnapshot):void {
    canonical(snapshot);
    if (snapshot.apiVersion!=='grid-rift/v0'||!Number.isSafeInteger(snapshot.tick)||snapshot.tick<0||snapshot.tick>this.config.maxTicks) throw new Error('Invalid snapshot');
    const authority=snapshot.idAllocatorState as unknown as Authority;
    if (authority?.configHash!==hash(this.config)||!authority.sequences||!authority.receipts||!Array.isArray(authority.events)) throw new Error('Incompatible snapshot authority');
    const ids = this.config.controllers.map(c=>c.id);
    if (Object.entries(authority.sequences).some(([id,sequence])=>!ids.includes(id)||!Number.isSafeInteger(sequence)||sequence<0)) throw new Error('Invalid snapshot sequence');
    if (Object.entries(authority.receipts).some(([id,receipts])=>!ids.includes(id)||!Array.isArray(receipts)||receipts.some(r=>!Number.isSafeInteger(r.sequence)||r.sequence<0||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>=snapshot.tick||!['accepted','rejected','expired'].includes(r.result)||typeof r.reason!=='string'))) throw new Error('Invalid snapshot receipts');
    const terminal = snapshot.terminal;
    if (!terminal || !['running','finished','draw'].includes(terminal.kind)) throw new Error('Invalid snapshot terminal');
    if (terminal.kind!=='running' && (!Number.isSafeInteger(terminal.tick)||terminal.tick!==snapshot.tick||typeof terminal.reason!=='string'||!terminal.scores||typeof terminal.scores!=='object'||Array.isArray(terminal.scores)||(terminal.kind==='finished'&&(!Array.isArray(terminal.winners)||terminal.winners.some(id=>typeof id!=='string'))))) throw new Error('Invalid snapshot terminal');
    if (terminal.kind==='running'&&snapshot.tick>=this.config.maxTicks) throw new Error('Invalid running snapshot at limit');
    if (Object.keys(snapshot.moduleStates).sort().join('|')!==this.modules.map(m=>m.selection.id).sort().join('|')) throw new Error('Incompatible snapshot modules');
    for (const entry of this.modules) this.assertState(entry,snapshot.moduleStates[entry.selection.id] as JsonObject);
    for (const state of Object.values(snapshot.randomStates)) if (!Number.isInteger(state)||Number(state)<=0||Number(state)>0xffffffff) throw new Error('Invalid random stream state');
    if (!Array.isArray(snapshot.pendingEffects)||snapshot.pendingEffects.length) throw new Error('Unsupported pending effects in Stage 0');
    this.world=clone(snapshot);
  }
  stateHash():string { return hash(this.world); }
}

import type { JsonObject } from '../../../contracts/agent-interface.js';
import type { ArenaMap, MovementBody, CombatUnit, Projectile, CombatTrace, RelayView, Point } from '../../../contracts/tactical-types.js';
import type { RuntimeModule, ModuleContext } from '../../core/types.js';
import { distance, clear, route, bounded, wallHit, circleHit, legal } from './geometry.js';
type DashRequest = {
    actorId: string;
    x: number;
    z: number;
    startTick: number;
};
type MoveState = {
    speed: number;
    bodyRadius: number;
    bodies: MovementBody[];
    lastMoveTicks: Record<string, number>;
};
type FightState = {
    units: CombatUnit[];
    projectiles: Projectile[];
    traces: CombatTrace[];
    dashRequests: DashRequest[];
    config: Record<string, number>;
    targetSetTicks: Record<string, number>;
};
const json = (v: unknown) => v as JsonObject;
const obj = (properties: Record<string, unknown>) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const num = { type: 'number' }, str = { type: 'string' }, bool = { type: 'boolean' }, integer = { type: 'integer', minimum: 0 };
const positive = { type: 'number', exclusiveMinimum: 0 }, positiveInt = { type: 'integer', minimum: 1 };
const commandStamps = { type: 'object', additionalProperties: { type: 'integer', minimum: -1 } };
const nullable = (s: unknown) => ({ anyOf: [s, { type: 'null' }] });
const point = obj({ x: num, z: num });
const arr = (items: unknown) => ({ type: 'array', items });
const bodySchema = obj({ id: str, controllerId: str, teamId: str, x: num, z: num, facingX: num, facingZ: num, destination: nullable(point), path: arr(point), dash: nullable(obj({ dx: num, dz: num, ticks: integer })) });
const unitSchema = obj({ id: str, hp: integer, maxHp: positiveInt, alive: bool, respawnTick: integer, basicReadyTick: integer, pulseReadyTick: integer, dashReadyTick: integer, targetId: nullable(str), windup: nullable(obj({ x: num, z: num, launchTick: integer })) });
const projectileSchema = obj({ id: str, ownerId: str, teamId: str, x: num, z: num, dx: num, dz: num, remaining: positive });
const traceSchema = obj({ kind: str, from: point, to: point, tick: integer, actorId: str });
const mapSchema = obj({ width: positive, depth: positive, layout: str, mapVersion: str, spawnRecoveryRadius: positive, blockers: arr(obj({ id: str, x: num, z: num, w: positive, d: positive, height: positive })), spawns: arr(obj({ actorId: str, controllerId: str, teamId: str, x: num, z: num })), relay: point });
const fightFields = { health: positiveInt, basicDamage: positiveInt, basicRange: positive, basicIntervalTicks: positiveInt, pulseDamage: positiveInt, pulseRange: positive, pulseRadius: positive, pulseSpeed: positive, pulseWindupTicks: positiveInt, pulseCooldownTicks: positiveInt, dashDistance: positive, dashDurationTicks: positiveInt, dashCooldownTicks: positiveInt, respawnTicks: positiveInt };
function base(id: string, phase: string, deps: string[], configSchema: object, stateSchema: object): RuntimeModule {
    return {
        descriptor: { id, version: '0.1.0', apiVersion: 'grid-rift/v0', dependencies: deps.map(id => ({ id, version: '0.1.0' })), phase, reads: deps, writes: [id], configurationSchemaId: `${id}/config/0.1.0`, stateSchemaId: `${id}/state/0.1.0` },
        configSchema, stateSchema, actions: [], eventKinds: [], initial: () => ({}), validate: () => false, advance: s => s, project: () => ({ world: {}, entities: [] })
    };
}
const map = (c: ModuleContext) => c.states['world.planar'] as unknown as ArenaMap;
const moves = (c: ModuleContext) => c.states['movement.planar'] as unknown as MoveState;
const fight = (c: ModuleContext) => c.states['combat.runner'] as unknown as FightState | undefined;
function visiblePoint(p: Point, controllerId: string, c: ModuleContext) { const perception = c.states['perception.radius-los'] as unknown as {
    radius: number;
    shareTeamVision: boolean;
}; const bodies = moves(c)?.bodies ?? []; const mine = bodies.filter(b => b.controllerId === controllerId); return bodies.some(b => (b.controllerId === controllerId || (perception.shareTeamVision && mine.some(m => m.teamId === b.teamId))) && fight(c)?.units.find(u => u.id === b.id)?.alive !== false && distance(b, p) <= perception.radius && clear(b, p, map(c))); }
function visibleBody(b: MovementBody, id: string, c: ModuleContext) { return b.controllerId === id || (fight(c)?.units.find(u => u.id === b.id)?.alive !== false && visiblePoint(b, id, c)); }
const action = (kind: string, schema: object) => ({ capability: { kind, version: '0.1.0', payloadSchemaId: `${kind}/0.1.0` }, schema });
const world = base('world.planar', 'input', [], obj({ width: { ...positive, maximum: 10000 }, depth: { ...positive, maximum: 10000 }, layout: { const: 'duel-ridges' } }), mapSchema);
world.initial = (config, c) => { if (config.width !== 80 || config.depth !== 60 || c.controllers.length !== 2 || c.controllers.some(p => !['p1', 'p2'].includes(p.id) || p.actors.length !== 1))
    throw new Error('duel-ridges/v1 requires 80x60 and p1/p2 with one actor each'); return json({ width: 80, depth: 60, layout: 'duel-ridges', mapVersion: 'duel-ridges/v1', spawnRecoveryRadius: 3, relay: { x: 40, z: 30 }, blockers: [{ id: 'ridge-west', x: 26, z: 24, w: 8, d: 16, height: 3 }, { id: 'ridge-east', x: 54, z: 36, w: 8, d: 16, height: 3 }, { id: 'relay-cover', x: 40, z: 22, w: 5, d: 3, height: 2 }], spawns: c.controllers.map(p => ({ actorId: p.actors[0]!, controllerId: p.id, teamId: p.id === 'p1' ? 'alpha' : 'beta', x: p.id === 'p1' ? 14 : 66, z: p.id === 'p1' ? 34 : 26 })) }); };
world.project = s => ({ world: s, entities: [] });
const perception = base('perception.radius-los', 'input', ['world.planar'], obj({ radius: { ...positive, maximum: 10000 }, shareTeamVision: bool }), obj({ radius: positive, shareTeamVision: bool }));
perception.initial = c => c;
perception.project = s => ({ world: { radius: s.radius! }, entities: [] });
const movement = base('movement.planar', 'resolve', ['world.planar', 'perception.radius-los'], obj({ speed: { ...positive, maximum: 100 }, bodyRadius: { ...positive, maximum: 10 } }), obj({ speed: positive, bodyRadius: positive, bodies: arr(bodySchema), lastMoveTicks: commandStamps }));
// Combat requests are read from the previous effects phase; no cyclic lifecycle dependency.
movement.descriptor = { ...movement.descriptor, reads: ['world.planar', 'perception.radius-los', 'combat.runner'] };
movement.actions = [action('movement.move-to', point)];
movement.initial = (cfg, c) => json({ ...cfg, lastMoveTicks: Object.fromEntries(map(c).spawns.map(s => [s.actorId, -1])), bodies: map(c).spawns.map(s => ({ id: s.actorId, controllerId: s.controllerId, teamId: s.teamId, x: s.x, z: s.z, facingX: s.controllerId === 'p1' ? 1 : -1, facingZ: 0, destination: null, path: [], dash: null })) });
movement.validate = (s, cmd, c) => { const state = s as unknown as MoveState; return state.bodies.some(b => b.id === cmd.actorId) && fight(c)?.units.find(u => u.id === cmd.actorId)?.alive !== false && legal(cmd.action.payload as unknown as Point, map(c), state.bodyRadius); };
movement.advance = (s, commands, _cfg, c) => {
    const state = structuredClone(s) as unknown as MoveState;
    const arena = map(c), combat = fight(c);
    for (const body of state.bodies) {
        const unit = combat?.units.find(u => u.id === body.id);
        if (unit && !unit.alive) {
            body.destination = null;
            body.path = [];
            body.dash = null;
            if (c.tick >= unit.respawnTick) {
                const spawn = arena.spawns.find(p => p.actorId === body.id)!;
                body.x = spawn.x;
                body.z = spawn.z;
            }
            continue;
        }
        for (const cmd of commands.filter(cmd => cmd.actorId === body.id)) {
            state.lastMoveTicks[body.id] = c.tick;
            const dest = cmd.action.payload as unknown as Point;
            body.path = route(body, dest, arena, state.bodyRadius);
            body.destination = body.path.length ? { x: dest.x, z: dest.z } : null;
        }
        // A prior attack intent stops movement on entering range. A newer move wins.
        const target = state.bodies.find(b => b.id === unit?.targetId);
        if (target && combat?.units.find(u => u.id === target.id)?.alive
            && !commands.some(cmd => cmd.actorId === body.id)
            && (combat.targetSetTicks[body.id] ?? -1) >= (state.lastMoveTicks[body.id] ?? -1)
            && distance(body, target) <= combat.config.basicRange!
            && visibleBody(target, body.controllerId, c)) {
            body.path = [];
            body.destination = null;
        }
        const request = combat?.dashRequests.find(d => d.actorId === body.id && d.startTick === c.tick);
        if (request) {
            const d = distance(body, request);
            if (d > 0) {
                const length = Math.min(d, combat!.config.dashDistance!);
                body.dash = { dx: (request.x - body.x) / d * length / combat!.config.dashDurationTicks!, dz: (request.z - body.z) / d * length / combat!.config.dashDurationTicks!, ticks: combat!.config.dashDurationTicks! };
                body.path = [];
                body.destination = null;
            }
        }
        if (body.dash) {
            const to = bounded({ x: body.x + body.dash.dx, z: body.z + body.dash.dz }, arena, state.bodyRadius), t = wallHit(body, to, arena, state.bodyRadius);
            const f = Number.isFinite(t) ? Math.max(0, t - 0.001) : 1;
            body.x += (to.x - body.x) * f;
            body.z += (to.z - body.z) * f;
            body.facingX = body.dash.dx / Math.hypot(body.dash.dx, body.dash.dz);
            body.facingZ = body.dash.dz / Math.hypot(body.dash.dx, body.dash.dz);
            body.dash.ticks--;
            if (f < 1 || body.dash.ticks === 0)
                body.dash = null;
            continue;
        }
        let remaining = state.speed / c.tickRateHz;
        while (remaining > 0 && body.path.length) {
            const dest = body.path[0]!, d = distance(body, dest);
            if (d < 1e-8) {
                body.path.shift();
                continue;
            }
            const step = Math.min(d, remaining);
            body.facingX = (dest.x - body.x) / d;
            body.facingZ = (dest.z - body.z) / d;
            body.x += body.facingX * step;
            body.z += body.facingZ * step;
            remaining -= step;
            if (step === d)
                body.path.shift();
        }
        if (!body.path.length)
            body.destination = null;
    }
    return json(state);
};
movement.project = (s, id, c) => { const state = s as unknown as MoveState; return { world: { speed: state.speed, bodyRadius: state.bodyRadius }, entities: state.bodies.filter(b => visibleBody(b, id, c)).map(b => ({ id: b.id, components: json({ movement: b.controllerId === id ? b : { id: b.id, controllerId: b.controllerId, teamId: b.teamId, x: b.x, z: b.z, facingX: b.facingX, facingZ: b.facingZ, dash: b.dash } }) })) }; };
const combat = base('combat.runner', 'effects', ['movement.planar', 'perception.radius-los'], obj(fightFields), obj({ units: arr(unitSchema), projectiles: arr(projectileSchema), traces: arr(traceSchema), dashRequests: arr(obj({ actorId: str, x: num, z: num, startTick: integer })), config: obj(fightFields), targetSetTicks: commandStamps }));
combat.descriptor = { ...combat.descriptor, reads: ['world.planar', 'movement.planar', 'perception.radius-los'] };
combat.actions = [action('combat.attack', obj({ targetId: str })), action('combat.cast', obj({ ability: { enum: ['pulse', 'dash'] }, x: num, z: num }))];
combat.eventKinds = ['combat.hit', 'combat.death', 'combat.respawn'];
combat.initial = (cfg, c) => json({ config: cfg, projectiles: [], traces: [], dashRequests: [], targetSetTicks: Object.fromEntries(moves(c).bodies.map(b => [b.id, -1])), units: moves(c).bodies.map(b => ({ id: b.id, hp: cfg.health, maxHp: cfg.health, alive: true, respawnTick: 0, basicReadyTick: 0, pulseReadyTick: 0, dashReadyTick: 0, targetId: null, windup: null })) });
combat.validate = (s, cmd, c) => {
    const state = s as unknown as FightState, unit = state.units.find(u => u.id === cmd.actorId);
    if (!unit?.alive)
        return false;
    const body = moves(c).bodies.find(b => b.id === unit.id)!;
    if (cmd.action.kind === 'combat.attack') {
        const target = moves(c).bodies.find(b => b.id === cmd.action.payload.targetId);
        return !!target && target.teamId !== body.teamId && !!state.units.find(u => u.id === target.id)?.alive && visibleBody(target, cmd.controllerId, c);
    }
    const p = cmd.action.payload;
    return !unit.windup && distance(body, p as unknown as Point) > 0 && (p.ability === 'pulse' ? c.tick >= unit.pulseReadyTick : c.tick >= unit.dashReadyTick);
};
combat.advance = (s, commands, _cfg, c) => {
    const state = structuredClone(s) as unknown as FightState, cfg = state.config, bodies = moves(c).bodies, arena = map(c), damage = new Map<string, number>();
    state.traces = state.traces.filter(t => c.tick - t.tick < 8);
    state.dashRequests = state.dashRequests.filter(d => d.startTick >= c.tick);
    const audience = (a: Point, b: Point) => ({ kind: 'controllers' as const, ids: c.controllers.filter(p => visiblePoint(a, p.id, c) && visiblePoint(b, p.id, c)).map(p => p.id) });
    const hit = (unit: CombatUnit, amount: number, owner: MovementBody, target: MovementBody, kind: string) => { damage.set(unit.id, (damage.get(unit.id) ?? 0) + amount); state.traces.push({ kind, from: { x: owner.x, z: owner.z }, to: { x: target.x, z: target.z }, tick: c.tick, actorId: owner.id }); c.emit('combat.hit', { actorId: owner.id, targetId: unit.id, damage: amount, kind }, audience(owner, target)); };
    for (const unit of state.units) {
        if ((moves(c).lastMoveTicks[unit.id] ?? -1) >= (state.targetSetTicks[unit.id] ?? -1))
            unit.targetId = null;
        if (!unit.alive && c.tick >= unit.respawnTick) {
            unit.alive = true;
            unit.hp = unit.maxHp;
            unit.targetId = null;
            unit.windup = null;
            c.emit('combat.respawn', { actorId: unit.id }, { kind: 'controllers', ids: [bodies.find(b => b.id === unit.id)!.controllerId] });
        }
    }
    for (const cmd of commands) {
        const unit = state.units.find(u => u.id === cmd.actorId)!;
        if (!unit.alive)
            continue;
        const p = cmd.action.payload;
        if (cmd.action.kind === 'combat.attack') {
            unit.targetId = p.targetId as string;
            state.targetSetTicks[unit.id] = c.tick;
            continue;
        }
        if (unit.windup)
            continue;
        unit.targetId = null;
        if (p.ability === 'pulse' && c.tick >= unit.pulseReadyTick) {
            unit.windup = { x: p.x as number, z: p.z as number, launchTick: c.tick + cfg.pulseWindupTicks! };
            unit.pulseReadyTick = c.tick + cfg.pulseCooldownTicks!;
        }
        if (p.ability === 'dash' && c.tick >= unit.dashReadyTick) {
            unit.dashReadyTick = c.tick + cfg.dashCooldownTicks!;
            state.dashRequests.push({ actorId: unit.id, x: p.x as number, z: p.z as number, startTick: c.tick + 1 });
        }
    }
    for (const unit of state.units) {
        if (!unit.alive)
            continue;
        const body = bodies.find(b => b.id === unit.id)!;
        if (unit.windup && c.tick >= unit.windup.launchTick) {
            const d = distance(body, unit.windup);
            if (d > 0)
                state.projectiles.push({ id: `pulse-${unit.id}-${c.tick}`, ownerId: unit.id, teamId: body.teamId, x: body.x, z: body.z, dx: (unit.windup.x - body.x) / d, dz: (unit.windup.z - body.z) / d, remaining: cfg.pulseRange! });
            unit.windup = null;
        }
        if (!unit.windup && unit.targetId && c.tick >= unit.basicReadyTick) {
            const target = bodies.find(b => b.id === unit.targetId), other = state.units.find(u => u.id === unit.targetId);
            if (target && other?.alive && distance(body, target) <= cfg.basicRange! && visibleBody(target, body.controllerId, c)) {
                hit(other, cfg.basicDamage!, body, target, 'basic');
                unit.basicReadyTick = c.tick + cfg.basicIntervalTicks!;
            }
        }
    }
    const remaining: Projectile[] = [];
    for (const p of state.projectiles) {
        const travel = Math.min(p.remaining, cfg.pulseSpeed! / c.tickRateHz), to = { x: p.x + p.dx * travel, z: p.z + p.dz * travel };
        let first = wallHit(p, to, arena, cfg.pulseRadius!), victim: CombatUnit | undefined;
        for (const unit of state.units) {
            const body = bodies.find(b => b.id === unit.id)!;
            if (!unit.alive || body.teamId === p.teamId)
                continue;
            const t = circleHit(p, to, body, cfg.pulseRadius! + moves(c).bodyRadius);
            if (t < first) {
                first = t;
                victim = unit;
            }
        }
        if (victim) {
            const body = bodies.find(b => b.id === victim!.id)!, owner = bodies.find(b => b.id === p.ownerId)!;
            hit(victim, cfg.pulseDamage!, owner, body, 'pulse');
        }
        if (first === Infinity) {
            p.x = to.x;
            p.z = to.z;
            p.remaining -= travel;
            if (p.remaining > 1e-8 && p.x >= 0 && p.z >= 0 && p.x <= arena.width && p.z <= arena.depth)
                remaining.push(p);
        }
    }
    state.projectiles = remaining;
    for (const unit of state.units) {
        unit.hp = Math.max(0, unit.hp - (damage.get(unit.id) ?? 0));
        if (unit.alive && unit.hp === 0) {
            unit.alive = false;
            unit.respawnTick = c.tick + cfg.respawnTicks!;
            unit.windup = null;
            unit.targetId = null;
            const body = bodies.find(b => b.id === unit.id)!;
            c.emit('combat.death', { actorId: unit.id }, audience(body, body));
        }
    }
    for (const unit of state.units) {
        const spawn = arena.spawns.find(s => s.actorId === unit.id)!;
        const body = bodies.find(b => b.id === unit.id)!;
        if (unit.alive && distance(body, spawn) <= 3)
            unit.hp = Math.min(unit.maxHp, unit.hp + 1);
    }
    return json(state);
};
combat.project = (s, id, c) => { const state = s as unknown as FightState, bodies = moves(c).bodies; return { world: json({ projectiles: state.projectiles.filter(p => { const owner = bodies.find(b => b.id === p.ownerId)!; return visibleBody(owner, id, c) && visiblePoint(p, id, c); }), traces: state.traces.filter(t => visiblePoint(t.from, id, c) && visiblePoint(t.to, id, c)), basicRange: state.config.basicRange, pulseRange: state.config.pulseRange, pulseRadius: state.config.pulseRadius, dashDistance: state.config.dashDistance, pulseCooldownTicks: state.config.pulseCooldownTicks, dashCooldownTicks: state.config.dashCooldownTicks }), entities: state.units.filter(u => visibleBody(bodies.find(b => b.id === u.id)!, id, c)).map(u => ({ id: u.id, components: json({ combat: bodies.find(b => b.id === u.id)!.controllerId === id ? u : { id: u.id, hp: u.hp, maxHp: u.maxHp, alive: u.alive, windup: u.windup } }) })) }; };
// Shared simulation-owned facing. Target IDs stay private; observers receive only visible body orientation.
type FacingState = { bodies: { id:string; facingX:number; facingZ:number; lastX:number; lastZ:number }[] };
const orientation = base('orientation.combat', 'effects', ['world.planar', 'movement.planar', 'perception.radius-los', 'combat.runner'], obj({}), obj({ bodies:arr(obj({id:str,facingX:num,facingZ:num,lastX:num,lastZ:num})) }));
orientation.initial = (_cfg,c) => json({bodies:moves(c).bodies.map(b=>({id:b.id,facingX:b.facingX,facingZ:b.facingZ,lastX:b.x,lastZ:b.z}))});
orientation.advance = (s,_commands,_cfg,c) => {
    const state=structuredClone(s) as unknown as FacingState, combat=fight(c)!;
    for(const facing of state.bodies) {
        const body=moves(c).bodies.find(b=>b.id===facing.id)!,unit=combat.units.find(u=>u.id===facing.id)!;
        const moved=Math.hypot(body.x-facing.lastX,body.z-facing.lastZ)>1e-8;
        const hit=combat.traces.find(t=>t.actorId===body.id&&t.kind==='basic'&&t.tick===c.tick);
        const target=moves(c).bodies.find(b=>b.id===unit.targetId);
        const aimingTarget=target&&combat.units.find(u=>u.id===target.id)?.alive&&distance(body,target)<=combat.config.basicRange!&&visibleBody(target,body.controllerId,c)?target:undefined;
        const aim=unit.windup??(hit?hit.to:!body.dash&&!moved&&!body.destination?aimingTarget:undefined);
        if(!unit.alive||(!aim&&(body.dash||moved))){facing.facingX=body.facingX;facing.facingZ=body.facingZ;}
        else if(aim){const dx=aim.x-body.x,dz=aim.z-body.z,d=Math.hypot(dx,dz);if(d>1e-8){facing.facingX=dx/d;facing.facingZ=dz/d;}}
        facing.lastX=body.x;facing.lastZ=body.z;
    }
    return json(state);
};
orientation.project = (s,id,c) => ({world:{},entities:(s as unknown as FacingState).bodies.filter(f=>visibleBody(moves(c).bodies.find(b=>b.id===f.id)!,id,c)).map(f=>({id:f.id,components:json({orientation:{facingX:f.facingX,facingZ:f.facingZ}})}))});
const relaySchema = obj({ x: num, z: num, radius: positive, owner: nullable(str), capturing: nullable(str), progress: integer, captureTicks: positiveInt, contested: bool, scores: { type: 'object', additionalProperties: integer }, scoreToWin: positiveInt });
const objective = base('objective.relay', 'termination', ['world.planar', 'movement.planar', 'combat.runner'], obj({ zoneCount: { const: 1 }, radius: positive, captureTicks: positiveInt, scorePerTick: positiveInt, requirePresence: { const: true } }), relaySchema);
objective.descriptor = { ...objective.descriptor, reads: ['world.planar', 'movement.planar', 'combat.runner', 'rules.relay-score'] };
objective.initial = (cfg, c) => json({ ...map(c).relay, radius: cfg.radius, owner: null, capturing: null, progress: 0, captureTicks: cfg.captureTicks, contested: false, scores: { alpha: 0, beta: 0 }, scoreToWin: 600 });
objective.advance = (s, _commands, cfg, c) => {
    const relay = structuredClone(s) as unknown as RelayView;
    const teams = [...new Set(moves(c).bodies.filter(b => fight(c)!.units.find(u => u.id === b.id)!.alive && distance(b, relay) <= relay.radius).map(b => b.teamId))];
    relay.contested = teams.length > 1;
    if (teams.length !== 1) {
        relay.capturing = null;
        relay.progress = 0;
    }
    else {
        const team = teams[0]!;
        if (relay.owner === team) {
            relay.capturing = null;
            relay.progress = 0;
        }
        else {
            if (relay.capturing !== team) {
                relay.capturing = team;
                relay.progress = 0;
            }
            relay.progress++;
            if (relay.progress >= relay.captureTicks) {
                relay.owner = team;
                relay.capturing = null;
                relay.progress = 0;
            }
        }
        if (relay.owner === team)
            relay.scores[team] = (relay.scores[team] ?? 0) + (cfg.scorePerTick as number);
    }
    return json(relay);
};
objective.project = (s, _id, c) => ({ world: { ...s, scoreToWin: (c.states['rules.relay-score'] as JsonObject)?.scoreToWin ?? s.scoreToWin! }, entities: [] });
const rules = base('rules.relay-score', 'termination', ['objective.relay'], obj({ scoreToWin: positiveInt, timeoutTiebreak: { const: 'score-then-draw' } }), obj({ terminal: str, winners: arr(str), scoreToWin: positiveInt }));
rules.initial = cfg => ({ terminal: 'running', winners: [], scoreToWin: cfg.scoreToWin! });
rules.advance = (s, _commands, cfg, c) => { const scores = (c.states['objective.relay'] as JsonObject).scores as Record<string, number>; const tick = c.tick + 1; let winners = Object.keys(scores).filter(t => scores[t]! >= (cfg.scoreToWin as number)).sort(); const limit = tick >= c.maxTicks; if (!winners.length && !limit)
    return s; if (!winners.length) {
    const best = Math.max(...Object.values(scores));
    winners = Object.keys(scores).filter(t => scores[t] === best).sort();
} const draw = winners.length !== 1; c.finish(draw ? { kind: 'draw', tick, reason: limit ? 'timeout' : 'score', scores } : { kind: 'finished', tick, winners, reason: limit ? 'timeout' : 'score', scores }); return { ...s, terminal: draw ? 'draw' : 'finished', winners: draw ? [] : winners }; };
rules.project = s => ({ world: { terminal: s.terminal!, winners: s.winners! }, entities: [] });
export const tacticalModules: RuntimeModule[] = [world, perception, movement, combat, orientation, objective, rules];

/** Module-specific Stage 1 data, version 0.1.0; not universal core requirements. */
export interface Point { x: number; z: number }
export interface Blocker extends Point { id: string; w: number; d: number; height: number }
export interface Spawn extends Point { actorId: string; controllerId: string; teamId: string }
export interface ArenaMap {
  width: number; depth: number; layout: string; mapVersion: string;
  blockers: Blocker[]; spawns: Spawn[]; relay: Point;
  spawnRecoveryRadius?: number;
}
export interface MovementBody extends Point {
  id: string; controllerId: string; teamId: string;
  facingX: number; facingZ: number; destination: Point | null; path: Point[];
  dash: { dx: number; dz: number; ticks: number } | null;
}
export interface CombatUnit {
  id: string; hp: number; maxHp: number; alive: boolean; respawnTick: number;
  basicReadyTick: number; pulseReadyTick: number; dashReadyTick: number;
  targetId: string | null; windup: { x: number; z: number; launchTick: number } | null;
}
export interface Projectile extends Point {
  id: string; ownerId: string; teamId: string; dx: number; dz: number; remaining: number;
}
export interface CombatTrace { kind: string; from: Point; to: Point; tick: number; actorId: string }
export interface RelayView extends Point {
  radius: number; owner: string | null; capturing: string | null; progress: number;
  captureTicks: number; contested: boolean; scores: Record<string, number>; scoreToWin: number;
}
export interface TacticalEntity {
  id: string;
  components: { movement?: MovementBody; combat?: CombatUnit };
}
/** Each module's public projection is namespaced by module ID in Observation.world. */
export interface TacticalWorld {
  'world.planar': ArenaMap;
  'movement.planar': { speed: number; bodyRadius: number };
  'perception.radius-los': { radius: number };
  'combat.runner': { projectiles: Projectile[]; traces: CombatTrace[]; basicRange: number; pulseRange: number; pulseRadius: number; dashDistance: number };
  'objective.relay': RelayView;
  'rules.relay-score': { terminal: string; winners: string[] };
}

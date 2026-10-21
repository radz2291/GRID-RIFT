import type { TacticalEntity } from '../../contracts/tactical-types.js';

/** Visual facing only. Uses the same permitted entities as the battlefield renderer. */
export function runnerYaw(entity:TacticalEntity, visibleEntities:readonly TacticalEntity[]):number {
  const body=entity.components.movement, unit=entity.components.combat;
  if(!body)return 0;
  const native=entity.components.orientation;
  if(native)return Math.atan2(-native.facingX,-native.facingZ);
  const movementYaw=Math.atan2(-body.facingX,-body.facingZ);
  if(!unit?.alive||body.dash)return movementYaw;
  // A confirmed pulse has its own aim. A newer movement order takes precedence over a basic target.
  const target=unit.windup??(!body.destination?visibleEntities.find(e=>e.id===unit.targetId&&e.components.combat?.alive)?.components.movement:undefined);
  if(!target)return movementYaw;
  const dx=target.x-body.x,dz=target.z-body.z;
  return Math.hypot(dx,dz)>1e-8?Math.atan2(-dx,-dz):movementYaw;
}

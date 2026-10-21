import type { ArenaMap, Blocker, Point } from '../../contracts/tactical-types.js';
import { clear, wallHit } from '../modules/tactical/geometry.js';

/** Presentation uses only known terrain and permitted living sight sources. No enemy positions. */
export function inSight(point:Point,sources:readonly Point[],radius:number,map:ArenaMap):boolean {
  return sources.some(source=>(source.x-point.x)**2+(source.z-point.z)**2<=radius**2&&clear(source,point,map));
}
/** Cast an ordered visibility contour, with extra rays either side of each cover corner. */
export function sightPolygons(map:ArenaMap,sources:readonly Point[],radius:number):Point[][] {
  return sources.map(source=>{
    const tau=Math.PI*2,angles=Array.from({length:256},(_,i)=>i*tau/256);
    for(const blocker of map.blockers)for(const sx of [-1,1])for(const sz of [-1,1]) {
      const angle=Math.atan2(blocker.z+sz*blocker.d/2-source.z,blocker.x+sx*blocker.w/2-source.x);
      for(const offset of [-1e-6,0,1e-6])angles.push((angle+offset+tau)%tau);
    }
    return angles.sort((a,b)=>a-b).map(angle=>{
      const end={x:source.x+Math.cos(angle)*radius,z:source.z+Math.sin(angle)*radius};
      const fraction=Math.min(1,wallHit(source,end,map));
      return {x:source.x+(end.x-source.x)*fraction,z:source.z+(end.z-source.z)*fraction};
    });
  });
}
/** A solid building is revealed as an object when an exterior face is visible, not at its blocked centre. */
export function structureInSight(blocker:Blocker,sources:readonly Point[],radius:number,map:ArenaMap):boolean {
  const left=blocker.x-blocker.w/2-.025,right=blocker.x+blocker.w/2+.025,top=blocker.z-blocker.d/2-.025,bottom=blocker.z+blocker.d/2+.025;
  for(const source of sources) {
    const points=[{x:Math.max(left,Math.min(right,source.x)),z:Math.max(top,Math.min(bottom,source.z))}];
    for(const x of [left,blocker.x,right])for(const z of [top,blocker.z,bottom])if(x!==blocker.x||z!==blocker.z)points.push({x,z});
    if(points.some(point=>inSight(point,[source],radius,map)))return true;
  }
  return false;
}

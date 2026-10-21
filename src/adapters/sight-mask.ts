import type { ArenaMap, Point } from '../../contracts/tactical-types.js';
import { clear } from '../modules/tactical/geometry.js';

/** Presentation uses only known terrain and permitted living sight sources. No enemy positions. */
export function inSight(point:Point,sources:readonly Point[],radius:number,map:ArenaMap):boolean {
  return sources.some(source=>(source.x-point.x)**2+(source.z-point.z)**2<=radius**2&&clear(source,point,map));
}
export function sightMask(map:ArenaMap,sources:readonly Point[],radius:number,columns:number,rows:number,output=new Uint8Array(columns*rows)):Uint8Array {
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++) {
    const point={x:(column+.5)*map.width/columns,z:(row+.5)*map.depth/rows};
    output[row*columns+column]=inSight(point,sources,radius,map)?255:0;
  }
  return output;
}

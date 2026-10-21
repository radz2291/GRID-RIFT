import * as THREE from 'three';
import type { CombatTrace, Point } from '../../../contracts/tactical-types.js';

export const SHOT_HEIGHT=1.18;
/** Cylinder's local Y axis is aligned directly between endpoints; no coupled Euler rotations. */
export function makeBeam(a:Point,b:Point,color:number,opacity:number,height=.14):THREE.Mesh {
  const start=new THREE.Vector3(a.x,height,a.z),end=new THREE.Vector3(b.x,height,b.z);
  const delta=end.clone().sub(start),length=delta.length();
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,Math.max(length,1e-8),6),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  if(length>1e-8)mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.divideScalar(length));
  else mesh.visible=false;
  return mesh;
}
export function makeCombatTrace(trace:CombatTrace,color:number):THREE.Mesh {
  if(trace.kind==='basic')return makeBeam(trace.from,trace.to,color,.95,SHOT_HEIGHT);
  // Pulse travel is already shown by its projectile. Its hit is a local impact, never a new beam.
  const impact=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false}));
  impact.position.set(trace.to.x,SHOT_HEIGHT,trace.to.z);
  return impact;
}

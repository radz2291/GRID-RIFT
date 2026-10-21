import * as THREE from 'three';
import { runnerYaw } from '../runner-facing.js';
import { makeBeam, makeCombatTrace, SHOT_HEIGHT } from './combat-visuals.js';
import { sightMask } from '../sight-mask.js';
import { shadeBySight } from './sight-shading.js';
import type { Observation } from '../../../contracts/agent-interface.js';
import type { ArenaMap, Point, TacticalEntity, TacticalWorld } from '../../../contracts/tactical-types.js';

const CYAN = 0x82e6ec, AMBER = 0xefb47b;
export function publicView(observation: Observation): { world: TacticalWorld; entities: TacticalEntity[] } {
  return { world: observation.world as unknown as TacticalWorld, entities: observation.entities as unknown as TacticalEntity[] };
}
export class Battlefield {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(47, 1, .1, 500);
  private gl: THREE.WebGLRenderer;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private target = new THREE.Vector3(40, 0, 30);
  private zoom = 58;
  private peekYaw = 0;
  private peekLift = 0;
  private desiredYaw = 0;
  private desiredLift = 0;
  private cameraFrameAt = performance.now();
  private map?: ArenaMap;
  private actors = new Map<string, THREE.Group>();
  private dynamic = new THREE.Group();
  private relay = new THREE.Group();
  private destination: THREE.Mesh;
  private aim = new THREE.Group();
  private sightColumns = 160;
  private sightRows = 120;
  private sightData = new Uint8Array(this.sightColumns*this.sightRows);
  private sightTexture = new THREE.DataTexture(this.sightData,this.sightColumns,this.sightRows,THREE.RedFormat);
  private sightMapSize = new THREE.Vector2(80,60);
  private sightMapCanvas = document.createElement('canvas');
  private sightKey = '';
  private selected: THREE.Mesh;
  private reduced = false;
  private observation?: Observation;
  private updateKey = '';
  constructor(private canvas: HTMLCanvasElement) {
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.gl.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping; this.gl.toneMappingExposure = 1.3;
    this.scene.background = this.sky(); this.scene.fog = new THREE.FogExp2(0x74838f, .007);
    this.scene.add(new THREE.HemisphereLight(0xb7d8ed, 0x32333b, 2.5));
    const sun = new THREE.DirectionalLight(0xffd5a4, 3.1); sun.position.set(-50, 60, -35); this.scene.add(sun);
    this.scene.add(this.dynamic, this.relay, this.aim);
    this.destination = this.ring(.65, CYAN, .075); this.destination.visible = false; this.scene.add(this.destination);
    this.selected = this.ring(1, AMBER, .1); this.selected.visible = false; this.scene.add(this.selected);
    this.sightTexture.minFilter=THREE.LinearFilter;this.sightTexture.magFilter=THREE.LinearFilter;
    this.sightMapCanvas.width=this.sightColumns;this.sightMapCanvas.height=this.sightRows;
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  private sky(): THREE.CanvasTexture {
    const c = document.createElement('canvas'); c.width = 4; c.height = 512;
    const x = c.getContext('2d')!; const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#233247'); g.addColorStop(.48, '#7b8696'); g.addColorStop(.77, '#d8b39a'); g.addColorStop(1, '#758a96'); x.fillStyle = g; x.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  private material(color: number, metalness = .05): THREE.MeshStandardMaterial { const material=new THREE.MeshStandardMaterial({ color, roughness: .86, metalness }); shadeBySight(material,this.sightTexture,this.sightMapSize); return material; }
  private box(w: number, h: number, d: number, color: number): THREE.Mesh { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material(color)); }
  private ring(radius: number, color: number, width: number, opacity = .85): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius + width, 80), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .035; return m;
  }
  private buildMap(map: ArenaMap): void {
    this.map = map;
    const plateau = this.box(map.width, 5, map.depth, 0x293a40); plateau.position.set(map.width / 2, -2.55, map.depth / 2); this.scene.add(plateau);
    const ground = this.box(map.width, .12, map.depth, 0x3a4b50); ground.position.set(map.width / 2, -.06, map.depth / 2); this.scene.add(ground);
    // Sparse, broken geological seams; these are surface decoration, never obstacles.
    for (let i = 0; i < 55; i++) {
      const x = (i * 17.17 + 4) % map.width, z = (i * 9.31 + 2) % map.depth;
      const seam = this.box(1.5 + (i % 5), .008, .035, i % 9 === 0 ? 0x628b8e : 0x46595b);
      seam.position.set(x, .006, z); seam.rotation.y = i * 2.4; this.scene.add(seam);
    }
    for (const blocker of map.blockers) {
      const g = new THREE.Group(); const b = this.box(blocker.w, blocker.height, blocker.d, 0x84918f); b.position.y = blocker.height / 2; g.add(b);
      const cap = this.box(blocker.w * .93, .15, blocker.d * .9, 0xb5bab0); cap.position.y = blocker.height + .06; g.add(cap);
      const inset = this.box(.055, blocker.height * .62, .025, 0x8ed4db); inset.position.set(-blocker.w * .35, blocker.height * .55, blocker.d / 2 + .015); g.add(inset);
      g.position.set(blocker.x, 0, blocker.z); this.scene.add(g);
    }
    // Distant spires and pale ridges sit beyond the bounded, flat playable plateau.
    for (let i = 0; i < 30; i++) {
      const x = -90 + i * 9.7, z = -42 - (i % 6) * 13, height = 9 + (i * 7 % 28);
      const geo = new THREE.CylinderGeometry(2 + i % 4, 5 + i % 6, height, i % 2 ? 5 : 6);
      const ridge = new THREE.Mesh(geo, this.material(i % 3 === 0 ? 0x8f999b : 0x5b6c79)); ridge.position.set(x, height / 2 - 8, z); ridge.rotation.y = i; this.scene.add(ridge);
      if (i % 5 === 0) { const seam = this.box(.12, height * .8, .12, CYAN); seam.position.set(x, height / 2 - 8, z + 3); this.scene.add(seam); }
    }
    for (const x of [-5, map.width + 5]) for (let i = 0; i < 12; i++) {
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(2, 4, 4 + i % 5, 5), this.material(0x6b7e83)); rock.position.set(x + Math.sin(i * 5) * 3, -1.5, i * 6); this.scene.add(rock);
    }
    for (const spawn of map.spawns) {
      const m = this.ring(map.spawnRecoveryRadius ?? 3, spawn === map.spawns[0] ? CYAN : AMBER, .07, .45); m.position.set(spawn.x, .035, spawn.z); this.scene.add(m);
      this.label('RECOVERY', spawn.x, .7, spawn.z + 3.8, spawn === map.spawns[0] ? '#82e6ec' : '#efb47b');
    }
    this.relay.position.set(map.relay.x, 0, map.relay.z);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, .16, 48), this.material(0x516368)); pad.position.y = .08; this.relay.add(pad);
    this.relay.add(this.ring(5, AMBER, .055, .7), this.ring(2.25, AMBER, .07), this.ring(1.5, AMBER, .035));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.45, .7, 1.7, 6), this.material(0xbed2d2)); core.position.y = .95; this.relay.add(core);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 4.8, 10), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: .5 })); beacon.position.y = 2.6; this.relay.add(beacon);
    this.label('CENTRAL RELAY', map.relay.x, 5.5, map.relay.z, '#efc899');
    this.target.set(map.width / 2, 0, map.depth / 2 + 4); this.updateCamera();
  }
  private label(text: string, x: number, y: number, z: number, color: string): void {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const ctx = c.getContext('2d')!;
    ctx.font = '500 24px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, 256, 38);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sprite.position.set(x, y, z); sprite.scale.set(10, 1.25, 1); this.scene.add(sprite);
  }
  private runner(friendly: boolean): THREE.Group {
    const g = new THREE.Group(); const color = friendly ? CYAN : AMBER;
    g.add(this.ring(.8, color, friendly ? .07 : .13));
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(.33, .26, .75, 6), this.material(0x152b36)); torso.position.y = 1.13; g.add(torso);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.29, 12, 8), this.material(0xb1c9cc, .35)); helmet.scale.set(1, 1.1, 1); helmet.position.y = 1.78; g.add(helmet);
    const visor = this.box(.43, .105, .18, color); visor.position.set(0, 1.8, -.23); g.add(visor);
    for (const x of [-.2, .2]) { const leg = this.box(.18, .65, .21, 0x1b303c); leg.position.set(x, .43, 0); g.add(leg); const shoulder = this.box(.18, .43, .22, 0x9db1b7); shoulder.position.set(x * 2, 1.22, -.02); g.add(shoulder); }
    const weapon = this.box(.15, .14, .68, 0x6e929a); weapon.position.set(.45, 1.18, -.39); g.add(weapon);
    const direction = new THREE.Mesh(new THREE.ConeGeometry(.2, .4, 3), new THREE.MeshBasicMaterial({ color })); direction.rotation.x = -Math.PI / 2; direction.position.set(0, .1, -1.05); g.add(direction);
    return g;
  }
  update(observation: Observation, pointer: Point | null, targeting: boolean, selectedId: string | null): void {
    const updateKey = `${observation.tick}/${pointer?.x.toFixed(2)}/${pointer?.z.toFixed(2)}/${targeting}/${selectedId}/${this.reduced}`;
    if (updateKey === this.updateKey) return;
    this.updateKey = updateKey;
    this.observation = observation; const { world, entities } = publicView(observation); const map = world['world.planar']; if (!this.map) this.buildMap(map);
    this.updateSight(observation);
    const me = entities.find(e => observation.controlledEntityIds.includes(e.id)); const body = me?.components.movement;
    for (const actor of this.actors.values()) actor.visible = false;
    for (const entity of entities) {
      const m = entity.components.movement, c = entity.components.combat; if (!m || !c?.alive) continue;
      let actor = this.actors.get(entity.id); if (!actor) { actor = this.runner(observation.controlledEntityIds.includes(entity.id)); this.actors.set(entity.id, actor); this.scene.add(actor); }
      actor.visible = true; actor.position.set(m.x, 0, m.z); actor.rotation.y = runnerYaw(entity, entities);
    }
    // All transient graphics are rebuilt exclusively from this permitted observation.
    for (const child of [...this.dynamic.children]) { this.dynamic.remove(child); if (child instanceof THREE.Mesh) { child.geometry.dispose(); if (child.material instanceof THREE.Material) child.material.dispose(); } }
    const combat = world['combat.runner'];
    for (const entity of entities) {
      const m = entity.components.movement, c = entity.components.combat; if (!m || !c?.alive) continue;
      const health = this.box(1.1 * c.hp / c.maxHp, .07, .06, observation.controlledEntityIds.includes(entity.id) ? CYAN : AMBER); health.position.set(m.x - .55 * (1 - c.hp / c.maxHp), 2.5, m.z); this.dynamic.add(health);
      if (c.windup) {
        const dx = c.windup.x - m.x, dz = c.windup.z - m.z, distance = Math.hypot(dx, dz) || 1;
        const end = { x: m.x + dx / distance * combat.pulseRange, z: m.z + dz / distance * combat.pulseRange };
        const color = observation.controlledEntityIds.includes(entity.id) ? CYAN : AMBER;
        const line = this.line({ x: m.x, z: m.z }, end, color, .75); this.dynamic.add(line);
        const tell = this.ring(combat.pulseRadius, color, .09); tell.position.set(end.x, .08, end.z); this.dynamic.add(tell);
      }
    }
    for (const p of combat.projectiles) { const ball = new THREE.Mesh(new THREE.SphereGeometry(combat.pulseRadius, 8, 6), new THREE.MeshBasicMaterial({ color: observation.controlledEntityIds.includes(p.ownerId) ? CYAN : AMBER })); ball.position.set(p.x, SHOT_HEIGHT, p.z); this.dynamic.add(ball); }
    for (const t of combat.traces) if (observation.tick - t.tick <= 3) this.dynamic.add(makeCombatTrace(t, observation.controlledEntityIds.includes(t.actorId) ? CYAN : AMBER));
    this.destination.visible = !!body?.destination; if (body?.destination) this.destination.position.set(body.destination.x, .06, body.destination.z);
    const sel = entities.find(e => e.id === selectedId)?.components.movement; this.selected.visible = !!sel; if (sel) this.selected.position.set(sel.x, .06, sel.z);
    if (body && (sel || (pointer && this.hit(pointer)))) { const range = this.ring(combat.basicRange, CYAN, .035, .45); range.position.set(body.x, .055, body.z); this.dynamic.add(range); }
    for (const child of [...this.aim.children]) { this.aim.remove(child); if (child instanceof THREE.Mesh) { child.geometry.dispose(); if (child.material instanceof THREE.Material) child.material.dispose(); } }
    if (body && pointer && targeting) {
      const dx = pointer.x - body.x, dz = pointer.z - body.z, d = Math.hypot(dx, dz) || 1;
      const end = { x: body.x + dx / d * combat.pulseRange, z: body.z + dz / d * combat.pulseRange };
      this.aim.add(this.line(body, end, CYAN, .9)); const range = this.ring(combat.pulseRange, CYAN, .025, .25); range.position.set(body.x, .06, body.z); this.aim.add(range);
      const circle = this.ring(combat.pulseRadius, CYAN, .05); circle.position.set(end.x, .07, end.z); this.aim.add(circle);
    }
    const relay = world['objective.relay']; const allyTeam = body?.teamId;
    for (const child of this.relay.children) if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) child.material.color.setHex(relay.owner === allyTeam ? CYAN : AMBER);
    this.drawMinimap(observation);
  }
  private line(a: Point, b: Point, color: number, opacity: number): THREE.Mesh {
    return makeBeam(a,b,color,opacity);
  }
  private updateSight(observation:Observation):void {
    const {world,entities}=publicView(observation),map=world['world.planar'],radius=world['perception.radius-los'].radius;
    const sources=entities.filter(e=>observation.controlledEntityIds.includes(e.id)&&e.components.combat?.alive&&e.components.movement).map(e=>({x:e.components.movement!.x,z:e.components.movement!.z}));
    const key=JSON.stringify([map.mapVersion,radius,sources]);if(key===this.sightKey)return;this.sightKey=key;
    this.sightMapSize.set(map.width,map.depth);sightMask(map,sources,radius,this.sightColumns,this.sightRows,this.sightData);this.sightTexture.needsUpdate=true;
    const context=this.sightMapCanvas.getContext('2d')!,image=context.createImageData(this.sightColumns,this.sightRows);
    for(let i=0;i<this.sightData.length;i++){image.data[i*4]=4;image.data[i*4+1]=9;image.data[i*4+2]=18;image.data[i*4+3]=Math.round((255-this.sightData[i]!)*.7);}
    context.putImageData(image,0,0);
  }
  private drawMinimap(observation: Observation): void {
    const c = document.querySelector<HTMLCanvasElement>('#minimap')!; const ctx = c.getContext('2d')!; const { world, entities } = publicView(observation); const map = world['world.planar'];
    ctx.fillStyle = '#152a34'; ctx.fillRect(0, 0, c.width, c.height); const sx = c.width / map.width, sz = c.height / map.depth;
    ctx.fillStyle = '#71878b'; for (const b of map.blockers) ctx.fillRect((b.x - b.w / 2) * sx, (b.z - b.d / 2) * sz, b.w * sx, b.d * sz);
    ctx.drawImage(this.sightMapCanvas,0,0,c.width,c.height);
    ctx.strokeStyle = '#eab177'; ctx.beginPath(); ctx.arc(map.relay.x * sx, map.relay.z * sz, 5 * sx, 0, Math.PI * 2); ctx.stroke();
    for (const e of entities) { const m = e.components.movement; if (!m || !e.components.combat?.alive) continue; const friendly = observation.controlledEntityIds.includes(e.id); ctx.fillStyle = friendly ? '#7fe5eb' : '#eab177'; const x = m.x * sx, y = m.z * sz; ctx.beginPath(); if (friendly) { ctx.moveTo(x, y - 5); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 4, y); } else { ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); } ctx.closePath(); ctx.fill(); }
  }
  point(clientX: number, clientY: number): Point | null {
    const r = this.canvas.getBoundingClientRect(); this.ray.setFromCamera(new THREE.Vector2((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1), this.camera); const p = this.ray.ray.intersectPlane(this.plane, new THREE.Vector3()); if (!p || !this.map || p.x < 0 || p.z < 0 || p.x > this.map.width || p.z > this.map.depth) return null; return { x: p.x, z: p.z };
  }
  hit(point: Point): string | null {
    if (!this.observation) return null; const { entities } = publicView(this.observation);
    return entities.find(e => !this.observation!.controlledEntityIds.includes(e.id) && e.components.combat?.alive && e.components.movement && Math.hypot(e.components.movement.x - point.x, e.components.movement.z - point.z) < 1.4)?.id ?? null;
  }
  center(point: Point): void { this.target.set(point.x, 0, point.z); this.updateCamera(); }
  pan(dx: number, dy: number): void {
    const scale = this.zoom / this.canvas.clientHeight, yaw = this.peekYaw * THREE.MathUtils.degToRad(25);
    this.target.x -= (dx * Math.cos(yaw) + dy * 1.5 * Math.sin(yaw)) * scale;
    this.target.z -= (-dx * Math.sin(yaw) + dy * 1.5 * Math.cos(yaw)) * scale; this.updateCamera();
  }
  wheel(delta: number): void { this.zoom = THREE.MathUtils.clamp(this.zoom + delta * .035, 30, 82); this.updateCamera(); }
  effects(value: boolean): void { this.reduced = value; this.gl.setPixelRatio(value ? 1 : Math.min(devicePixelRatio, 1.5)); }
  peek(yaw: number, lift: number): void { this.desiredYaw = THREE.MathUtils.clamp(yaw, -1, 1); this.desiredLift = THREE.MathUtils.clamp(lift, 0, 1); }
  private updateCamera(): void {
    if (this.map) { this.target.x = THREE.MathUtils.clamp(this.target.x, 8, this.map.width - 8); this.target.z = THREE.MathUtils.clamp(this.target.z, 8, this.map.depth - 8); }
    const yaw = this.peekYaw * THREE.MathUtils.degToRad(25), radius = this.zoom * (1 - .22 * this.peekLift);
    this.camera.position.copy(this.target).add(new THREE.Vector3(Math.sin(yaw) * radius, this.zoom * (.78 + .45 * this.peekLift), Math.cos(yaw) * radius)); this.camera.lookAt(this.target);
  }
  private resize(): void { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.gl.setSize(innerWidth, innerHeight, false); this.updateCamera(); }
  render(): void {
    const now = performance.now(), dt = Math.min(.1, Math.max(0, (now - this.cameraFrameAt) / 1000)); this.cameraFrameAt = now;
    const blend = this.reduced ? 1 : 1 - Math.exp(-dt * 14);
    this.peekYaw = THREE.MathUtils.lerp(this.peekYaw, this.desiredYaw, blend); this.peekLift = THREE.MathUtils.lerp(this.peekLift, this.desiredLift, blend);
    if (Math.abs(this.peekYaw - this.desiredYaw) < .0001) this.peekYaw = this.desiredYaw;
    if (Math.abs(this.peekLift - this.desiredLift) < .0001) this.peekLift = this.desiredLift;
    this.updateCamera(); this.gl.render(this.scene, this.camera);
  }
  capture(): string { this.render(); return this.gl.domElement.toDataURL('image/png'); }
  diagnostics(): { renderer: string | null; vendor: string | null; drawCalls: number; triangles: number; renderPixelRatio: number } {
    const context = this.gl.getContext(); const info = context.getExtension('WEBGL_debug_renderer_info');
    return { renderer: info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null, vendor: info ? String(context.getParameter(info.UNMASKED_VENDOR_WEBGL)) : null, drawCalls: this.gl.info.render.calls, triangles: this.gl.info.render.triangles, renderPixelRatio: this.gl.getPixelRatio() };
  }
}

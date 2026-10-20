import { createGame } from '../../game/session.js';
import { Battlefield, publicView } from './renderer.js';
import type { JsonObject } from '../../../contracts/agent-interface.js';
import type { Point } from '../../../contracts/tactical-types.js';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('arena');
const game = createGame({ browser: navigator.userAgent, platform: navigator.platform, viewportWidth: innerWidth, viewportHeight: innerHeight, devicePixelRatio, logicalProcessors: navigator.hardwareConcurrency });
let renderer: Battlefield;
try { renderer = new Battlefield(canvas); } catch { el('overlay').innerHTML = '<section class="intro"><h1>3D rendering unavailable</h1><p>This encounter requires a browser with WebGL enabled. Enable hardware acceleration and reload.</p></section>'; throw new Error('WebGL unavailable'); }
let observation = game.observe(), running = false, started = false, ended = false, targeting = false, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pointer: Point | null = null, selectedId: string | null = null, last = performance.now(), accumulated = 0, noticeUntil = 0, dragging = false, dragX = 0, dragY = 0;
let receiptKey = '';
const frameTimes: number[] = [], stepTimes: number[] = [], inputWaits: number[] = [];
let pendingInputAt: number | null = null;
let slowNoticeAt = 0;
const pauseEvents: { tick: number; reason: string }[] = [];
const perfLabel = document.createElement('small'); perfLabel.style.cssText = 'position:absolute;left:32px;top:87px;font-size:8px;color:#97b0bc;letter-spacing:1px;pointer-events:none'; perfLabel.textContent = 'LOCAL ENCOUNTER · 20 TICKS / SEC'; document.querySelector('main')!.append(perfLabel);
function sample(values: number[], value: number): void { values.push(value); if (values.length > 3000) values.shift(); }
function metrics(values: number[]): { samples: number; meanMs: number | null; p95Ms: number | null; maximumMs: number | null } {
  const ordered = [...values].sort((a, b) => a - b); return { samples: values.length, meanMs: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, p95Ms: ordered[Math.floor(ordered.length * .95)] ?? null, maximumMs: ordered.at(-1) ?? null };
}
renderer.effects(reduced);
el('effects').setAttribute('aria-pressed', String(reduced));
function notice(message: string): void { el('notice').textContent = message; noticeUntil = performance.now() + 2600; el('notice').classList.add('show'); }
function cancelAim(): void { targeting = false; el('aim-label').hidden = true; el('pulse').classList.remove('targeting'); }
function setRunning(value: boolean, pauseReason = 'manual'): void {
  if (!value && running) pauseEvents.push({ tick: observation.tick, reason: pauseReason });
  running = value; accumulated = 0; last = performance.now(); game.discardInput(); pendingInputAt = null; cancelAim();
  el('pause').textContent = value ? 'Pause' : 'Resume';
  if (started && !ended) notice(value ? 'Encounter resumed' : 'Paused — press Escape or Resume to continue');
}
function command(kind: string, payload: JsonObject): void {
  if (!running) { notice(started ? 'Resume the encounter to act' : 'Start the encounter first'); return; }
  const result = game.command(kind, payload); if (!result.accepted) notice(reason(result.reason)); else pendingInputAt = performance.now();
}
function reason(code: string): string {
  const text = code.toLowerCase();
  if (text.includes('cooldown')) return 'Ability is recharging';
  if (text.includes('range')) return 'Target out of range — move closer';
  if (text.includes('dead') || text.includes('alive')) return 'Runner is rebuilding — wait for respawn';
  if (text.includes('block') || text.includes('path') || text.includes('destination')) return 'Route blocked — choose open ground';
  if (text.includes('target') || text.includes('visible')) return 'No visible target — move to gain sight';
  return 'Action unavailable: ' + code.replaceAll(/[-_.]/g, ' ');
}
function preparePulse(): void { if (!running) { notice('Start or resume the encounter first'); return; } targeting = true; el('aim-label').hidden = false; el('pulse').classList.add('targeting'); notice('Aim with the cursor, then left-click to fire'); }
function dash(): void { if (!pointer) { notice('Point at open ground, then press W'); return; } command('combat.cast', { ability: 'dash', x: pointer.x, z: pointer.z }); cancelAim(); }
el('start').addEventListener('click', () => { if (ended) restart(); started = true; el('overlay').hidden = true; setRunning(true); });
el('pause').addEventListener('click', () => { if (!started || ended) return; setRunning(!running); });
function restart(): void { game.restart(); frameTimes.length = 0; stepTimes.length = 0; inputWaits.length = 0; pauseEvents.length = 0; observation = game.observe(); started = true; ended = false; selectedId = null; receiptKey = ''; el('overlay').hidden = true; setRunning(true); center(); notice('New encounter — claim the central relay'); }
el('restart').addEventListener('click', restart);
function exportRun(): void {
  const record = game.exportRun() as Record<string, unknown>;
  const blob = new Blob([JSON.stringify({ ...record, fieldScreenshot: renderer.capture(), presentationDiagnostics: { viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }, reducedEffects: reduced, graphics: renderer.diagnostics(), frames: metrics(frameTimes), simulationStep: metrics(stepTimes), humanSampleToApplied: metrics(inputWaits), pauseEvents, note: 'Rolling 3000 samples. Input timing measures UI queue delay only; frame durations are RAF intervals, not isolated GPU timings. Screenshot captures the public battlefield canvas; HUD is represented by the permitted observation.' } }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `grid-rift-encounter-t${observation.tick}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); notice('Run exported');
}
el('export').addEventListener('click', exportRun);
el('effects').addEventListener('click', () => { reduced = !reduced; renderer.effects(reduced); el('effects').setAttribute('aria-pressed', String(reduced)); el('effects').textContent = reduced ? 'Effects reduced' : 'Reduce effects'; });
el('pulse').addEventListener('click', preparePulse); el('dash').addEventListener('click', dash);
function center(): void { const me = publicView(observation).entities.find(e => observation.controlledEntityIds.includes(e.id))?.components.movement; if (me) renderer.center(me); }
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointermove', e => { pointer = renderer.point(e.clientX, e.clientY); if (dragging) { renderer.pan(e.clientX - dragX, e.clientY - dragY); dragX = e.clientX; dragY = e.clientY; } });
canvas.addEventListener('pointerdown', e => {
  pointer = renderer.point(e.clientX, e.clientY);
  if (e.button === 1) { e.preventDefault(); dragging = true; dragX = e.clientX; dragY = e.clientY; canvas.setPointerCapture(e.pointerId); return; }
  if (!pointer) { notice('Choose a location inside the plateau'); return; }
  if (e.button === 2) {
    e.preventDefault(); cancelAim(); const hit = renderer.hit(pointer); selectedId = hit;
    if (hit) command('combat.attack', { targetId: hit }); else command('movement.move-to', { x: pointer.x, z: pointer.z });
  } else if (e.button === 0 && targeting) { command('combat.cast', { ability: 'pulse', x: pointer.x, z: pointer.z }); cancelAim(); }
});
canvas.addEventListener('pointerup', () => { dragging = false; }); canvas.addEventListener('lostpointercapture', () => { dragging = false; });
canvas.addEventListener('wheel', e => { e.preventDefault(); renderer.wheel(e.deltaY); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.repeat || (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName))) return;
  if (['Space', 'KeyQ', 'KeyW', 'Escape'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyQ') preparePulse(); else if (e.code === 'KeyW') dash(); else if (e.code === 'Space') center(); else if (e.code === 'Escape') { if (targeting) cancelAim(); else if (started && !ended) setRunning(!running); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && running) setRunning(false, 'tab-hidden'); });
window.addEventListener('blur', () => { dragging = false; if (running) setRunning(false, 'window-blur'); });
function hud(): void {
  const { world, entities } = publicView(observation); const me = entities.find(e => observation.controlledEntityIds.includes(e.id)); const c = me?.components.combat, m = me?.components.movement;
  const relay = world['objective.relay']; const own = m?.teamId ?? Object.keys(relay.scores)[0] ?? ''; const other = Object.keys(relay.scores).find(k => k !== own) ?? '';
  const mine = relay.scores[own] ?? 0, rival = relay.scores[other] ?? 0;
  el('friendly-score').textContent = String(mine); el('enemy-score').textContent = String(rival); el('score-fill').style.width = `${mine + rival ? mine / (mine + rival) * 100 : 50}%`;
  const capture = Math.round(relay.progress / relay.captureTicks * 100);
  el('relay-status').textContent = `${relay.contested ? 'CONTESTED — clear the ring' : relay.capturing ? `CAPTURING · ${capture}%` : relay.owner === own ? 'YOUR RELAY · hold to score' : relay.owner ? 'RIVAL RELAY · contest the ring' : 'NEUTRAL · reach the central ring'} · ${(observation.tick / 20).toFixed(0)}s`;
  if (c) {
    el('hp-fill').style.width = `${Math.max(0, c.hp) / c.maxHp * 100}%`; el('hp-label').textContent = `${Math.max(0, c.hp)} / ${c.maxHp}`;
    el('life-state').textContent = c.alive ? 'ONLINE' : `RESPAWN ${Math.max(0, (c.respawnTick - observation.tick) / 20).toFixed(1)}s`;
    for (const [id, ready] of [['pulse-cd', c.pulseReadyTick], ['dash-cd', c.dashReadyTick]] as const) el(id).textContent = ready <= observation.tick ? 'READY' : `${((ready - observation.tick) / 20).toFixed(1)}s`;
  }
  const receipt = observation.receipts.at(-1); if (receipt) { const key = `${receipt.sequence}/${receipt.tick}/${receipt.result}`; if (key !== receiptKey && receipt.result !== 'accepted') notice(reason(receipt.reason)); receiptKey = key; }
  if (selectedId && !entities.some(e => e.id === selectedId)) selectedId = null;
}
function finish(): void {
  const result = game.terminal(); if (result.kind === 'running' || ended) return;
  ended = true; running = false; accumulated = 0; game.discardInput(); cancelAim();
  const ownTeam = publicView(observation).entities.find(e => observation.controlledEntityIds.includes(e.id))?.components.movement?.teamId;
  const win = result.kind === 'finished' && result.winners.includes(ownTeam ?? '');
  const ownScore=result.scores[ownTeam??'']??0;
  const rivalScore=Object.entries(result.scores).find(([team])=>team!==ownTeam)?.[1]??0;
  const title = result.kind === 'draw' ? 'An even field.' : win ? 'Position secured.' : 'The rival held ground.';
  const overlay = el('overlay'); overlay.innerHTML = `<section class="intro"><div class="eyebrow">ENCOUNTER COMPLETE / ${(observation.tick / 20).toFixed(1)} SECONDS</div><h1>${title}</h1><p>${result.kind === 'draw' ? 'Neither Runner claimed the advantage.' : win ? 'Your relay control carried the encounter.' : 'Use cover, retreat to recover, and contest the ring.'}</p><p>YOU ${ownScore} · RIVAL ${rivalScore}</p><button id="again" class="primary">Play again <span>↗</span></button><button id="export-complete">Export replay</button><small>Replay files stay on your device.</small></section>`; overlay.hidden = false; el('again').addEventListener('click', restart); el('export-complete').addEventListener('click', exportRun);
}
function frame(now: number): void {
  const elapsed = (now - last) / 1000; last = now;
  if (running) {
    sample(frameTimes, elapsed * 1000);
    accumulated += elapsed; const dt = 1 / game.timing.tickRateHz;
    if (accumulated > 2.5) { setRunning(false, 'browser-behind'); notice('Paused: browser fell behind. Resume to continue without skipping simulation ticks.'); }
    else {
      if (accumulated > .3 && now - slowNoticeAt > 5000) { notice('Catching up — reduce effects if the browser stays slow'); slowNoticeAt = now; }
      let n = 0; const catchupStarted=performance.now();
      while (accumulated >= dt && n < 32 && performance.now()-catchupStarted<100 && running) { const before = performance.now(); if (pendingInputAt !== null) { sample(inputWaits, before - pendingInputAt); pendingInputAt = null; } game.tick(); sample(stepTimes, performance.now() - before); accumulated -= dt; n++; observation = game.observe(); finish(); }
    }
  }
  if (frameTimes.length) { const mean = frameTimes.slice(-60).reduce((a, b) => a + b, 0) / Math.min(frameTimes.length, 60); perfLabel.textContent = `${Math.round(1000 / mean)} FPS · 20 TICKS / SEC${reduced ? ' · EFFECTS REDUCED' : ''}`; }
  observation = game.observe(); hud(); renderer.update(observation, pointer, targeting, selectedId); renderer.render(); if (now > noticeUntil) el('notice').classList.remove('show'); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

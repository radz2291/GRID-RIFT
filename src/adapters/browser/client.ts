import { createAutonomousGame, type AutonomousGame } from '../../game/autonomous.js';
import type { CommandView } from '../../../contracts/autonomy.js';
import { createGame } from '../../game/session.js';
import { attackClickIntent } from '../../agents/human-orders.js';
import { Battlefield, publicView } from './renderer.js';
import type { JsonObject } from '../../../contracts/agent-interface.js';
import type { Point } from '../../../contracts/tactical-types.js';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('arena');
const params = new URLSearchParams(location.search), autonomous = params.get('scenario') !== 'duel';
const variant = params.get('variant');
const metadata = { browser: navigator.userAgent, platform: navigator.platform, viewportWidth: innerWidth, viewportHeight: innerHeight, devicePixelRatio, logicalProcessors: navigator.hardwareConcurrency };
const game = autonomous ? createAutonomousGame(metadata, variant === 'blocked-route' || variant === 'flank' ? variant : 'crossing') : createGame(metadata);
document.body.classList.toggle('autonomous', autonomous);
let renderer: Battlefield;
try { renderer = new Battlefield(canvas); } catch { el('overlay').innerHTML = '<section class="intro"><h1>3D rendering unavailable</h1><p>This encounter requires a browser with WebGL enabled. Enable hardware acceleration and reload.</p></section>'; throw new Error('WebGL unavailable'); }
let observation = game.observe(), running = false, started = false, ended = false, targeting = false, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pointer: Point | null = null, selectedId: string | null = null, last = performance.now(), accumulated = 0, noticeUntil = 0, dragging = false, dragX = 0, dragY = 0;
let receiptKey = '';
let attackMoving = false, grip = false;
let unitSelected = false, orderAim: 'defend' | 'secure' | null = null, risk: 'balanced' | 'cautious' = 'balanced';
function owned(): CommandView | undefined { return observation.world['command.owned'] as unknown as CommandView | undefined; }
function selectAlly(): void { unitSelected = true; selectedId = owned()?.grants[0]?.unitId ?? 'body-a1'; }
function unitOrder(kind: 'defend' | 'secure' | 'follow' | 'cancel', point?: Point): void {
  if (!running) { notice('Start or resume the encounter first'); return; }
  if (!autonomous) return;
  selectAlly(); const result = (game as AutonomousGame).order(kind, point, risk);
  if (!result.accepted) notice(reason(result.reason)); else { pendingInputAt = performance.now(); notice(kind === 'cancel' ? 'Cancellation sent' : `${kind[0]!.toUpperCase() + kind.slice(1)} order sent`); }
  cancelAim();
}
function prepareOrder(kind: 'defend' | 'secure'): void { if (!running) { notice('Start or resume the encounter first'); return; } cancelAim(); selectAlly(); orderAim = kind; controls(); notice(`${kind === 'defend' ? 'Defend' : 'Secure'}: left-click open ground`); }
const cameraKeys = new Set<string>();
function controls(): void {
  canvas.classList.toggle('grip', grip); canvas.classList.toggle('dragging', dragging); canvas.classList.toggle('aiming', targeting || attackMoving || orderAim !== null);
  const peek = cameraKeys.size > 0;
  renderer.peek(Number(cameraKeys.has('KeyX')) - Number(cameraKeys.has('KeyZ')), Number(cameraKeys.has('KeyC')));
  const label = el('control-mode'); label.hidden = !(dragging || grip || peek || attackMoving || orderAim !== null);
  label.textContent = orderAim ? `ALLY · ${orderAim.toUpperCase()} · LEFT CLICK GROUND · ESC TO CANCEL` : dragging ? '✊ CAMERA PAN' : grip ? '✋ CAMERA · LEFT DRAG TO PAN' : peek ? 'CAMERA PEEK · RELEASE TO RETURN' : attackMoving ? 'A · ATTACK MOVE · LEFT CLICK GROUND · ESC TO CANCEL' : '';
}
function resetCameraControls(): void { dragging = false; grip = false; cameraKeys.clear(); controls(); }
const frameTimes: number[] = [], stepTimes: number[] = [], inputWaits: number[] = [];
let pendingInputAt: number | null = null;
let slowNoticeAt = 0;
const pauseEvents: { tick: number; reason: string }[] = [];
const perfLabel = document.createElement('small'); perfLabel.style.cssText = 'position:absolute;left:32px;top:87px;font-size:8px;color:#97b0bc;letter-spacing:1px;pointer-events:none'; perfLabel.hidden = true; perfLabel.textContent = 'LOCAL ENCOUNTER · 20 TICKS / SEC'; document.querySelector('main')!.append(perfLabel);
function sample(values: number[], value: number): void { values.push(value); if (values.length > 3000) values.shift(); }
function metrics(values: number[]): { samples: number; meanMs: number | null; p95Ms: number | null; maximumMs: number | null } {
  const ordered = [...values].sort((a, b) => a - b); return { samples: values.length, meanMs: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, p95Ms: ordered[Math.floor(ordered.length * .95)] ?? null, maximumMs: ordered.at(-1) ?? null };
}
renderer.effects(reduced);
el('effects').setAttribute('aria-pressed', String(reduced));
function notice(message: string): void { el('notice').textContent = message; noticeUntil = performance.now() + 2600; el('notice').classList.add('show'); }
function cancelAim(): void { orderAim = null; targeting = false; attackMoving = false; el('aim-label').hidden = true; el('pulse').classList.remove('targeting'); controls(); }
function closeMenus(): void { document.querySelectorAll<HTMLDetailsElement>('.game-menu, .controls-help').forEach(menu => { menu.open = false; }); }
document.addEventListener('pointerdown', e => {
  document.querySelectorAll<HTMLDetailsElement>('.game-menu, .controls-help').forEach(menu => { if (e.target instanceof Node && !menu.contains(e.target)) menu.open = false; });
}, true);
document.addEventListener('click', e => { if (e.target instanceof Element && e.target.closest('.game-menu button')) closeMenus(); });
function setRunning(value: boolean, pauseReason = 'manual'): void {
  if (!value && running) pauseEvents.push({ tick: observation.tick, reason: pauseReason });
  running = value; accumulated = 0; last = performance.now(); game.discardInput(); pendingInputAt = null; cancelAim();
  el('pause').textContent = value ? 'Pause' : 'Resume';
  el('pause-overlay').hidden = value || !started || ended;
  closeMenus();
  if (!value) resetCameraControls();
  if (!value && started && !ended && pauseReason === 'manual' && document.hasFocus()) el('resume-center').focus({ preventScroll: true });
  if (started && !ended) notice(value ? 'Encounter resumed' : 'Paused — press Escape or Resume to continue');
}
function command(kind: string, payload: JsonObject): void {
  if (!running) { notice(started ? 'Resume the encounter to act' : 'Start the encounter first'); return; }
  const result = game.command(kind, payload); if (!result.accepted) notice(reason(result.reason)); else pendingInputAt = performance.now();
}
function reason(code: string): string {
  const text = code.toLowerCase();
  if (code === 'dead-unit') return 'Ally is rebuilding — issue a new order when it returns';
  if (text.includes('cooldown')) return 'Ability is recharging';
  if (text.includes('range')) return 'Target out of range — move closer';
  if (text.includes('dead') || text.includes('alive')) return 'Runner is rebuilding — wait for respawn';
  if (text.includes('block') || text.includes('path') || text.includes('destination')) return 'Route blocked — choose open ground';
  if (text.includes('target') || text.includes('visible')) return 'No visible target — move to gain sight';
  return 'Action unavailable: ' + code.replaceAll(/[-_.]/g, ' ');
}
function preparePulse(): void { if (!running) { notice('Start or resume the encounter first'); return; } if (el<HTMLButtonElement>('pulse').disabled) { notice(el('pulse-cd').textContent === 'OFFLINE' ? 'Runner is rebuilding — wait for respawn' : 'Pulse is recharging'); return; } cancelAim(); targeting = true; el('aim-label').hidden = false; el('pulse').classList.add('targeting'); controls(); notice('Aim with the cursor, then left-click to fire'); }
function dash(): void { if (!pointer) { notice('Point at open ground, then press W'); return; } command('combat.cast', { ability: 'dash', x: pointer.x, z: pointer.z }); cancelAim(); }
el('start').addEventListener('click', () => { if (ended) restart(); started = true; el('overlay').hidden = true; setRunning(true); });
el('pause').addEventListener('click', () => { if (!started || ended) return; setRunning(!running); });
el('resume-center').addEventListener('click', () => { if (!started || ended) return; setRunning(true); canvas.focus({ preventScroll: true }); });
function restart(): void { game.restart(); frameTimes.length = 0; stepTimes.length = 0; inputWaits.length = 0; pauseEvents.length = 0; observation = game.observe(); started = true; ended = false; selectedId = null; unitSelected = false; receiptKey = ''; el('overlay').hidden = true; setRunning(true); center(); notice(autonomous ? 'New crossing — defeat both raiders' : 'New encounter — claim the central relay'); }
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
  if (e.button === 1 || (e.button === 0 && e.shiftKey)) { e.preventDefault(); dragging = true; dragX = e.clientX; dragY = e.clientY; canvas.setPointerCapture(e.pointerId); controls(); return; }
  if (!pointer) { notice('Choose a location inside the plateau'); return; }
  const allyHit = autonomous ? renderer.hitFriendly(pointer) : null;
  if (allyHit && !targeting && !attackMoving && !orderAim && (e.button === 0 || e.button === 2)) { selectAlly(); return; }
  if (e.button === 0 && orderAim) { unitOrder(orderAim, pointer); return; }
  if (e.button === 2) {
    e.preventDefault(); cancelAim(); const hit = renderer.hit(pointer); selectedId = hit;
    if (hit) command('combat.attack', { targetId: hit }); else command('movement.move-to', { x: pointer.x, z: pointer.z });
  } else if (e.button === 0 && targeting) { command('combat.cast', { ability: 'pulse', x: pointer.x, z: pointer.z }); cancelAim(); }
  else if (e.button === 0 && attackMoving) { const hit = renderer.hit(pointer), order = attackClickIntent(pointer, hit); command(order.kind, order.payload); selectedId = hit; cancelAim(); }
  else if (e.button === 0) { const hit = renderer.hit(pointer); selectedId = hit; if (hit) command('combat.attack', { targetId: hit }); }
});
canvas.addEventListener('pointerup', () => { dragging = false; controls(); }); canvas.addEventListener('lostpointercapture', () => { dragging = false; controls(); });
canvas.addEventListener('wheel', e => { e.preventDefault(); renderer.wheel(e.deltaY); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'Space' && e.target instanceof HTMLElement && e.target.closest('button, summary')) return;
  if (['ShiftLeft', 'ShiftRight'].includes(e.code)) { grip = true; controls(); return; }
  if (['KeyZ', 'KeyX', 'KeyC'].includes(e.code)) { e.preventDefault(); cameraKeys.add(e.code); controls(); return; }
  if (e.repeat) return;
  if (['Space', 'KeyQ', 'KeyW', 'KeyA', 'KeyS', 'Escape'].includes(e.code)) e.preventDefault();
  if (autonomous && ['KeyT', 'KeyD', 'KeyE', 'KeyF', 'KeyR'].includes(e.code)) {
    e.preventDefault(); if (e.code === 'KeyT') { unitSelected = !unitSelected; selectedId = unitSelected ? owned()?.grants[0]?.unitId ?? 'body-a1' : null; }
    else if (e.code === 'KeyD') prepareOrder('defend'); else if (e.code === 'KeyE') prepareOrder('secure'); else unitOrder(e.code === 'KeyF' ? 'follow' : 'cancel'); return;
  }
  if (e.code === 'KeyQ') preparePulse(); else if (e.code === 'KeyW') dash(); else if (e.code === 'Space') center();
  else if (e.code === 'KeyA') { if (!running) { notice('Start or resume the encounter first'); return; } cancelAim(); attackMoving = true; controls(); }
  else if (e.code === 'KeyS') { command('control.stop', {}); selectedId = null; cancelAim(); }
  else if (e.code === 'Escape') { if (document.querySelector('.game-menu[open], .controls-help[open]')) closeMenus(); else if (targeting || attackMoving || orderAim) cancelAim(); else if (started && !ended) setRunning(!running); }
});
window.addEventListener('keyup', e => { if (e.code.startsWith('Shift')) grip = e.shiftKey; cameraKeys.delete(e.code); controls(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { resetCameraControls(); if (running) setRunning(false, 'tab-hidden'); } });
window.addEventListener('blur', () => { resetCameraControls(); if (running) setRunning(false, 'window-blur'); });
function hud(): void {
  const { world, entities } = publicView(observation); const me = entities.find(e => observation.controlledEntityIds.includes(e.id)); const c = me?.components.combat, m = me?.components.movement;
  const crossing = observation.world['rules.crossing'] as unknown as { defeated: string[]; required: number } | undefined;
  if (autonomous && crossing) {
    el('friendly-score').textContent = String(crossing.defeated.length); el('enemy-score').textContent = `/${crossing.required}`;
    el('score-fill').style.width = `${crossing.defeated.length / crossing.required * 100}%`;
    el('relay-status').textContent = `DEFEAT BOTH RAIDERS · ${Math.max(0, 90 - observation.tick / 20).toFixed(0)}s left`;
  } else {
  const relay = world['objective.relay']; const own = m?.teamId ?? Object.keys(relay.scores)[0] ?? ''; const other = Object.keys(relay.scores).find(k => k !== own) ?? '';
  const mine = relay.scores[own] ?? 0, rival = relay.scores[other] ?? 0;
  el('friendly-score').textContent = String(mine); el('enemy-score').textContent = String(rival); el('score-fill').style.width = `${mine + rival ? mine / (mine + rival) * 100 : 50}%`;
  const capture = Math.round(relay.progress / relay.captureTicks * 100);
  el('relay-status').textContent = `${relay.contested ? 'CONTESTED — clear the ring' : relay.capturing ? `CAPTURING · ${capture}%` : relay.owner === own ? 'YOUR RELAY · hold to score' : relay.owner ? 'RIVAL RELAY · contest the ring' : 'NEUTRAL · reach the central ring'} · ${(observation.tick / 20).toFixed(0)}s`;
  }
  if (autonomous) unitHud();
  if (c) {
    el('hp-fill').style.width = `${Math.max(0, c.hp) / c.maxHp * 100}%`; el('hp-label').textContent = `${Math.max(0, c.hp)} / ${c.maxHp}`;
    el('life-state').textContent = c.alive ? 'ONLINE' : `RESPAWN ${Math.max(0, (c.respawnTick - observation.tick) / 20).toFixed(1)}s`;
    const combat = world['combat.runner'];
    for (const [id, ready, duration] of [['pulse', c.pulseReadyTick, combat.pulseCooldownTicks], ['dash', c.dashReadyTick, combat.dashCooldownTicks]] as const) {
      const remaining = Math.max(0, ready - observation.tick), charge = Math.round((1 - Math.min(1, remaining / Math.max(1, duration))) * 100);
      const button = el<HTMLButtonElement>(id); button.disabled = !c.alive || remaining > 0 || !running;
      button.classList.toggle('ready', remaining === 0 && c.alive); button.classList.toggle('recharging', remaining > 0);
      el(`${id}-cd`).textContent = !c.alive ? 'OFFLINE' : remaining === 0 ? 'READY' : `${(remaining / 20).toFixed(1)}s`;
      el(`${id}-fill`).style.width = `${charge}%`;
      el(`${id}-charge`).setAttribute('aria-valuenow', String(charge));
      el(`${id}-charge`).setAttribute('aria-valuetext', !c.alive ? 'Runner rebuilding' : remaining === 0 ? 'Ready' : `${charge}% recharged`);
    }
  }
  const receipt = observation.receipts.at(-1); if (receipt) { const key = `${receipt.sequence}/${receipt.tick}/${receipt.result}`; if (key !== receiptKey && receipt.result !== 'accepted') notice(reason(receipt.reason)); receiptKey = key; }
  if (selectedId && !unitSelected && !entities.some(e => e.id === selectedId)) selectedId = null;
}
function finish(): void {
  const result = game.terminal(); if (result.kind === 'running' || ended) return;
  ended = true; running = false; accumulated = 0; game.discardInput(); cancelAim();
  const ownTeam = publicView(observation).entities.find(e => observation.controlledEntityIds.includes(e.id))?.components.movement?.teamId;
  const win = result.kind === 'finished' && result.winners.includes(ownTeam ?? '');
  const ownScore=result.scores[ownTeam??'']??0;
  const rivalScore=Object.entries(result.scores).find(([team])=>team!==ownTeam)?.[1]??0;
  if (autonomous) {
    const crossing = observation.world['rules.crossing'] as unknown as { defeated: string[]; required: number };
    el('overlay').innerHTML = `<section class="intro"><div class="eyebrow">CROSSING COMPLETE / ${(observation.tick / 20).toFixed(1)} SECONDS</div><h1>${result.kind === 'draw' ? 'Time to regroup.' : win ? 'Crossing cleared.' : 'Your force fell.'}</h1><p>${result.kind === 'draw' ? 'The drill ended in a draw.' : win ? 'Both raiders were defeated.' : 'Both friendly units were down together.'} Raiders defeated: ${crossing.defeated.length} / ${crossing.required}.</p><button id="again" class="primary">Play again</button><button id="export-complete">Export replay</button><small>Local prototype drill · Replay stays on your device.</small></section>`;
    el('overlay').hidden = false; el('again').addEventListener('click', restart); el('export-complete').addEventListener('click', exportRun); return;
  }
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
  observation = game.observe(); hud(); renderer.update(observation, pointer, targeting, unitSelected ? owned()?.grants[0]?.unitId ?? null : selectedId); renderer.render(); if (now > noticeUntil) el('notice').classList.remove('show');
  requestAnimationFrame(frame);
}

function unitHud(): void {
  el('unit-orders').hidden = !unitSelected; el('select-ally').setAttribute('aria-pressed', String(unitSelected));
  const view = owned(), unitId = view?.grants[0]?.unitId, order = view?.orders.find(o => o.unitId === unitId), report = view?.reports.find(r => r.unitId === unitId);
  const heroAlive = publicView(observation).entities.find(e => observation.controlledEntityIds.includes(e.id))?.components.combat?.alive !== false;
  const unavailable = !!unitId && !!view?.unavailableUnitIds?.includes(unitId);
  for (const kind of ['defend','secure','follow','cancel']) el<HTMLButtonElement>(`order-${kind}`).disabled = !running || !heroAlive || unavailable;
  if (unavailable || !heroAlive) { el('order-status').textContent = `${heroAlive ? 'Ally' : 'Hero'} rebuilding · previous order ended`; el('unit-report').textContent = 'Issue a new intention when both units are online'; return; }
  const stateLabels: Record<string,string> = { pending:'pending delivery', active:'active', cancelled:'cancelled', expired:'expired', revoked:'ownership ended', dead:'ended after loss' };
  el('order-status').textContent = order ? `${order.kind === 'cancel' ? 'Order' : order.kind[0]!.toUpperCase() + order.kind.slice(1)} · ${stateLabels[order.status] ?? order.status}${order.risk && order.kind !== 'cancel' ? ` · ${order.risk}` : ''}${order.expiresTick && ['pending','active'].includes(order.status) ? ` · ${Math.max(0, (order.expiresTick - observation.tick) / 20).toFixed(1)}s left` : ''}` : 'No order · orders last 60s';
  const modes: Record<string,string> = { idle:'Waiting', defend:'Defending', defending:'Defending', secure:'Securing', securing:'Securing', follow:'Following', following:'Following', engage:'Engaging', engaging:'Engaging', attack:'Attacking', retreat:'Retreating', retreating:'Retreating', holding:'Holding', moving:'Moving', blocked:'Route blocked', lost:'Waiting for commander', commander:'Commander' };
  el('unit-report').textContent = report ? `Ally reports: ${modes[report.mode] ?? report.mode.replaceAll('-', ' ')} · ${report.alive ? `${report.hp} HP` : 'down'} · at ${report.x.toFixed(1)}, ${report.z.toFixed(1)} · observed ${(report.observedTick / 20).toFixed(1)}s (${((observation.tick - report.observedTick) / 20).toFixed(1)}s ago)` : 'Waiting for ally report · reports arrive 0.2s late';
}
el('select-ally').addEventListener('click', () => { unitSelected = !unitSelected; selectedId = unitSelected ? owned()?.grants[0]?.unitId ?? 'body-a1' : null; });
for (const kind of ['defend', 'secure'] as const) el(`order-${kind}`).addEventListener('click', () => prepareOrder(kind));
for (const kind of ['follow', 'cancel'] as const) el(`order-${kind}`).addEventListener('click', () => unitOrder(kind));
el('order-risk').addEventListener('click', () => { risk = risk === 'balanced' ? 'cautious' : 'balanced'; el('order-risk').setAttribute('aria-pressed', String(risk === 'cautious')); el('order-risk').textContent = `Risk: ${risk}`; notice('Risk applies to the next order'); });
if (autonomous) {
  document.title = 'GRID / RIFT — Autonomous crossing';
  el('unit-panel').hidden = false; el('objective-title').textContent = 'RAIDERS DEFEATED';
  document.querySelector('.brand small')!.textContent = 'PROTOTYPE FIELD · AUTONOMOUS CROSSING';
  document.querySelector('.map-panel small')!.innerHTML = '◆ HERO · ■ ALLY <span>△ VISIBLE RAIDER</span>';
  canvas.setAttribute('aria-label', 'Hero: click a raider to attack; right-click ground to move. A then click attacks a point; S stops. Q then click fires pulse; W dashes. Shift-drag pans; Z / X / C peek; Space centres; Escape pauses. T selects your ally. D then click to defend, E then click to secure, F to follow, R to cancel. These commands never take over the hero.');
  const intro = document.querySelector('.intro')!;
  intro.querySelector('.eyebrow')!.textContent = 'TACTICAL FIELD TEST / AUTONOMOUS CROSSING';
  intro.querySelector('h1')!.innerHTML = 'Fight alongside<br><span>your own force.</span>';
  intro.querySelector('p')!.textContent = 'Your hero. One autonomous ally. Defeat both raiders within 90 seconds. Both friendly units down together ends the drill.';
  intro.querySelector('.intro-details')!.innerHTML = '<div><b>01 / YOUR HERO</b><p>Click a visible raider to keep attacking. Right-click ground to move. A then click for attack move; S stops your hero. Q then click fires a pulse; W dashes toward your cursor. Use cover and retreat to your recovery ring.</p></div><div><b>02 / YOUR ALLY</b><p>Select the cyan ally with T or its button. D then click ground to defend a perimeter; E then click to secure and hold a point. F follows your hero; R cancels. Orders last 60 seconds and end if either of you falls; issue again after rebuilding. The ally chooses its own movement and combat. Risk applies to the next order.</p></div><div><b>03 / KEEP SIGHT</b><p>Your hero controls always stay with you. The ally shares delayed self-reports, not its vision. Outside your sight its live body disappears; report times show how old its last position is. Shift-drag pans, Z / X / C peek, Space centres, Escape pauses.</p></div>';
  const links = document.createElement('nav'); links.className = 'scenario-links'; links.setAttribute('aria-label', 'Local scenarios'); links.innerHTML = '<a href="/">Crossing</a><a href="/?variant=blocked-route">Blocked route</a><a href="/?variant=flank">Flank</a><a href="/?scenario=duel">Relay duel</a>'; intro.append(links);
  document.querySelector('.instruction b')!.textContent = 'Clear the crossing together.';
  document.querySelector('.instruction p')!.textContent = 'Defeat each raider once. T: ally · D + click: defend · E + click: secure · F: follow · R: cancel. Your hero stays under direct control.';
}
requestAnimationFrame(frame);

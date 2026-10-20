import type { DomainEvent, TerminalResult } from '../../contracts/simulation-interface.js';

/** Offline descriptive counts only. Never feeds a controller or the simulation. */
export function summarize(events: readonly DomainEvent[], terminal: TerminalResult) {
  const eventCounts: Record<string,number> = {};
  for (const event of events) eventCounts[event.kind] = (eventCounts[event.kind] ?? 0) + 1;
  return { version:'stage0/0.1.0', terminal, eventCounts, responseLatency:null, reason:'Stage 0 has no defined tactical cue/response measure.' };
}

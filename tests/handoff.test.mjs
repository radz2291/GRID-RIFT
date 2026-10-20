import test from "node:test";
import assert from "node:assert/strict";
import { catalog, experimentPaths, readJson, validateExperiment, validateHandoff } from "../scripts/validate-handoff.mjs";

const fixture = () => readJson("experiments/000-vertical-slice.json");
const mutate = (change) => { const value = fixture(); change(value); return validateExperiment(value); };
const rejects = (change, pattern) => assert.match(mutate(change).join("\n"), pattern);

for (const path of experimentPaths()) {
  test(`valid specification: ${path}`, () => assert.deepEqual(validateExperiment(readJson(path)), []));
}
test("rejects unknown top-level field", () => rejects((e) => { e.hiddenAdvantage = true; }, /additional properties/));
test("rejects negative seed", () => rejects((e) => { e.seed = -1; }, />= 0/));
test("rejects non-integer tick rate", () => rejects((e) => { e.timing.tickRateHz = 20.5; }, /integer/));
test("rejects duplicate participant IDs", () => rejects((e) => { e.participants[1].id = "p1"; }, /Duplicate participant/));
test("rejects unknown team reference", () => rejects((e) => { e.participants[0].teamId = "missing"; }, /Unknown team/));
test("rejects duplicate team IDs", () => rejects((e) => { e.teams[1].id = "alpha"; }, /Duplicate team/));
test("rejects duplicate module IDs", () => rejects((e) => { e.modules.push(structuredClone(e.modules[0])); }, /Duplicate module/));
test("rejects unknown module", () => rejects((e) => { e.modules.push({ id: "invented.module", version: "0.1.0", config: {} }); }, /Unknown module/));
test("rejects unsupported module version", () => rejects((e) => { e.modules[0].version = "9.0.0"; }, /Unsupported module version/));
test("rejects missing movement dependency", () => rejects((e) => { e.modules = e.modules.filter((m) => m.id !== "movement.planar"); }, /Missing dependency movement.planar/));
test("rejects unknown module configuration field", () => rejects((e) => { e.modules[0].config.indoor = true; }, /config.*additional properties/));
test("rejects invalid movement speed", () => rejects((e) => { e.modules.find((m) => m.id === "movement.planar").config.speed = -1; }, /config/));
test("rejects non-finite module values", () => rejects((e) => { e.modules[0].config.width = Infinity; }, /config/));
test("rejects an impossible reaction window", () => rejects((e) => { e.participants[1].controller.reactionTicks = 100; }, /Reaction delay/));
test("rejects snapshot interval beyond run length", () => rejects((e) => { e.timing.snapshotEveryTicks = 999999; }, /snapshotEveryTicks exceeds/));
test("rejects omitted termination provider", () => rejects((e) => { e.modules = e.modules.filter((m) => m.id !== "rules.relay-score"); }, /exactly one termination/));
test("rejects multiple termination providers", () => rejects((e) => { e.modules.push({ id: "rules.core-destruction", version: "0.1.0", config: { unlockAfterTowers: 1, simultaneousResult: "draw", timeoutTiebreak: "core-fraction-tower-health-relay-score" } }); }, /exactly one termination/));
test("objective module rejects unassigned ownership", () => rejects((e) => { e.participants[0].teamId = null; }, /requires team assignments/));
test("schema does not force two teams or combat", () => {
  const e = readJson("experiments/002-control-field.json");
  assert.equal(e.teams.length, 3);
  assert.equal(e.participants.length, 3);
  assert.ok(e.modules.every((m) => !m.id.startsWith("combat.") && !m.id.startsWith("lane.")));
  assert.deepEqual(validateExperiment(e), []);
});
test("tactical baseline has one human and five AI controllers", () => {
  const e = readJson("experiments/001-tactical-combat.json");
  assert.equal(e.participants.filter((p) => p.controller.kind === "human").length, 1);
  assert.equal(e.participants.filter((p) => p.controller.kind === "local-policy").length, 5);
});
test("initial catalog is explicitly specification-only", () => {
  assert.ok(Object.values(catalog.modules).every((m) => m.status === "spec-only"));
});
test("all handoff references and experiments validate", () => assert.deepEqual(validateHandoff(), []));

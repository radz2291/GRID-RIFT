import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBoundaries } from "../../scripts/check-boundaries.mjs";

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), "grid-rift-boundaries-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  }
  return checkBoundaries(root);
}

test("deterministic core, contracts, hashing, schema validation and policy utilities are permitted", (t) => {
  assert.deepEqual(fixture(t, {
    "contracts/types.ts": "export interface Value { tick: number }",
    "src/core/types.ts": "export type { Value } from '../../contracts/types.js';",
    "src/core/hash.ts": "import { createHash as hash } from 'node:crypto'; import Ajv from 'ajv/dist/2020.js'; export const x = Math.floor(2.1);",
    "src/core/util.ts": "export const clamp = (x: number) => Math.max(0,x);",
    "src/agents/policy.ts": "import type { Value } from '../../contracts/types.js'; import { clamp } from '../core/util.js';",
  }), []);
});

test("direct imports cannot reverse core dependency direction", (t) => {
  const errors = fixture(t, {
    "src/core/core.ts": "import '../modules/world.js'; export * from '../runner/run.js'; import 'three';",
    "src/modules/world.ts": "export {};", "src/runner/run.ts": "export {};",
  });
  assert.equal(errors.length, 3);
  for (const fragment of ["modules/world", "runner/run", "three"]) assert.ok(errors.some((e) => e.includes(fragment)));
});

test("re-exports through contracts cannot hide a forbidden transitive import", (t) => {
  const errors = fixture(t, {
    "src/core/core.ts": "import '../../contracts/bridge.js';",
    "contracts/bridge.ts": "export * from '../src/adapters/browser.js';",
    "src/adapters/browser.ts": "export {};",
  });
  assert.ok(errors.some((e) => e.includes("forbidden import") && e.includes("via src/core/core.ts")));
});

test("policy dependencies cannot transitively reach filesystem, networking or core hashing", (t) => {
  const errors = fixture(t, {
    "src/agents/policy.ts": "import '../core/util.js';",
    "src/core/util.ts": "import { readFileSync } from 'node:fs'; import { createHash } from 'node:crypto'; import 'https';",
  });
  for (const specifier of ["node:fs", "node:crypto", "https"]) assert.ok(errors.some((e) => e.startsWith("agents:") && e.includes(specifier)));
});

test("clock, random, browser, dynamic loading and ambient aliases fail", (t) => {
  const errors = fixture(t, {
    "src/core/core.ts": "const a = Date.now(); const b = Math.random(); const c = performance.now(); setTimeout(() => {}, 5); fetch('x'); const m = Math; const g = globalThis; import('../runner/run.js');",
  });
  for (const fragment of ["Date", "Math.random", "performance", "setTimeout", "fetch", "globalThis", "dynamic imports"]) assert.ok(errors.some((e) => e.includes(fragment)), fragment);
});

test("crypto random APIs are rejected while deterministic hashing stays allowed", (t) => {
  const errors = fixture(t, { "src/core/random.ts": "import { randomBytes } from 'node:crypto';" });
  assert.ok(errors.some((e) => e.includes("forbidden import node:crypto")));
});

test("policies cannot import runner, modules, evaluators or providers", (t) => {
  const files = { "src/agents/policy.ts": "import '../runner/run.js'; import '../modules/world.js'; import '../evaluation/score.js'; import '../providers/model.js';" };
  for (const path of ["src/runner/run.ts", "src/modules/world.ts", "src/evaluation/score.ts", "src/providers/model.ts"]) files[path] = "export {};";
  const errors = fixture(t, files);
  assert.equal(errors.length, 4);
});

test("permitted utility imports are still audited for ambient clock reads", (t) => {
  const errors = fixture(t, {
    "src/agents/policy.ts": "import '../core/util.js';",
    "src/core/util.ts": "export const tick = () => Date.now(); console.time('x');",
  });
  assert.ok(errors.some((e) => e.startsWith("agents:") && e.includes("Date") && e.includes("via src/agents/policy.ts")));
  assert.ok(errors.some((e) => e.includes("console clock APIs")));
});

test("comments and strings mentioning forbidden APIs are harmless", (t) => {
  assert.deepEqual(fixture(t, {
    "src/core/help.ts": "// Date.now(), Math.random(), fetch()\nexport const help = 'setTimeout or window are prohibited';",
  }), []);
});

test("unresolved local imports and dynamic type imports fail", (t) => {
  const errors = fixture(t, { "src/agents/a.ts": "import './missing.js'; type X = import('node:fs').Stats;" });
  assert.ok(errors.some((e) => e.includes("unresolved local import")));
  assert.ok(errors.some((e) => e.includes("forbidden import node:fs")));
});

test("real source tree passes the architecture guard", () => {
  assert.deepEqual(checkBoundaries(fileURLToPath(new URL("../../", import.meta.url))), []);
});

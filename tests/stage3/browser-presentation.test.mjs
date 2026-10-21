import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
const rendererModule = new URL('../../runs/stage3-browser-unit/renderer.mjs', import.meta.url);
buildSync({ entryPoints: [fileURLToPath(new URL('../../src/adapters/browser/renderer.ts', import.meta.url))], outfile: fileURLToPath(rendererModule), bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { Battlefield } = await import(rendererModule.href);

const body = (id, teamId, x, z, alive = true) => ({ id, components: { movement: { teamId, x, z }, combat: { alive } } });
function field(entities, reports = []) {
  // Exercise picking without constructing a WebGL renderer. Only the permitted view is supplied.
  return Object.assign(Object.create(Battlefield.prototype), { observation: {
    controlledEntityIds: ['body-p1'], entities,
    world: { 'command.owned': { reports } },
  } });
}
test('attack picking rejects hero and allied bodies while ally picking keeps them separate', () => {
  const view = field([body('body-p1', 'alpha', 5, 5), body('body-a1', 'alpha', 10, 10), body('body-p2', 'beta', 15, 15)]);
  assert.equal(view.hit({ x: 5, z: 5 }), null);
  assert.equal(view.hit({ x: 10, z: 10 }), null);
  assert.equal(view.hitFriendly({ x: 10, z: 10 }), 'body-a1');
  assert.equal(view.hitFriendly({ x: 5, z: 5 }), null);
  assert.equal(view.hit({ x: 15, z: 15 }), 'body-p2');
  assert.equal(view.hitFriendly({ x: 15, z: 15 }), null);
});
test('a delayed report cannot create a live selectable body outside the permitted entities', () => {
  const view = field([body('body-p1', 'alpha', 5, 5), body('body-p2', 'beta', 15, 15, false)], [{ unitId: 'body-a1', x: 20, z: 20, observedTick: 10 }]);
  assert.equal(view.hitFriendly({ x: 20, z: 20 }), null);
  assert.equal(view.hit({ x: 20, z: 20 }), null);
  assert.equal(view.hit({ x: 15, z: 15 }), null);
});

import { build } from 'esbuild';
import { mkdirSync,copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sourceIdentity } from '../dist/src/runner/runtime.js';
export async function buildWeb() {
  mkdirSync('web-dist',{recursive:true});
  const identity=sourceIdentity();
  await build({entryPoints:['src/adapters/browser/client.ts'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'web-dist/game.js',sourcemap:true,define:{__BUILD_INFO__:JSON.stringify(identity)},alias:{'node:crypto':resolve('src/adapters/hash-browser.ts')}});
  copyFileSync('public/index.html','web-dist/index.html');copyFileSync('public/style.css','web-dist/style.css');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('scripts/build-web.mjs'))await buildWeb();

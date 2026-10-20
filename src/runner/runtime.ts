import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { AgentPolicy } from '../../contracts/agent-interface.js';
import type { RunManifest } from '../../contracts/simulation-interface.js';
import type { SimulationConfig } from '../core/types.js';
import { Engine } from '../core/engine.js';
import { clone, hash } from '../core/data.js';
import { raceModule } from '../modules/fixture-race.js';
import { idlePolicy, stepPolicy } from '../agents/baselines.js';
import { Runner } from './runner.js';
import { resolveModules } from '../core/registry.js';

export interface Fixture extends SimulationConfig { id: string; version: string; controllers: (SimulationConfig['controllers'][number] & { policyId: string; policyVersion: string })[] }
export function loadFixture(path: string): Fixture {
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid fixture');
  if (Object.hasOwn(value,'schemaVersion')) {
    // The published envelope is valid input, but its catalog is not an implementation registry.
    const ajv = new Ajv2020({strict:true,allErrors:true});
    const validate=ajv.compile(JSON.parse(readFileSync(resolve('contracts/experiment.schema.json'),'utf8')));
    if (!validate(value)) throw new Error(`Invalid experiment: ${ajv.errorsText(validate.errors)}`);
    const specification=value as {modules:SimulationConfig['modules']};
    resolveModules(specification.modules,[raceModule]);
    throw new Error('Scenario content is not implemented for this experiment');
  }
  const f = value as Fixture;
  const fields = ['id','version','seed','tickRateHz','maxTicks','maxCommandLeadTicks','maxCommandAgeTicks','controllers','modules'];
  if (Object.keys(f).some(k => !fields.includes(k)) || fields.some(k => !Object.hasOwn(f,k)) || typeof f.id !== 'string' || typeof f.version !== 'string' || !Array.isArray(f.controllers) || !Array.isArray(f.modules)) throw new Error('Invalid fixture fields');
  for (const c of f.controllers) {
    if (Object.keys(c).some(k => !['id','actors','budget','policyId','policyVersion'].includes(k))) throw new Error('Unknown controller field');
    if (![idlePolicy, stepPolicy].some(p => p.identity.id === c.policyId && p.identity.version === c.policyVersion)) throw new Error(`Unimplemented policy ${c.policyId}@${c.policyVersion}`);
  }
  for (const m of f.modules) if (m.id !== raceModule.descriptor.id || m.version !== raceModule.descriptor.version) throw new Error(`Unimplemented runtime module ${m.id}@${m.version}; specification entries are not executable`);
  new Engine(configuration(f), [raceModule]);
  return clone(f);
}
export function configuration(f: Fixture): SimulationConfig {
  return { seed:f.seed, tickRateHz:f.tickRateHz, maxTicks:f.maxTicks, maxCommandLeadTicks:f.maxCommandLeadTicks, maxCommandAgeTicks:f.maxCommandAgeTicks, modules:clone(f.modules), controllers:f.controllers.map(({id,actors,budget}) => ({id, actors:clone(actors), budget:clone(budget)})) };
}
export function sourceIdentity(root = process.cwd()) {
  const git = (...args:string[]) => execFileSync('git', args, { cwd:root, encoding:'utf8' }).trim();
  const files = git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean).sort();
  const fingerprint = hash(files.map(path => ({path,bytes:existsSync(resolve(root,path)) ? readFileSync(resolve(root,path)).toString('base64') : null})));
  const pkg = (name:string) => JSON.parse(readFileSync(resolve(root,'node_modules',name,'package.json'),'utf8')).version as string;
  const npm=process.platform==='win32' ? execFileSync('cmd.exe',['/d','/s','/c','npm --version'],{encoding:'utf8'}).trim() : execFileSync('npm',['--version'],{encoding:'utf8'}).trim();
  return { sourceCommit:git('rev-parse','HEAD'), dirtyTreeFingerprint:git('status','--porcelain') ? fingerprint : null, dependencyLockHash:createHash('sha256').update(readFileSync(resolve(root,'package-lock.json'))).digest('hex'), runtime:{ node:process.version, npm, typescript:pkg('typescript'), ajv:pkg('ajv'), nodeTypes:pkg('@types/node'), platform:process.platform, arch:process.arch, sourceTreeHash:fingerprint } };
}
export function makeManifest(f:Fixture, runId:string):RunManifest {
  return {runId,schemaVersion:'0.1.0',apiVersion:'grid-rift/v0',experimentId:f.id,experimentVersion:f.version,experimentHash:hash(f),expandedConfiguration:clone(f) as unknown as RunManifest['expandedConfiguration'],seed:f.seed,...sourceIdentity(),modules:f.modules.map(({id,version})=>({id,version})),controllers:f.controllers.map(({id,policyId,policyVersion,budget})=>({id,policyId,policyVersion,budget})),evaluationVersion:'stage0/0.1.0',inputMode:'policy-rerun'};
}
export function createRunner(f:Fixture, manifest:RunManifest):Runner {
  const policies:Record<string,AgentPolicy> = {};
  for (const c of f.controllers) {
    const p = [idlePolicy,stepPolicy].find(p=>p.identity.id===c.policyId && p.identity.version===c.policyVersion);
    if (!p) throw new Error('Unimplemented policy identity');
    policies[c.id]=p;
  }
  return new Runner(new Engine(configuration(f),[raceModule]),policies,hash(manifest),configuration(f).controllers,f.seed);
}

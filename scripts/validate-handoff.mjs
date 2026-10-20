import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const schema = readJson("contracts/experiment.schema.json");
export const catalog = readJson("contracts/module-catalog.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const envelope = ajv.compile(schema);
const moduleValidators = new Map(Object.entries(catalog.modules).map(([id, entry]) => [id, ajv.compile(entry.configSchema)]));
const formatErrors = (errors = []) => errors.map((e) => `${e.instancePath || "/"}: ${e.message}`);

/** Specification validation only. This deliberately does not claim modules can run. */
export function validateExperiment(experiment) {
  if (!envelope(experiment)) return formatErrors(envelope.errors);
  const errors = [];
  const unique = (items, label) => {
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.id)) errors.push(`Duplicate ${label} id: ${item.id}`);
      seen.add(item.id);
    }
    return seen;
  };
  const teamIds = unique(experiment.teams, "team");
  unique(experiment.participants, "participant");
  const moduleIds = unique(experiment.modules, "module");
  const selected = new Map(experiment.modules.map((m) => [m.id, m]));
  const { timing } = experiment;
  for (const field of ["hashEveryTicks", "snapshotEveryTicks", "maxCommandLeadTicks", "maxCommandAgeTicks"]) {
    if (timing[field] > timing.maxTicks) errors.push(`${field} exceeds maxTicks`);
  }
  for (const participant of experiment.participants) {
    if (participant.teamId !== null && !teamIds.has(participant.teamId)) errors.push(`Unknown team ${participant.teamId} for ${participant.id}`);
    const controller = participant.controller;
    if (controller.reactionTicks > timing.maxCommandLeadTicks) errors.push(`Reaction delay exceeds command lead for ${participant.id}`);
    if (controller.decisionIntervalTicks > timing.maxTicks) errors.push(`Decision interval exceeds maxTicks for ${participant.id}`);
  }
  for (const module of experiment.modules) {
    if (!Object.hasOwn(catalog.modules, module.id)) {
      errors.push(`Unknown module: ${module.id}`);
      continue;
    }
    const definition = catalog.modules[module.id];
    if (module.version !== definition.version) errors.push(`Unsupported module version: ${module.id}@${module.version}`);
    for (const dependency of definition.dependencies) {
      if (!moduleIds.has(dependency)) errors.push(`Missing dependency ${dependency} for ${module.id}`);
    }
    const validateConfig = moduleValidators.get(module.id);
    if (!validateConfig(module.config)) errors.push(...formatErrors(validateConfig.errors).map((message) => `${module.id} config ${message}`));
    if (definition.requiresTeamAssignments && experiment.participants.some((p) => p.teamId === null)) errors.push(`${module.id} requires team assignments`);
  }
  for (const capability of ["world", "termination"]) {
    const providers = experiment.modules.filter((m) => Object.hasOwn(catalog.modules, m.id) && catalog.modules[m.id].provides.includes(capability));
    if (providers.length !== 1) errors.push(`Expected exactly one ${capability} provider; found ${providers.length}`);
  }
  // Validate the dependency graph independently of the array's declaration order.
  const visited = new Set();
  const active = new Set();
  function visit(id) {
    if (active.has(id)) { errors.push(`Module dependency cycle at ${id}`); return; }
    if (visited.has(id) || !Object.hasOwn(catalog.modules, id)) return;
    active.add(id);
    for (const dependency of catalog.modules[id].dependencies) if (moduleIds.has(dependency)) visit(dependency);
    active.delete(id);
    visited.add(id);
  }
  for (const id of moduleIds) visit(id);
  // These are scenario/module constraints, deliberately outside the generic envelope.
  const world = selected.get("world.planar")?.config;
  const lanes = selected.get("lane.skirmish")?.config;
  const relay = selected.get("objective.relay")?.config;
  const coreRule = selected.get("rules.core-destruction")?.config;
  if (lanes && (teamIds.size !== 2 || world?.layout !== "dual-lane")) errors.push("lane.skirmish requires two teams and the dual-lane layout");
  if (lanes && experiment.teams.some((t) => !experiment.participants.some((p) => p.teamId === t.id))) errors.push("lane.skirmish requires a participant on each team");
  if (coreRule && lanes && coreRule.unlockAfterTowers > lanes.towersPerTeam) errors.push("Core unlock requires more towers than exist");
  if (relay && world && relay.radius * 2 > Math.min(world.width, world.depth)) errors.push("Relay diameter exceeds world bounds");
  if (relay && world && world.layout !== "open-field" && relay.zoneCount !== 1) errors.push("Initial duel and lane layouts provide exactly one relay");
  return errors;
}

export function experimentPaths() {
  return readdirSync(resolve(root, "experiments")).filter((name) => name.endsWith(".json")).sort().map((name) => `experiments/${name}`);
}

export function checkDocumentLinks() {
  const errors = [];
  const skip = new Set([".git", "node_modules", "runs", "exports", "dist", "coverage"]);
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (extname(path) === ".md") {
        const text = readFileSync(path, "utf8");
        for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          const target = match[1].split("#")[0];
          if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
          const destination = resolve(dirname(path), decodeURIComponent(target));
          if (relative(root, destination).startsWith(`..${sep}`) || !existsSync(destination)) errors.push(`${relative(root, path)}: missing/outside-repo link ${target}`);
        }
      }
    }
  };
  visit(root);
  return errors;
}

export function validateHandoff() {
  const errors = [];
  for (const path of ["README.md", "AGENTS.md", "CODEX_START.md", "docs/STATUS.md", "docs/10-DEVELOPMENT-ROADMAP.md", "contracts/agent-interface.ts", "contracts/simulation-interface.ts", "experiments/EXPERIMENT-TEMPLATE.md"]) {
    if (!existsSync(resolve(root, path))) errors.push(`Missing required file: ${path}`);
  }
  const identities = new Set();
  for (const path of experimentPaths()) {
    try {
      const experiment = readJson(path);
      const identity = `${experiment.id}@${experiment.version}`;
      if (identities.has(identity)) errors.push(`Duplicate experiment identity: ${identity}`);
      identities.add(identity);
      errors.push(...validateExperiment(experiment).map((message) => `${path}: ${message}`));
    } catch (error) { errors.push(`${path}: ${error.message}`); }
  }
  errors.push(...checkDocumentLinks());
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateHandoff();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Handoff validation passed: ${experimentPaths().length} experiment specifications; document links resolved.`);
    console.log("Scope: schemas and specification semantics only. Runtime acceptance is checked separately by npm run test:runtime; no playable client is claimed.");
  }
}

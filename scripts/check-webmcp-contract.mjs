import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'aftershade-webmcp-'));
const outfile = join(temp, 'contract.mjs');

try {
  await build({
    entryPoints: ['lib/webmcp.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    logLevel: 'silent',
  });

  const { registerAftershadeTools } = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
  const registered = new Map();
  const controller = new AbortController();
  const context = {
    registerTool(tool, options) {
      if (registered.has(tool.name)) throw new Error(`duplicate tool ${tool.name}`);
      registered.set(tool.name, tool);
      options?.signal?.addEventListener('abort', () => registered.delete(tool.name), { once: true });
    },
  };

  await registerAftershadeTools(context, controller.signal);
  if (registered.size !== 11) throw new Error(`expected 11 tools, received ${registered.size}`);

  const inspect = registered.get('inspect_heat_scenario');
  const create = registered.get('create_plan_branch');
  const setConstraints = registered.get('set_heat_constraints');
  const apply = registered.get('apply_heat_interventions');
  const remove = registered.get('remove_heat_intervention');
  const simulate = registered.get('simulate_heat_plan');
  const compare = registered.get('compare_heat_plans');
  const ready = registered.get('mark_heat_plan_ready');
  const undo = registered.get('undo_heat_change');
  const reset = registered.get('reset_aftershade_demo');
  for (const tool of [inspect, create, setConstraints, apply, remove, simulate, compare, ready, undo, reset]) {
    if (!tool) throw new Error('required tool missing');
  }

  const initial = await inspect.execute({});
  if (initial.revision !== 1 || initial.constraints.budget !== 350) throw new Error('seed read failed');

  let invalidFailed = false;
  try {
    await create.execute({ expectedRevision: 'one', name: 'Invalid' });
  } catch (error) {
    invalidFailed = String(error).includes('INVALID_REVISION');
  }
  if (!invalidFailed) throw new Error('invalid input was not rejected');
  if ((await inspect.execute({})).revision !== 1) throw new Error('invalid input corrupted revision');

  let invalidConstraintFailed = false;
  try {
    await setConstraints.execute({ expectedRevision: 1, budget: '350' });
  } catch (error) {
    invalidConstraintFailed = String(error).includes('INVALID_BUDGET');
  }
  if (!invalidConstraintFailed) throw new Error('non-integer constraint was not rejected');

  let invalidReadyFailed = false;
  try {
    await ready.execute({ expectedRevision: 1 });
  } catch (error) {
    invalidReadyFailed = String(error).includes('PLAN_HAS_VIOLATIONS');
  }
  if (!invalidReadyFailed) throw new Error('invalid plan was marked ready');
  let failedMutationAddedUndo = false;
  try {
    await undo.execute({ expectedRevision: 1 });
  } catch (error) {
    failedMutationAddedUndo = String(error).includes('NOTHING_TO_UNDO');
  }
  if (!failedMutationAddedUndo) throw new Error('failed mutation polluted undo history');

  const created = await create.execute({ expectedRevision: 1, name: 'Cool Walk' });
  if (created.revision !== 2 || created.activePlanId !== 'cool-walk') throw new Error('branch creation failed');

  const applied = await apply.execute({
    expectedRevision: 2,
    additions: [
      { type: 'shade_canopy', siteId: 'crossing' },
      { type: 'tree_corridor', siteId: 'school' },
      { type: 'bus_shelter', siteId: 'transit' },
    ],
  });
  if (applied.revision !== 3 || applied.metrics.cost !== 204) throw new Error('atomic intervention bundle failed');

  const simulated = await simulate.execute({ expectedRevision: 3 });
  if (simulated.revision !== 4 || simulated.metrics.exposedRoute >= 68) throw new Error('simulation failed');

  const constrained = await setConstraints.execute({ expectedRevision: 4, protectedSites: ['market', 'garden', 'school'] });
  if (constrained.revision !== 5 || constrained.metrics.violations.length !== 1) throw new Error('human-style constraint conflict was not exposed');

  let staleFailed = false;
  try {
    await apply.execute({ expectedRevision: 4, additions: [{ type: 'water_station', siteId: 'library' }] });
  } catch (error) {
    staleFailed = String(error).includes('STALE_REVISION');
  }
  if (!staleFailed) throw new Error('stale write was not rejected');
  const afterHuman = await inspect.execute({});
  if (afterHuman.revision !== 5) throw new Error('stale write corrupted state');

  const blocked = afterHuman.activePlan.interventions.find((item) => item.siteId === 'school' && item.type === 'tree_corridor');
  if (!blocked) throw new Error('conflicting intervention was not inspectable');
  const removed = await remove.execute({ expectedRevision: 5, interventionId: blocked.id });
  if (removed.revision !== 6 || removed.metrics.violations.length !== 1) throw new Error('intervention removal did not recompute the exposure constraint');
  const adapted = await apply.execute({ expectedRevision: 6, additions: [{ type: 'shade_canopy', siteId: 'school' }] });
  if (adapted.revision !== 7 || adapted.metrics.violations.length !== 0) throw new Error('constraint adaptation failed');
  const resimulated = await simulate.execute({ expectedRevision: 7 });
  if (resimulated.revision !== 8) throw new Error('adapted simulation failed');
  const markedReady = await ready.execute({ expectedRevision: 8 });
  if (markedReady.revision !== 9) throw new Error('valid plan could not be marked ready');

  const comparison = await compare.execute({});
  if (comparison.plans.length !== 2 || comparison.revision !== 9 || comparison.plans[1].status !== 'committed') throw new Error('comparison failed');

  const undone = await undo.execute({ expectedRevision: 9 });
  if (undone.revision !== 10) throw new Error('undo did not advance revision');

  const resetResult = await reset.execute({ confirm: true });
  if (resetResult.revision !== 1 || resetResult.activePlanId !== 'resident-brief') throw new Error('demo reset failed');

  controller.abort();
  if (registered.size !== 0) throw new Error('AbortSignal did not unregister tools');

  console.log('WebMCP contract: 11 tools; registration, runtime validation, atomic mutation, protection conflict, stale-write rejection, adaptation, readiness gate, undo, reset, and cleanup passed.');
} finally {
  await rm(temp, { recursive: true, force: true });
}

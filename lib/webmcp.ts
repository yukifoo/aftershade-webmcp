import { INTERVENTIONS, InterventionType, SITES, SiteId } from './domain';
import { aftershadeStore } from './store';

export interface WebMCPTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute(input: unknown): unknown;
}

export interface ModelContextLike {
  registerTool(tool: WebMCPTool, options?: { signal?: AbortSignal }): void | Promise<void>;
}

const siteIds = SITES.map((site) => site.id);
const interventionTypes = Object.keys(INTERVENTIONS) as InterventionType[];

function record(input: unknown, allowedKeys?: string[]): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('INVALID_INPUT: expected an object.');
  }
  const value = input as Record<string, unknown>;
  if (allowedKeys) {
    const unexpected = Object.keys(value).find((key) => !allowedKeys.includes(key));
    if (unexpected) throw new Error(`INVALID_INPUT: unexpected property ${unexpected}.`);
  }
  return value;
}

function requiredRevision(input: Record<string, unknown>): number {
  const value = input.expectedRevision;
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new Error('INVALID_REVISION: expectedRevision must be a positive integer from inspect_heat_scenario.');
  }
  return Number(value);
}

function requiredString(input: Record<string, unknown>, key: string, max = 60): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new Error(`INVALID_${key.toUpperCase()}: expected a non-empty string up to ${max} characters.`);
  }
  return value.trim();
}

function optionalInteger(input: Record<string, unknown>, key: string, min: number, max: number): number | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`INVALID_${key.toUpperCase()}: expected an integer from ${min} to ${max}.`);
  }
  return Number(value);
}

function currentResult(message: string) {
  const state = aftershadeStore.getState();
  const plan = state.plans.find((item) => item.id === state.activePlanId)!;
  return {
    ok: true,
    message,
    revision: state.revision,
    activePlanId: state.activePlanId,
    metrics: plan.metrics,
  };
}

function inspectResult() {
  const state = aftershadeStore.getState();
  const active = state.plans.find((plan) => plan.id === state.activePlanId)!;
  return {
    revision: state.revision,
    activePlanId: state.activePlanId,
    constraints: state.constraints,
    places: SITES.map(({ id, name, kind, heat, footfall, note }) => ({ id, name, kind, heat, footfall, note })),
    interventionCatalog: interventionTypes.map((type) => ({ type, label: INTERVENTIONS[type].label, cost: INTERVENTIONS[type].cost })),
    activePlan: { id: active.id, name: active.name, status: active.status, interventions: active.interventions, metrics: active.metrics },
    branches: state.plans.map((plan) => ({ id: plan.id, name: plan.name, status: plan.status, interventionCount: plan.interventions.length, score: plan.metrics.score })),
    concurrency: 'Pass this revision as expectedRevision to every write. If a person changes the map, re-inspect before retrying.',
  };
}

export const AFTERSHADE_TOOLS: WebMCPTool[] = [
  {
    name: 'inspect_heat_scenario',
    title: 'Inspect heat scenario',
    description: 'Read the live Aftershade neighborhood, constraints, intervention catalog, active plan, metrics, branches, and revision. Call before planning and after any stale-revision error.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute(input) { record(input, []); return inspectResult(); },
  },
  {
    name: 'create_plan_branch',
    title: 'Create plan branch',
    description: 'Create and display a reversible plan branch copied from an existing branch. This changes shared page state and advances the revision.',
    inputSchema: {
      type: 'object',
      properties: {
        expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' },
        name: { type: 'string', minLength: 1, maxLength: 42, description: 'Short human-readable branch name.' },
        fromPlanId: { type: 'string', minLength: 1, maxLength: 60, description: 'Existing branch ID. Omit to copy the active branch.' },
      },
      required: ['expectedRevision', 'name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'name', 'fromPlanId']);
      const revision = requiredRevision(value);
      const name = requiredString(value, 'name', 42);
      const fromPlanId = value.fromPlanId === undefined ? undefined : requiredString(value, 'fromPlanId');
      aftershadeStore.createBranch(name, 'agent', fromPlanId, revision);
      return currentResult(`Created branch “${name}”.`);
    },
  },
  {
    name: 'set_heat_constraints',
    title: 'Set heat constraints',
    description: 'Update the budget, exposed-route target, or complete protected-place list. This changes every branch evaluation and advances the shared revision.',
    inputSchema: {
      type: 'object',
      properties: {
        expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' },
        budget: { type: 'integer', minimum: 100, maximum: 750, description: 'Capital budget in thousands of dollars.' },
        targetExposure: { type: 'integer', minimum: 10, maximum: 65, description: 'Maximum percent of the walking route exposed to peak sun.' },
        protectedSites: { type: 'array', uniqueItems: true, items: { type: 'string', enum: siteIds }, description: 'Complete set of place IDs that plans must protect.' },
      },
      required: ['expectedRevision'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'budget', 'targetExposure', 'protectedSites']);
      const revision = requiredRevision(value);
      const changes: { budget?: number; targetExposure?: number; protectedSites?: SiteId[] } = {};
      const budget = optionalInteger(value, 'budget', 100, 750);
      const targetExposure = optionalInteger(value, 'targetExposure', 10, 65);
      if (budget !== undefined) changes.budget = budget;
      if (targetExposure !== undefined) changes.targetExposure = targetExposure;
      if (value.protectedSites !== undefined) {
        if (!Array.isArray(value.protectedSites) || value.protectedSites.some((id) => !siteIds.includes(id as SiteId)) || new Set(value.protectedSites).size !== value.protectedSites.length) throw new Error('INVALID_PROTECTED_SITES: use a unique list of place IDs returned by inspect_heat_scenario.');
        changes.protectedSites = value.protectedSites as SiteId[];
      }
      if (Object.keys(changes).length === 0) throw new Error('NO_CHANGES: provide budget, targetExposure, or protectedSites.');
      aftershadeStore.setConstraints(changes, 'agent', revision);
      return currentResult('Updated scenario constraints.');
    },
  },
  {
    name: 'apply_heat_interventions',
    title: 'Apply heat interventions',
    description: 'Place one to six cooling interventions on the active plan as one atomic bundle, then update its visible metrics. Advances the shared revision.',
    inputSchema: {
      type: 'object',
      properties: {
        expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' },
        additions: {
          type: 'array', minItems: 1, maxItems: 6,
          items: { type: 'object', properties: { type: { type: 'string', enum: interventionTypes }, siteId: { type: 'string', enum: siteIds } }, required: ['type', 'siteId'], additionalProperties: false },
          description: 'Cooling interventions and semantic place IDs to receive them.',
        },
      },
      required: ['expectedRevision', 'additions'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'additions']);
      const revision = requiredRevision(value);
      if (!Array.isArray(value.additions) || value.additions.length < 1 || value.additions.length > 6) throw new Error('INVALID_ADDITIONS: provide one to six interventions.');
      const additions = value.additions.map((raw) => {
        const item = record(raw, ['type', 'siteId']);
        if (!interventionTypes.includes(item.type as InterventionType) || !siteIds.includes(item.siteId as SiteId)) throw new Error('INVALID_INTERVENTION: use type and siteId values returned by inspect_heat_scenario.');
        return { type: item.type as InterventionType, siteId: item.siteId as SiteId };
      });
      aftershadeStore.applyInterventions(additions, 'agent', revision);
      return currentResult(`Applied ${additions.length} intervention${additions.length === 1 ? '' : 's'}.`);
    },
  },
  {
    name: 'remove_heat_intervention',
    title: 'Remove heat intervention',
    description: 'Remove one intervention from the active branch by ID and update its visible metrics. Advances the shared revision.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' }, interventionId: { type: 'string', minLength: 1, maxLength: 160, description: 'Intervention ID from inspect_heat_scenario.' } }, required: ['expectedRevision', 'interventionId'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'interventionId']);
      aftershadeStore.removeIntervention(requiredString(value, 'interventionId', 160), 'agent', requiredRevision(value));
      return currentResult('Removed the intervention.');
    },
  },
  {
    name: 'simulate_heat_plan',
    title: 'Simulate heat plan',
    description: 'Re-run the deterministic heat, exposure, canopy, comfort, cost, score, and constraint checks for the active branch. Advances the revision and shows the result.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' } }, required: ['expectedRevision'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision']);
      aftershadeStore.simulate('agent', requiredRevision(value));
      return currentResult('Simulated the active plan.');
    },
  },
  {
    name: 'compare_heat_plans',
    title: 'Compare heat plans',
    description: 'Read a compact side-by-side comparison of every branch using the current shared constraints. Does not change the page.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute(input) {
      record(input, []);
      const value = aftershadeStore.getState();
      return { revision: value.revision, constraints: value.constraints, plans: value.plans.map((plan) => ({ id: plan.id, name: plan.name, status: plan.status, interventions: plan.interventions.length, ...plan.metrics })) };
    },
  },
  {
    name: 'show_heat_plan',
    title: 'Show heat plan',
    description: 'Bring an existing branch into the shared visible map without committing it. Advances the revision because it changes shared page focus.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' }, planId: { type: 'string', minLength: 1, maxLength: 60, description: 'Branch ID from inspect_heat_scenario or compare_heat_plans.' } }, required: ['expectedRevision', 'planId'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'planId']);
      aftershadeStore.selectPlan(requiredString(value, 'planId'), 'agent', requiredRevision(value));
      return currentResult('Displayed the requested plan.');
    },
  },
  {
    name: 'mark_heat_plan_ready',
    title: 'Mark heat plan ready',
    description: 'Mark the active branch ready only if it satisfies every current constraint. This is an explicit internal commitment and advances the shared revision.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' } }, required: ['expectedRevision'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision']);
      aftershadeStore.commitPlan('agent', requiredRevision(value));
      return currentResult('Marked the active plan ready for resident review.');
    },
  },
  {
    name: 'undo_heat_change',
    title: 'Undo heat change',
    description: 'Undo the most recent reversible human or agent state change. Requires the current revision and advances to a new revision after restoration.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' } }, required: ['expectedRevision'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision']);
      aftershadeStore.undo('agent', requiredRevision(value));
      return currentResult('Undid the last shared change.');
    },
  },
  {
    name: 'reset_aftershade_demo',
    title: 'Reset Aftershade demo',
    description: 'Restore the seeded neighborhood and resident brief as the next monotonic revision. This discards visible local demo changes but can be undone.',
    inputSchema: { type: 'object', properties: { expectedRevision: { type: 'integer', minimum: 1, description: 'Current revision from inspect_heat_scenario.' }, confirm: { type: 'boolean', const: true, description: 'Must be true to acknowledge local demo changes will be reset.' } }, required: ['expectedRevision', 'confirm'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const value = record(input, ['expectedRevision', 'confirm']);
      if (value.confirm !== true) throw new Error('CONFIRMATION_REQUIRED: set confirm to true.');
      aftershadeStore.reset('agent', requiredRevision(value));
      return currentResult('Restored the seeded demo as a new shared revision.');
    },
  },
];

export async function registerAftershadeTools(context: ModelContextLike, signal: AbortSignal) {
  for (const tool of AFTERSHADE_TOOLS) {
    await Promise.resolve(context.registerTool(tool, { signal }));
  }
}

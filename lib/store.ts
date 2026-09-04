'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Actor, calculateMetrics, cloneState, Constraints, Intervention, InterventionType, makePlan, Plan, SEED_STATE, SiteId } from './domain';

const STORAGE_KEY = 'aftershade-state-v1';
let state = cloneState(SEED_STATE);
let hydrated = false;
let undoStack: AppState[] = [];
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('aftershade:change', { detail: { revision: state.revision } }));
  }
  listeners.forEach((listener) => listener());
}

function nowLabel() {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

function assertRevision(expectedRevision?: number) {
  if (expectedRevision !== undefined && expectedRevision !== state.revision) {
    throw new Error(`STALE_REVISION: expected ${expectedRevision}, current ${state.revision}. Re-inspect the shared state before changing it.`);
  }
}

function commit(actor: Actor, label: string, detail: string, update: (draft: AppState) => void, expectedRevision?: number) {
  assertRevision(expectedRevision);
  const previous = cloneState(state);
  const draft = cloneState(state);
  update(draft);
  undoStack.push(previous);
  if (undoStack.length > 30) undoStack.shift();
  draft.revision += 1;
  draft.activity.unshift({ id: `${draft.revision}-${Date.now()}`, actor, label, detail, revision: draft.revision, at: nowLabel() });
  draft.activity = draft.activity.slice(0, 24);
  state = draft;
  emit();
  return cloneState(state);
}

function activePlan(draft: AppState) {
  const plan = draft.plans.find((item) => item.id === draft.activePlanId);
  if (!plan) throw new Error('ACTIVE_PLAN_NOT_FOUND');
  return plan;
}

function refreshPlan(plan: Plan, constraints: Constraints) {
  plan.metrics = calculateMetrics(plan.interventions, constraints);
  if (plan.status !== 'committed') plan.status = 'simulated';
}

export const aftershadeStore = {
  getState: () => state,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
  hydrate: () => {
    if (hydrated || typeof window === 'undefined') return;
    hydrated = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { state = JSON.parse(stored) as AppState; } catch { state = cloneState(SEED_STATE); }
    }
    emit();
  },
  selectSite: (siteId: SiteId) => { state = { ...state, selectedSiteId: siteId }; emit(); },
  selectPlan: (planId: string, actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Plan brought into view', state.plans.find((plan) => plan.id === planId)?.name ?? planId, (draft) => {
    if (!draft.plans.some((plan) => plan.id === planId)) throw new Error(`PLAN_NOT_FOUND: ${planId}`);
    draft.activePlanId = planId;
  }, expectedRevision),
  createBranch: (name: string, actor: Actor = 'human', fromPlanId = state.activePlanId, expectedRevision?: number) => commit(actor, 'Plan branch created', `${name} from ${fromPlanId}`, (draft) => {
    const source = draft.plans.find((plan) => plan.id === fromPlanId);
    if (!source) throw new Error(`PLAN_NOT_FOUND: ${fromPlanId}`);
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';
    let id = baseId;
    let suffix = 2;
    while (draft.plans.some((plan) => plan.id === id)) id = `${baseId}-${suffix++}`;
    const accents: Plan['accent'][] = ['cyan', 'lime', 'coral'];
    const plan = makePlan(id, name.slice(0, 42), accents[draft.plans.length % accents.length], source.interventions.map((item) => ({ ...item, id: `${id}-${item.id}` })), draft.constraints);
    plan.status = 'draft';
    draft.plans.push(plan);
    draft.activePlanId = plan.id;
  }, expectedRevision),
  applyInterventions: (additions: Array<{ type: InterventionType; siteId: SiteId }>, actor: Actor = 'human', expectedRevision?: number) => commit(actor, additions.length === 1 ? 'Intervention placed' : 'Intervention bundle placed', additions.map((item) => `${item.type} @ ${item.siteId}`).join(', '), (draft) => {
    const plan = activePlan(draft);
    for (const addition of additions) {
      if (plan.interventions.some((item) => item.siteId === addition.siteId && item.type === addition.type)) throw new Error(`DUPLICATE_INTERVENTION: ${addition.type} already exists at ${addition.siteId}.`);
      const intervention: Intervention = { id: `${addition.type}-${addition.siteId}-${Date.now()}-${plan.interventions.length}`, type: addition.type, siteId: addition.siteId, author: actor };
      plan.interventions.push(intervention);
    }
    refreshPlan(plan, draft.constraints);
  }, expectedRevision),
  removeIntervention: (interventionId: string, actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Intervention removed', interventionId, (draft) => {
    const plan = activePlan(draft);
    const next = plan.interventions.filter((item) => item.id !== interventionId);
    if (next.length === plan.interventions.length) throw new Error(`INTERVENTION_NOT_FOUND: ${interventionId}`);
    plan.interventions = next;
    refreshPlan(plan, draft.constraints);
  }, expectedRevision),
  toggleProtected: (siteId: SiteId, actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Protection changed', siteId, (draft) => {
    const isProtected = draft.constraints.protectedSites.includes(siteId);
    draft.constraints.protectedSites = isProtected ? draft.constraints.protectedSites.filter((id) => id !== siteId) : [...draft.constraints.protectedSites, siteId];
    draft.plans.forEach((plan) => refreshPlan(plan, draft.constraints));
  }, expectedRevision),
  setConstraints: (changes: Partial<Constraints>, actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Scenario constraints updated', JSON.stringify(changes), (draft) => {
    if (changes.budget !== undefined) {
      if (!Number.isInteger(changes.budget) || changes.budget < 100 || changes.budget > 750) throw new Error('INVALID_BUDGET: use an integer from 100 to 750 ($k).');
      draft.constraints.budget = changes.budget;
    }
    if (changes.targetExposure !== undefined) {
      if (!Number.isInteger(changes.targetExposure) || changes.targetExposure < 10 || changes.targetExposure > 65) throw new Error('INVALID_TARGET: use an integer percentage from 10 to 65.');
      draft.constraints.targetExposure = changes.targetExposure;
    }
    if (changes.protectedSites !== undefined) {
      const unique = [...new Set(changes.protectedSites)];
      draft.constraints.protectedSites = unique;
    }
    draft.plans.forEach((plan) => refreshPlan(plan, draft.constraints));
  }, expectedRevision),
  simulate: (actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Plan simulated', `Deterministic model run for ${state.activePlanId}`, (draft) => refreshPlan(activePlan(draft), draft.constraints), expectedRevision),
  commitPlan: (actor: Actor = 'human', expectedRevision?: number) => commit(actor, 'Plan marked ready', state.activePlanId, (draft) => {
    const plan = activePlan(draft);
    refreshPlan(plan, draft.constraints);
    if (plan.metrics.violations.length > 0) throw new Error(`PLAN_HAS_VIOLATIONS: ${plan.metrics.violations.join(' ')}`);
    draft.plans.forEach((item) => { item.status = item.id === plan.id ? 'committed' : item.status === 'committed' ? 'simulated' : item.status; });
  }, expectedRevision),
  undo: (actor: Actor = 'human', expectedRevision?: number) => {
    assertRevision(expectedRevision);
    const previous = undoStack.pop();
    if (!previous) throw new Error('NOTHING_TO_UNDO');
    const restored = cloneState(previous);
    restored.revision = state.revision + 1;
    restored.activity.unshift({ id: `${restored.revision}-${Date.now()}`, actor, label: 'Last change undone', detail: 'Restored the previous shared state.', revision: restored.revision, at: nowLabel() });
    state = restored;
    emit();
    return cloneState(state);
  },
  reset: () => { undoStack = []; state = cloneState(SEED_STATE); emit(); return cloneState(state); },
};

export function useAftershadeState() {
  const snapshot = useSyncExternalStore(aftershadeStore.subscribe, aftershadeStore.getState, () => SEED_STATE);
  useEffect(() => aftershadeStore.hydrate(), []);
  return snapshot;
}

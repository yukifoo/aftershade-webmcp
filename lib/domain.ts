export type Actor = 'human' | 'agent' | 'system';

export type SiteId =
  | 'market'
  | 'crossing'
  | 'library'
  | 'school'
  | 'garden'
  | 'transit';

export type InterventionType =
  | 'tree_corridor'
  | 'shade_canopy'
  | 'cool_pavement'
  | 'water_station'
  | 'bus_shelter'
  | 'pocket_grove';

export interface Site {
  id: SiteId;
  name: string;
  shortName: string;
  kind: string;
  x: number;
  y: number;
  heat: number;
  footfall: number;
  note: string;
}

export interface Intervention {
  id: string;
  type: InterventionType;
  siteId: SiteId;
  author: Actor;
}

export interface Metrics {
  peakTemp: number;
  exposedRoute: number;
  canopy: number;
  comfortStops: number;
  cost: number;
  score: number;
  violations: string[];
}

export interface Plan {
  id: string;
  name: string;
  accent: 'cyan' | 'coral' | 'lime';
  interventions: Intervention[];
  metrics: Metrics;
  status: 'draft' | 'simulated' | 'committed';
}

export interface Constraints {
  budget: number;
  targetExposure: number;
  protectedSites: SiteId[];
}

export interface Activity {
  id: string;
  actor: Actor;
  label: string;
  detail: string;
  revision: number;
  at: string;
}

export interface AppState {
  revision: number;
  activePlanId: string;
  selectedSiteId: SiteId;
  constraints: Constraints;
  plans: Plan[];
  activity: Activity[];
}

export const SITES: Site[] = [
  { id: 'market', name: 'Market loading bay', shortName: 'Market', kind: 'Daily deliveries', x: 12, y: 17, heat: 43.1, footfall: 88, note: 'Delivery access is essential before 10:00.' },
  { id: 'crossing', name: 'Sunline crossing', shortName: 'Crossing', kind: 'Unshaded crossing', x: 46, y: 20, heat: 44.2, footfall: 96, note: 'Longest wait on the walking route.' },
  { id: 'library', name: 'Library plaza', shortName: 'Library', kind: 'Rest point', x: 79, y: 21, heat: 42.5, footfall: 72, note: 'Older residents rest here after lunch.' },
  { id: 'school', name: 'School gate', shortName: 'School', kind: 'Afternoon queue', x: 20, y: 69, heat: 43.7, footfall: 91, note: 'Crowded between 14:30 and 15:30.' },
  { id: 'garden', name: 'Community garden', shortName: 'Garden', kind: 'Protected place', x: 53, y: 70, heat: 39.8, footfall: 54, note: 'Residents asked that no hardscape replace it.' },
  { id: 'transit', name: 'Eastbound stop', shortName: 'Transit', kind: 'Transit wait', x: 84, y: 68, heat: 43.6, footfall: 83, note: 'No seating or cover at peak heat.' },
];

export const INTERVENTIONS: Record<InterventionType, { label: string; shortLabel: string; cost: number; temp: number; exposure: number; canopy: number; comfort: number; glyph: string }> = {
  tree_corridor: { label: 'Tree corridor', shortLabel: 'Trees', cost: 82, temp: 0.7, exposure: 11, canopy: 9, comfort: 1, glyph: 'T' },
  shade_canopy: { label: 'Shade canopy', shortLabel: 'Canopy', cost: 54, temp: 0.35, exposure: 14, canopy: 3, comfort: 1, glyph: 'S' },
  cool_pavement: { label: 'Cool pavement', shortLabel: 'Cool pave', cost: 74, temp: 0.8, exposure: 4, canopy: 0, comfort: 0, glyph: 'C' },
  water_station: { label: 'Water station', shortLabel: 'Water', cost: 24, temp: 0.1, exposure: 2, canopy: 0, comfort: 2, glyph: 'W' },
  bus_shelter: { label: 'Cool transit shelter', shortLabel: 'Shelter', cost: 68, temp: 0.25, exposure: 9, canopy: 2, comfort: 2, glyph: 'B' },
  pocket_grove: { label: 'Pocket grove', shortLabel: 'Grove', cost: 116, temp: 1.05, exposure: 8, canopy: 13, comfort: 2, glyph: 'G' },
};

const BASE_METRICS: Metrics = { peakTemp: 44.2, exposedRoute: 68, canopy: 14, comfortStops: 1, cost: 0, score: 23, violations: [] };

export function calculateMetrics(interventions: Intervention[], constraints: Constraints): Metrics {
  const uniqueSites = new Set<SiteId>();
  let tempReduction = 0;
  let exposureReduction = 0;
  let canopy = BASE_METRICS.canopy;
  let comfortStops = BASE_METRICS.comfortStops;
  let cost = 0;

  for (const intervention of interventions) {
    const effect = INTERVENTIONS[intervention.type];
    const site = SITES.find((item) => item.id === intervention.siteId)!;
    const heatMultiplier = 0.92 + (site.heat - 39) * 0.025;
    const repeatMultiplier = uniqueSites.has(site.id) ? 0.55 : 1;
    uniqueSites.add(site.id);
    tempReduction += effect.temp * heatMultiplier * repeatMultiplier;
    exposureReduction += effect.exposure * repeatMultiplier;
    canopy += effect.canopy * repeatMultiplier;
    comfortStops += effect.comfort * repeatMultiplier;
    cost += effect.cost;
  }

  const violations: string[] = [];
  if (cost > constraints.budget) violations.push(`Budget exceeded by $${cost - constraints.budget}k.`);
  const disruptiveTypes: InterventionType[] = ['tree_corridor', 'cool_pavement', 'pocket_grove'];
  for (const siteId of constraints.protectedSites) {
    const disruptive = interventions.some((item) => item.siteId === siteId && disruptiveTypes.includes(item.type));
    if (disruptive) violations.push(`${siteById(siteId).name} protection conflicts with a disruptive intervention.`);
  }

  const exposedRoute = Math.max(12, Math.round(68 - exposureReduction));
  if (exposedRoute >= constraints.targetExposure) violations.push(`Exposed route must fall below ${constraints.targetExposure}%; it is currently ${exposedRoute}%.`);
  const peakTemp = Math.max(37, 44.2 - tempReduction);
  const score = Math.max(0, Math.min(100, Math.round(20 + tempReduction * 10 + exposureReduction * 0.55 + (canopy - 14) * 0.35 + (comfortStops - 1) * 1.5 - violations.length * 12)));

  return { peakTemp: Number(peakTemp.toFixed(1)), exposedRoute, canopy: Math.round(canopy), comfortStops: Math.round(comfortStops), cost, score, violations };
}

export function makePlan(id: string, name: string, accent: Plan['accent'] = 'cyan', interventions: Intervention[] = [], constraints: Constraints): Plan {
  return { id, name, accent, interventions, metrics: calculateMetrics(interventions, constraints), status: interventions.length > 0 ? 'simulated' : 'draft' };
}

export const SEED_CONSTRAINTS: Constraints = { budget: 350, targetExposure: 35, protectedSites: ['market', 'garden'] };

export const SEED_STATE: AppState = {
  revision: 1,
  activePlanId: 'resident-brief',
  selectedSiteId: 'crossing',
  constraints: SEED_CONSTRAINTS,
  plans: [makePlan('resident-brief', 'Resident brief', 'coral', [], SEED_CONSTRAINTS)],
  activity: [{ id: 'seed-1', actor: 'human', label: 'Resident priorities added', detail: 'Keep market access and the community garden. Reach <35% exposed route.', revision: 1, at: '09:00' }],
};

export function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
}

export function siteById(id: SiteId): Site {
  return SITES.find((site) => site.id === id)!;
}

'use client';

import {
  Bot,
  Check,
  GitBranch,
  Leaf,
  LockKeyhole,
  MapPin,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  ThermometerSun,
  Undo2,
  UserRound,
  Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { INTERVENTIONS, InterventionType, SITES, siteById } from '@/lib/domain';
import { aftershadeStore, useAftershadeState } from '@/lib/store';
import { useWebMCP } from '@/hooks/use-webmcp';

const toolOrder: InterventionType[] = [
  'tree_corridor',
  'shade_canopy',
  'cool_pavement',
  'water_station',
  'bus_shelter',
  'pocket_grove',
];

export default function Home() {
  useWebMCP();
  const state = useAftershadeState();
  const activePlan = state.plans.find((plan) => plan.id === state.activePlanId) ?? state.plans[0];
  const selectedSite = siteById(state.selectedSiteId);
  const selectedInterventions = activePlan.interventions.filter((item) => item.siteId === selectedSite.id);

  function safeAction(action: () => void) {
    try {
      action();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#071319] text-[#eef7f5]">
      <header className="border-b border-white/10 bg-[#08171d]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true"><Sun className="h-5 w-5" /></div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-xl font-semibold tracking-[-0.03em]">Aftershade</h1>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-[#7e9da5] sm:inline">shared climate studio</span>
              </div>
              <p className="text-xs text-[#91a9ae]">Negotiate a cooler street with your agent.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="revision-pill" title="Every human or agent edit advances the shared revision.">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7af0cf] shadow-[0_0_10px_#7af0cf]" />
              Shared state · r{state.revision}
            </div>
            <Button size="sm" variant="ghost" onClick={() => safeAction(() => aftershadeStore.undo())} className="hidden text-[#bad0d4] hover:bg-white/10 hover:text-white sm:inline-flex">
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => aftershadeStore.reset()} className="text-[#bad0d4] hover:bg-white/10 hover:text-white" aria-label="Reset demo">
              <RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1540px] gap-3 p-3 lg:h-[calc(100vh-69px)] lg:grid-cols-[260px_minmax(520px,1fr)_330px] lg:overflow-hidden lg:p-4">
        <aside className="left-rail panel flex min-h-0 flex-col overflow-hidden">
          <section className="brief-section border-b border-white/8 p-4">
            <div className="eyebrow"><LockKeyhole className="h-3 w-3" /> Resident brief</div>
            <h2 className="mt-2 font-display text-lg leading-tight">Cool the everyday walk, not just the average block.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#94abb0]">The model can search options. People decide what the neighborhood cannot lose.</p>
          </section>

          <section className="constraints-section border-b border-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Hard constraints</span>
              <span className="font-mono text-[11px] text-[#7af0cf]">LIVE</span>
            </div>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="constraint-row"><dt>Capital budget</dt><dd>${state.constraints.budget}k</dd></div>
              <div className="constraint-row"><dt>Exposed route</dt><dd>&lt; {state.constraints.targetExposure}%</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {state.constraints.protectedSites.map((id) => (
                <span key={id} className="protection-chip"><Shield className="h-3 w-3" /> {siteById(id).shortName}</span>
              ))}
            </div>
          </section>

          <section className="plans-section min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Plan branches</span>
              <Button size="icon-xs" variant="ghost" className="text-[#8ca7ad] hover:bg-white/10 hover:text-white" aria-label="Create plan branch" onClick={() => safeAction(() => aftershadeStore.createBranch(`Plan ${state.plans.length + 1}`))}>
                <GitBranch className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {state.plans.map((plan) => (
                <button key={plan.id} onClick={() => plan.id !== state.activePlanId && safeAction(() => aftershadeStore.selectPlan(plan.id))} className={`plan-card plan-${plan.accent} ${plan.id === state.activePlanId ? 'active' : ''}`}>
                  <span className="plan-accent" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium">{plan.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase text-[#6f8c92]">{plan.interventions.length} moves · score {plan.metrics.score}</span>
                  </span>
                  {plan.status === 'committed' ? <Check className="h-4 w-4 text-[#7af0cf]" /> : <span className="text-xs tabular-nums text-[#8ba4aa]">${plan.metrics.cost}k</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="judge-section border-t border-white/8 bg-[#0a1b21] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#7af0cf]">Judge prompt</p>
            <p className="mt-2 text-xs leading-relaxed text-[#bdd0d3]">Inspect this neighborhood. Create two plans under $350k that cut exposed route below 35% while protecting the market and garden. Simulate and compare them; do not commit.</p>
          </section>
        </aside>

        <section className="panel relative min-h-[680px] overflow-hidden lg:min-h-0">
          <div className="absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-[#0b1b21]/92 px-4 py-3 backdrop-blur-md">
            <div>
              <div className="eyebrow"><MapPin className="h-3 w-3" /> Alder &amp; 8th · 15:00 heat peak</div>
              <h2 className="mt-1 font-display text-lg">{activePlan.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="weather-pill"><ThermometerSun className="h-4 w-4 text-[#ff866d]" /> 44.2°C baseline</div>
              <Button size="sm" onClick={() => safeAction(() => aftershadeStore.simulate())} className="bg-[#e9fff9] text-[#092029] hover:bg-white"><Play className="h-4 w-4 fill-current" /> Simulate</Button>
            </div>
          </div>

          <div className="map-surface absolute inset-x-0 bottom-[178px] top-[73px]">
            <div className="heat-legend" aria-label="Heat intensity legend"><span>Surface heat</span><i /><span>39°</span><b /><span>44°</span></div>
            <div className="street-label street-a">ALDER STREET</div>
            <div className="street-label street-b">8TH AVENUE</div>
            <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 18 C28 24 37 17 47 21 S69 28 79 21 S79 55 84 68 S63 76 53 70 S31 65 20 69" /></svg>
            {SITES.map((site) => {
              const additions = activePlan.interventions.filter((item) => item.siteId === site.id);
              const isProtected = state.constraints.protectedSites.includes(site.id);
              return (
                <button key={site.id} className={`site-node ${state.selectedSiteId === site.id ? 'selected' : ''}`} style={{ left: `${site.x}%`, top: `${site.y}%`, '--heat': `${(site.heat - 39) / 6}` } as React.CSSProperties} onClick={() => aftershadeStore.selectSite(site.id)} aria-label={`Select ${site.name}, ${site.heat} degrees`}>
                  <span className="heat-orbit" />
                  <span className="site-core">{isProtected && <Shield className="shield-mark h-3.5 w-3.5" />}<span className="site-temp">{site.heat.toFixed(1)}°</span></span>
                  <span className="site-label">{site.shortName}</span>
                  {additions.length > 0 && <span className="intervention-stack">{additions.slice(0, 3).map((item) => <i key={item.id}>{INTERVENTIONS[item.type].glyph}</i>)}</span>}
                </button>
              );
            })}
            <div className="north-mark" aria-hidden="true"><span>N</span><Wind className="h-4 w-4" /></div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 h-[178px] border-t border-white/8 bg-[#09181e]/97 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="eyebrow">Selected place</span>
                  {state.constraints.protectedSites.includes(selectedSite.id) && <span className="font-mono text-[9px] uppercase tracking-wide text-[#7af0cf]">protected</span>}
                </div>
                <p className="mt-1 truncate text-sm font-semibold">{selectedSite.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#769299]">{selectedSite.note}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => safeAction(() => aftershadeStore.toggleProtected(selectedSite.id))} className="shrink-0 border-white/12 bg-transparent text-[#bbced1] hover:bg-white/8 hover:text-white">
                <Shield className="h-3.5 w-3.5" />{state.constraints.protectedSites.includes(selectedSite.id) ? 'Unprotect' : 'Protect'}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {toolOrder.map((type) => {
                const item = INTERVENTIONS[type];
                return (
                  <button key={type} className="tool-tile" onClick={() => safeAction(() => aftershadeStore.applyInterventions([{ type, siteId: selectedSite.id }]))}>
                    <span>{item.glyph}</span><b>{item.shortLabel}</b><i>${item.cost}k</i>
                  </button>
                );
              })}
            </div>
            {selectedInterventions.length > 0 && <div className="pointer-events-none absolute right-4 top-[-28px] rounded-full border border-[#73dec2]/30 bg-[#0b2929] px-3 py-1 text-[10px] text-[#8cebd2] shadow-lg">{selectedInterventions.length} intervention{selectedInterventions.length > 1 ? 's' : ''} here</div>}
          </div>
        </section>

        <aside className="panel flex min-h-0 flex-col overflow-hidden">
          <section className="border-b border-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow"><Sparkles className="h-3 w-3" /> Simulated outcome</span>
              <span className={`status-badge ${activePlan.metrics.violations.length === 0 ? 'pass' : ''}`}>{activePlan.metrics.violations.length === 0 ? 'within brief' : `${activePlan.metrics.violations.length} tensions`}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Peak heat" value={`${activePlan.metrics.peakTemp}°`} delta={`${(44.2 - activePlan.metrics.peakTemp).toFixed(1)}° cooler`} tone="coral" />
              <Metric label="Exposed route" value={`${activePlan.metrics.exposedRoute}%`} delta={`target <${state.constraints.targetExposure}%`} tone="cyan" />
              <Metric label="Tree canopy" value={`${activePlan.metrics.canopy}%`} delta="from 14%" tone="lime" />
              <Metric label="Plan cost" value={`$${activePlan.metrics.cost}k`} delta={`of $${state.constraints.budget}k`} tone="plain" />
            </div>
            <div className="mt-4 rounded-xl border border-white/8 bg-black/15 p-3">
              <div className="flex items-end justify-between">
                <div><p className="text-xs text-[#80999f]">Heat resilience score</p><p className="mt-0.5 font-display text-2xl font-semibold">{activePlan.metrics.score}<span className="text-sm text-[#5d7b82]">/100</span></p></div>
                <Leaf className="h-5 w-5 text-[#9fe870]" />
              </div>
              <Progress value={activePlan.metrics.score} className="mt-3 h-1.5 bg-white/8 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-[#42c6be] [&_[data-slot=progress-indicator]]:to-[#a6ed73]" />
            </div>
            {activePlan.metrics.violations.length > 0 && (
              <ul className="mt-3 space-y-1.5">{activePlan.metrics.violations.map((violation) => <li key={violation} className="flex gap-2 text-xs leading-relaxed text-[#ffaf9e]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7f68]" /> {violation}</li>)}</ul>
            )}
          </section>

          <section className="min-h-0 flex-1 overflow-hidden p-4">
            <div className="flex items-center justify-between"><span className="eyebrow">Shared activity</span><span className="font-mono text-[9px] uppercase text-[#58737a]">human + agent</span></div>
            <div className="activity-line mt-4 h-[calc(100%-24px)] space-y-4 overflow-y-auto pr-1">
              {state.activity.map((item) => (
                <article key={item.id} className="activity-item">
                  <div className={`actor-icon ${item.actor}`}>{item.actor === 'agent' ? <Bot className="h-3.5 w-3.5" /> : item.actor === 'human' ? <UserRound className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-medium text-[#e2efed]">{item.label}</h3><span className="font-mono text-[9px] text-[#526e75]">r{item.revision}</span></div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#78939a]">{item.detail}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase text-[#4e6870]">{item.actor} · {item.at}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-white/8 bg-[#0a1b21] p-4">
            <div className="flex items-start gap-3"><div className="agent-ready"><Bot className="h-4 w-4" /></div><div><p className="text-xs font-semibold">Site tools ready</p><p className="mt-1 text-[11px] leading-relaxed text-[#759097]">Your agent can inspect and change this exact map. Stale writes are rejected.</p></div></div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: 'coral' | 'cyan' | 'lime' | 'plain' }) {
  return <div className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{delta}</span></div>;
}

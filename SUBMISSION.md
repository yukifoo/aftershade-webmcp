# Devpost submission copy

## Project name

Aftershade

## Tagline

A shared urban-heat studio where residents protect lived priorities while agents explore cooler street futures.

## Inspiration

Heat-adaptation tools tend to optimize what can be measured. But a neighborhood is full of constraints that do not arrive as clean GIS fields: a loading bay must stay open before 10:00, older residents rest at a library plaza, and a community garden should not be traded away for a better aggregate score. We wanted to show a form of human–agent collaboration where this lived knowledge does not become a comment after optimization. It changes the search itself.

## What it does

Aftershade is a complete, deterministic co-design lab for one neighborhood heat scenario. A resident sees a spatial street map, protects important places, adds or removes interventions, creates plan branches, simulates outcomes, and reviews a mixed human/agent activity trail.

An external browser agent can discover 11 WebMCP tools to inspect the live scenario, create reversible branches, set constraints, apply atomic intervention bundles, simulate, compare, focus, undo, reset, and mark a valid plan ready for resident review.

The signature interaction is interruption. Every mutation advances a shared revision and every agent write includes the revision it inspected. If a resident protects Library plaza while the agent is planning, the old write is rejected. The agent must re-inspect, see the new constraint and current conflict, then adapt the actual visible plan.

## Why this is a strong WebMCP use case

Without WebMCP, an agent would need brittle visual clicking or a separate integration that can drift away from what the resident sees. Aftershade exposes the semantic operations of the open page while keeping the spatial interface optimized for people. Both parties act on one state, and the product makes revisions, authorship, plan trade-offs, and constraint failures legible.

WebMCP is therefore the product boundary, not a chat feature. Remove it and the independent agent disappears as a first-class co-editor.

## How people and agents work together

- **People** contribute lived priorities, spatial intuition, exceptions, and the final readiness decision.
- **Agents** search combinations, compose atomic changes, run checks, compare branches, and recover after an interruption.
- **Aftershade** holds the shared revisioned world, makes every effect visible, and keeps exploration reversible.

## How we built it

The frontend uses React 19, TypeScript, Tailwind CSS, shadcn primitives, lucide icons, and vinext for a Cloudflare-compatible production build. The app uses a typed external store with local persistence, a 30-step undo history, branches, authorship records, and deterministic simulation.

At the top-level page, a lifecycle hook feature-detects `document.modelContext.registerTool`, registers 11 imperative tools with narrow JSON Schemas and read/write annotations, and unregisters them through an `AbortSignal`. Tool handlers reuse the exact store mutations used by the human UI. Runtime validation protects environments that do not enforce every schema keyword.

The automated contract suite exercises the real tool module against a model-context double. We also executed the core flow through a real browser's discovered WebMCP capability on the public production origin and verified the resulting DOM-visible revisions, metrics, constraint conflict, stale-write rejection, recovery, and valid ready state.

## What we learned

The most useful agent safety mechanism was not another confirmation dialog. It was optimistic concurrency made visible to both parties. A revision number gives human intervention protocol-level force: the agent cannot overwrite a value judgment it has not seen.

We also learned that a good Site tool should return the evidence needed for the next decision. Aftershade's tools return the current revision, active plan, metrics, and explicit violation messages instead of a generic success string.

## What's next

The demo deliberately uses deterministic data so its behavior is transparent. A production version could connect validated heat, canopy, pedestrian, and capital-plan datasets; support multiple resident cohorts; and visualize Pareto frontiers. The interaction model would remain the same: agents explore, people set lived constraints, and every change stays attributable and reversible.

## Required links

- Live app: https://aftershade-webmcp.yukifoo.chatgpt.site
- Source repository: https://github.com/yukifoo/aftershade-webmcp
- Demo video: [ADD PUBLIC YOUTUBE URL]

## Technology tags

WebMCP, OpenAI Site tools, React, TypeScript, vinext, Cloudflare Workers, Tailwind CSS

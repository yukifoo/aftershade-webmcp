# Aftershade

**A shared urban-heat co-design surface for people and agents.**

Aftershade lets residents protect the places and routines a neighborhood cannot lose while a browser agent explores, simulates, and compares street-cooling plans on the exact same map. It was built for the 2026 WebMCP Challenge.

- Live app: https://aftershade-webmcp.yukifoo.chatgpt.site
- Source: https://github.com/yukifoo/aftershade-webmcp
- Judge prompt: _Inspect this neighborhood. Create two plans under $350k that cut exposed route below 35% while protecting the market and garden. Simulate and compare them; do not commit._
- Status: deterministic demo; no account, API key, external data, or paid service required

## Why WebMCP belongs here

Urban adaptation is a search problem and a values problem at the same time. An agent is good at composing interventions, checking constraints, and comparing alternatives. A resident knows why a loading bay, garden, or resting place must not be erased. Aftershade gives both parties first-class controls over one revisioned state.

The page registers 11 imperative WebMCP tools. The agent does not operate a parallel chatbot or hidden copy of the plan: every tool reads or mutates the same store rendered by the human interface. Every write requires `expectedRevision`. If a person changes a constraint while the agent is working, the stale write fails and instructs the agent to inspect again. This makes interruption and adaptation part of the product protocol.

Remove WebMCP and Aftershade becomes a small manual scenario toy. With WebMCP, it becomes a semantic, inspectable co-design surface that an external browser agent can operate without brittle DOM automation.

## The 45-second magic moment

1. An agent inspects the open neighborhood and current resident constraints.
2. It creates two reversible plan branches, places atomic intervention bundles, simulates them, and compares the outcomes.
3. A resident directly protects Library plaza. The plan immediately shows a conflict because a disruptive tree-corridor intervention is there.
4. The agent's in-flight write with the old revision is rejected.
5. The agent re-inspects, removes the conflicting move, substitutes a shade canopy, simulates again, and marks the plan ready for resident review.

The map, metrics, branch cards, revision, and human/agent activity trail all update visibly.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the printed localhost URL. The site remains fully usable in browsers without WebMCP; the Site tools status appears only when `document.modelContext.registerTool` is available.

Build and verify:

```bash
npm run check:webmcp
npm run lint -- app/page.tsx hooks/use-webmcp.ts lib/domain.ts lib/store.ts lib/webmcp.ts scripts/check-webmcp-contract.mjs
npm run build
```

## WebMCP tools

| Tool | Effect |
|---|---|
| `inspect_heat_scenario` | Reads revision, constraints, places, catalog, active plan, metrics, and branches. |
| `create_plan_branch` | Creates a reversible branch from the active or named plan. |
| `set_heat_constraints` | Changes budget, exposure target, or the complete protected-place set. |
| `apply_heat_interventions` | Applies one atomic bundle of one to six interventions. |
| `remove_heat_intervention` | Removes an intervention by its semantic ID. |
| `simulate_heat_plan` | Recomputes deterministic outcomes and constraint checks. |
| `compare_heat_plans` | Reads a compact side-by-side branch comparison. |
| `show_heat_plan` | Brings a branch into the shared visible map. |
| `mark_heat_plan_ready` | Marks a constraint-valid plan ready for resident review. |
| `undo_heat_change` | Restores the prior shared state as a new revision. |
| `reset_aftershade_demo` | Restores the seeded demo after explicit confirmation and a current revision check; the reset remains undoable. |

Tool registration lives in [`lib/webmcp.ts`](lib/webmcp.ts); lifecycle registration and `AbortSignal` cleanup live in [`hooks/use-webmcp.ts`](hooks/use-webmcp.ts).

## Architecture

```text
Human controls ─┐
                ├─> revisioned external store ─> deterministic simulation ─> React map + activity
WebMCP tools ───┘             │
                              └─> localStorage persistence + undo history
```

- `app/page.tsx` — complete human interface and shared map
- `lib/domain.ts` — typed places, interventions, constraints, and deterministic scoring
- `lib/store.ts` — revisioned mutations, persistence, branches, undo, and activity authorship
- `lib/webmcp.ts` — imperative schemas, validation, annotations, and semantic tool handlers
- `scripts/check-webmcp-contract.mjs` — executable mock-browser contract suite
- `SECURITY_REVIEW.md` — lightweight pre-submission threat review and remediation record

No fake model call is shown. The neighborhood and simulation are intentionally deterministic demo data so every judge sees the same auditable result. The complete conflict-and-recovery path has been verified through WebMCP on the public production origin; see [`WEBMCP_TESTS.md`](WEBMCP_TESTS.md).

## Browser setup

- ChatGPT: open the live URL in the built-in browser with a Site tools-capable model.
- Chrome: use Chrome 149 or newer and enable `chrome://flags/#enable-webmcp-testing` if required by that build.
- Ordinary browsers: all human controls still work; WebMCP registration is progressively enhanced.

See [`WEBMCP_TESTS.md`](WEBMCP_TESTS.md) for the verified workflow, [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md) for the release review, and [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for the recording path.

## License

MIT — see [`LICENSE`](LICENSE).

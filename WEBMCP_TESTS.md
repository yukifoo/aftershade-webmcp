# WebMCP verification

Last local verification: 2026-09-04 JST.

## Automated contract suite

Run:

```bash
npm run check:webmcp
```

The suite bundles the real TypeScript tool module and registers it against a small `document.modelContext` contract double. It verifies:

- exactly 11 unique tool registrations;
- discovery metadata and executable handlers;
- valid inspect, branch, atomic bundle, simulation, and comparison calls;
- rejection of invalid typed input without a revision change;
- stale-revision rejection without partial mutation;
- undo advancing to a new revision;
- exact demo reset;
- `AbortSignal` cleanup removing all registered tools.

Expected final line:

```text
WebMCP contract: 11 tools; registration, runtime validation, atomic mutation, protection conflict, stale-write rejection, adaptation, readiness gate, undo, reset, and cleanup passed.
```

## Real browser smoke

The following path was executed through the browser's discovered WebMCP capability, not by calling the store directly:

1. Fetch tools from the page and confirm all 11 are present.
2. Reset to revision 1 and inspect the scenario.
3. Create `Shade First`; add four interventions atomically; simulate.
4. Create `Canopy Network` from `resident-brief`; add five interventions; simulate.
5. Compare all three branches.
6. Use the visible human UI to protect Library plaza. Revision advances from 7 to 8 and the plan exposes a protection conflict.
7. Attempt an agent write with `expectedRevision: 7`. Confirm `STALE_REVISION: expected 7, current 8` and no partial mutation.
8. Re-inspect revision 8, remove the conflicting tree corridor, add a shade canopy, simulate, and mark the plan ready.
9. Confirm the visible final state: revision 12, protected Market/Garden/Library, `$254k`, `15%` exposed route, and no constraint violations.

## Manual negative checks

- `mark_heat_plan_ready` refuses a plan with any live violation.
- Duplicate intervention type/place pairs are rejected atomically.
- Unknown plan, place, intervention type, and intervention ID values are rejected.
- Budget and exposure values must be bounded integers.
- Duplicate protected-place IDs are rejected.
- `reset_aftershade_demo` requires `{ "confirm": true }`.

## Production gate

Repeat the real-browser smoke at the production HTTPS URL after deployment. A passing local build alone is not treated as production WebMCP evidence.

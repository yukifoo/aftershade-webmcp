# WebMCP verification

Last local and production verification: 2026-09-04 JST.

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
- stale-reset rejection plus a monotonic, recoverable reset;
- an eight-plan aggregate branch limit with atomic rejection;
- `AbortSignal` cleanup removing all registered tools.

Expected final line:

```text
WebMCP contract: 11 tools; registration, runtime validation, atomic mutation, protection conflict, stale-write/reset rejection, adaptation, readiness gate, recoverable reset, bounded branches, undo, and cleanup passed.
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
- `reset_aftershade_demo` requires the current `expectedRevision` and `{ "confirm": true }`.
- A scenario accepts at most eight total plan branches; the ninth is rejected without mutation.

## Production gate

Passed on the public HTTPS production origin:

`https://aftershade-webmcp.yukifoo.chatgpt.site`

The production browser discovered all 11 tools from that origin. Starting from an existing browser-local revision 9, the verified run was:

1. Reset with `expectedRevision: 9` to a monotonic revision 10.
2. Create and simulate `Shade First`: `$258k`, `20%` exposed route, score 77, no violations.
3. Create and simulate `Canopy Network`: `$282k`, `18%` exposed route, score 82, no violations.
4. Use the rendered human UI to protect Library plaza, advancing revision 16 to 17 and surfacing the tree-corridor conflict.
5. Attempt a stale WebMCP write with `expectedRevision: 16`; receive `STALE_REVISION: expected 16, current 17`, then confirm no mutation occurred.
6. Re-inspect revision 17, remove the conflicting tree corridor, add a shade canopy, simulate, and mark the plan ready.
7. Confirm the DOM-visible final state at revision 21: protected Market/Garden/Library, `$254k`, `15%` exposed route, 25% canopy, score 78, committed status, and no violations.

This production result is separate from the local contract and browser evidence above.

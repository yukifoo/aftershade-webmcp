# Demo video script — target 2:30

Record the real public site at 1280×720 or larger. Use audible narration, no music, and keep the final upload public on YouTube. Reset immediately before recording.

## 0:00–0:18 — the problem

**Visual:** Open Aftershade at revision 1. Briefly point to the resident brief, protected Market/Garden chips, hot route, and empty plan.

**Narration:** “Cities can optimize heat maps, but residents know what those maps cannot: where deliveries must happen, where older neighbors rest, and what a redesign must not erase. Aftershade puts that lived judgment and an agent's search ability on the same street.”

## 0:18–0:35 — why WebMCP

**Visual:** Show the Site tools list, then the judge prompt already printed in the app.

**Narration:** “This page exposes eleven imperative WebMCP tools. They are not a chatbot wrapper. The agent reads and changes the exact revisioned state I see, using semantic places and interventions instead of clicking pixels.”

## 0:35–1:12 — agent exploration

**Action:** Ask the agent: “Inspect this neighborhood. Create two plans under $350k that cut exposed route below 35% while protecting the market and garden. Simulate and compare them; do not commit.”

**Visual:** Keep the app visible while branches, map glyphs, metrics, and agent activity appear. End with `Shade First` and `Canopy Network` visible.

**Narration:** “The agent inspects the live brief, creates reversible branches, places each intervention bundle atomically, and runs the deterministic simulation. Both plans satisfy the brief, but their cost, canopy, comfort stops, and exposure differ.”

## 1:12–1:48 — human interruption

**Action:** Select Library plaza and click **Protect** while the agent still holds revision 7. Then invoke any write with `expectedRevision: 7`.

**Visual:** Revision becomes 8; the plan shows one tension; the stale write error says to re-inspect.

**Narration:** “Now I add what only a resident may know: the library plaza is a protected resting place. The existing tree corridor conflicts. More importantly, the old agent write is rejected. It cannot silently overwrite my decision.”

## 1:48–2:15 — adaptation

**Action:** Have the agent inspect again, remove the tree corridor at Library, add a shade canopy, simulate, and mark ready for resident review.

**Visual:** End on revision 12, `$254k`, `15%` exposed route, score `78`, three protected chips, and the mixed human/agent activity trail.

**Narration:** “After re-inspecting, the agent understands the new constraint, replaces the disruptive move, simulates again, and marks the branch ready. The person keeps authority; the agent keeps momentum; the page preserves authorship and evidence.”

## 2:15–2:30 — close

**Visual:** Slowly frame the complete three-column app.

**Narration:** “Aftershade is a small but complete example of a new WebMCP primitive: a negotiable simulation surface where people and agents can interrupt, adapt, and build a future together.”

## Reset and recording checklist

- Call `reset_aftershade_demo` with `{ "confirm": true }`.
- Confirm revision 1, one branch, zero interventions, and two protected places.
- Close notifications, hide bookmarks, and use a clean browser profile.
- Record one continuous product path; do not depict calls that were not executed.
- Confirm exported duration is under 3:00 and narration is audible.
- Upload to YouTube as **Public**, then verify in a signed-out window.

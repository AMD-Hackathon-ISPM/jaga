# Hackathon Plan Template & Depth Benchmark

> Reverse-engineered from the **ConsumerIQ** Notion plan (team Singkong — finalist + won Featherless.ai track at the BrightData hackathon). That plan is our benchmark for *how detailed a winning plan should be*. Use this as the skeleton + the depth bar for every project plan.
>
> **Golden rule observed in ConsumerIQ:** every claim is backed by a real number; every section ends in a *decision* or *action*, not just description. Depth ≈ a VC-grade brief, not a hackathon sketch.

---

## 0. Hackathon Analysis (do this FIRST, before the idea)
**Purpose:** understand what the sponsor/judges actually reward, then reverse-engineer toward it.
Include:
- **Sponsor's real motivation** — why are they running this? (GTM, showcase their product, recruit startups). Their motive = what wins.
- **What to maximize per judging criterion** — go criterion by criterion with a concrete tactic for each. (e.g. "Application of Technology → don't just call 1 endpoint; integrate ≥4 products and explain *why* each.")
- **Strategic insight** — which track/angle is most winnable for *our* team and why.
- **N-Day execution plan** — day-by-day, with per-person split. Note the *real* deadline (timezone!) and effective days.
- **Risks & mitigations** — list each risk + concrete mitigation.

## 1. Strategic Positioning
**Purpose:** lock the big framing calls before building.
Include: target-user decision (B2B vs B2C, SMB vs enterprise) **with reasoning tied to the judges/prize**; track fit; any other fork that shapes everything downstream. End with a firm recommendation.

## 2. The Idea — One-Sentence Definition
A single bolded sentence (quote block) that says what it does, for whom, and the outcome. Must be memorizable.

## 3. Problem Statement (the heart — go deep)
**Purpose:** prove the problem is real, urgent, and quantified. This is where ConsumerIQ was strongest.
Include all of:
- **One-sentence problem statement** (bold quote).
- **Problem Statement Worksheet (table)** — these exact rows:
  - Problem Statement (full)
  - Who is affected (+ size of population)
  - Where (geographic)
  - When does it occur (the specific decision moments)
  - Why it persists
  - Impact (quantified — $ and time)
  - Why now (the 2-3 forces that just converged)
  - Boundary (explicitly OUT of scope — name the tools/territories we are NOT)
  - Hypothesis (our bet, quantified: "from weeks→minutes, at 1/50th cost")
- **Factual data to back it** — bucketed: Magnitude of problem / Root cause / Cost of not solving. **Every stat cited with a real source.** ("numbers you must memorize for the pitch")
- **5 Whys** — root-cause drill-down; the reversed arrow = the sales narrative.
- **Personas** — 3 archetypes, each with: stage, background, budget, a verbatim frustration quote, current workaround, willingness to pay.
- **Key differences vs the alternative idea** we considered (for clarity).

## 4. Why It Matters — 5 Dimensions
Make the stakes undeniable from five angles:
1. Human cost
2. Global / equity issue
3. Business opportunity (TAM/SAM)
4. Technical significance
5. Hackathon-specific edge (why it wins *this* event)

## 5. Pitch Assets
- **3 core pitch messages** (the lines that must land).
- **Team meeting material** — idea-vs-idea comparison so the team aligns.
- **Risks the team must consider** before committing.

## 6. Solution Deep Dive
**Purpose:** turn the idea into a concrete product.
Include:
- **One-sentence solution statement.**
- **N pillars of the solution** — each pillar named + what it does + why it matters.
- **The unifying layer** (the thing that ties pillars together; for ConsumerIQ = Founder Chat / MCP).
- **What the user sees on the dashboard** (concrete UI sections).
- **User journey end-to-end** (step by step).
- **Pricing tier design.**
- **Defensible moats** (≥3) — why this is hard to copy.
- **What's next.**

## 7. Technical Architecture
**Purpose:** prove it's buildable and impressive (this scored 5/5 for ConsumerIQ).
Include:
- **Design philosophy** (1-2 principles).
- **Layered architecture overview** (ConsumerIQ used 5 layers).
- **Each layer detailed** — components, the specific tools/models, and short code/pseudo-code snippets showing the real flow.
- **Final tech stack** (table).
- **Cost analysis** (per-query / per-user economics).
- **Team assignment** for the build (who owns what).
- **Technical risks & mitigations.**
- **Architecture's demo strengths** (which parts will look good on camera).

## 8. Industry / Vertical Selection
**Purpose:** pick the wedge market with reasoning.
Include: ranked list of candidate industries each with a why; explicit "why NOT [excluded option]"; the single best vertical to start; the strongest angle; a final recommendation.

---

### Depth checklist (the ConsumerIQ bar)
- [ ] Every problem claim has a real, cited statistic.
- [ ] Quantified impact in both $ and time.
- [ ] At least 3 personas with verbatim quotes + willingness-to-pay.
- [ ] "Why now" names the specific converging forces.
- [ ] Scope boundary explicitly names what we are NOT.
- [ ] Architecture is layered, with code snippets and named tools/models.
- [ ] Per-query cost economics included.
- [ ] Day-by-day execution plan with per-person ownership.
- [ ] Every section ends in a decision/action, not just description.
- [ ] AMD-specific (for Act II): GPU/ROCm usage is foregrounded and load-bearing.


# Case Study Writing Guide

Reference document for writing case studies in `src/content/works/`. Not a content file — excluded from the works collection by naming convention (no numeric prefix, UPPERCASE name).

**Update 2026-04-04:** This guide won't be picked up by the collection loader because it lacks required frontmatter fields (`company`, `duration`). But to be safe, if it ever causes build issues, move it to the project root or `.claude/`.

---

## The Philosophy

Every case study follows one principle: **show the thinking, not the outcomes.**

Inspired by Adrian Zumbrunnen's case studies at Apple — where design philosophy and systems come first, and internal data never appears. The goal is to demonstrate *how you think about design*, not to prove ROI.

### Direction Over Pressure

This phrase from the FV3 case study captures the approach:

> In games with deep feature sets, there's a temptation to push players toward engagement through urgency. We took a different approach: make the journey visible.

Apply this to how you write the case study itself. Don't pressure the reader with metrics and impact claims. Give them direction — show them how you think, what you value, how you make decisions. If the thinking is good, the reader will infer the impact.

---

## NDA Rules

### Never Include

- Retention rates, conversion metrics, revenue figures, or any quantitative business outcomes
- Internal user research findings, survey data, or usability test results
- Screenshots of internal tools, dashboards, or analytics platforms
- Specific A/B test results or experiment configurations
- Unreleased feature designs or future roadmap items
- Internal communication, Slack messages, or meeting notes
- Player counts, DAU/MAU, session length, or engagement benchmarks

### Safe to Include

- Your role and the disciplines you collaborated with
- Design philosophy and principles that guided the work
- Publicly visible UI (anything a player can see in the shipped game)
- General design patterns and frameworks (progressive disclosure, goal gradient, etc.)
- Trade-offs you weighed and how you resolved them — framed as design decisions, not data insights
- Reflections on what you learned
- Team acknowledgments

### The Test

Before publishing any sentence, ask: *Could this sentence only have been written by someone with access to internal data?* If yes, rewrite it. Frame it as a design philosophy or general observation instead.

**Bad:** "Post-milestone D1 retention improved by 12% after shipping the progression system."
**Good:** "The system was designed so players could always see where the game goes next — not just what they'd completed."

**Bad:** "User research showed that 68% of churned players cited confusion about next steps."
**Good:** "The question wasnt motivation — it was direction. Players who leave after a milestone arent bored. They just dont know where the game goes from here."

---

## Content Arc

Every case study follows this sequence. Not every section is required — adapt to fit the story. But the arc matters: it should feel like a tour of your thinking, not a timeline of events.

### 1. ProjectOverview (quick-scan metadata)

Three columns: ROLE, COLLABORATION, SCOPE. Keep it scannable.

- ROLE: your title
- COLLABORATION: list the disciplines, not individual names
- SCOPE: 3-4 bullet points describing what you owned

### 2. Context (what, not why)

Set the scene. What is the product? When did you join? What was the state of the project?

**Do:** Describe the product and your relationship to it.
**Don't:** Frame a "problem" that needs solving. This isn't a problem→solution story.

> "Farmville 3 is a farming simulation game — the third in a franchise that helped define the casual mobile genre. I joined the team during softlaunch and stayed through full launch and into live operations."

### 3. Design Approach (your philosophy)

This is the heart of the case study. Name the design principle that guided your work. Explain why you believe in it. Show how it shaped decisions.

- Lead with the principle as an italicised phrase or bold statement
- Explain the *alternative* approach you chose not to take and why
- Use a `Callout type="insight"` for the core belief

> "The principle that guided most of my work on FV3 was a simple one: *direction over pressure.*"

### 4. Systems Deep Dive (2-3 sections)

Walk through the specific systems you designed. Each system gets its own `WorkSection` followed by a `WorkImageGrid` showing the shipped work.

Structure each system section as:
- What the system does (one paragraph)
- How it adapts or responds to context (one paragraph)
- A trade-off or design tension you navigated (one paragraph)

Use `SideNote` for theoretical references (goal gradient, Zeigarnik effect, etc.) — these show depth without revealing internal data.

### 5. Working Together (collaboration, not ownership)

One section. Describe *what each discipline contributed*, not just that you "collaborated." Show you understand where design ends and other expertise begins.

> "Game designers owned the system logic and content curves. I worked with them on the information hierarchy."

### 6. Closing Reflection (what you learned)

Use `WorkClosingText`. This is personal. What did this project teach you about design? Not a summary of the case study — a genuine takeaway.

End with a team acknowledgment: "Special thanks to [team] at [company] for..."

---

## Tone and Voice

### Use "We"

Default to "we" for all design and shipping decisions. Use "I" only for:
- Describing your specific role ("I joined during softlaunch")
- Personal reflections ("This project taught me...")
- Claiming a specific contribution ("I worked with them on the information hierarchy")

### Be Honest About Constraints

Frame limitations as intentional design decisions, not compromises.

**Bad:** "We couldn't build the dynamic nudge system due to engineering constraints."
**Good:** "Some of the more dynamic ideas would have been expensive to build. We scoped down to what was feasible without losing the core intent."

### No Corporate Language

Avoid: "leveraged," "synergized," "stakeholders," "deliverables," "drove impact," "key learnings," "best practices," "north star metric"

Use: plain language. Short sentences. Contractions. Thinking out loud.

### Sentence Rhythm

Vary deliberately. Short declarative. Medium working sentence. Then a longer one when the thought needs room. See the writing style guide for the full reference.

---

## Component Usage

### Always Use

| Component | When |
|-----------|------|
| `ProjectOverview` | First thing after frontmatter. Role, collaboration, scope. |
| `WorkSection` | Every major content section. Provides the 1/4 + 3/4 grid layout. |
| `WorkImageGrid` | After system sections. 2-column grid of shipped UI. |
| `Image` | Inside WorkImageGrid. Always include `title` and `description`. |
| `WorkClosingText` | Final reflection. One per case study. |

### Use When Appropriate

| Component | When |
|-----------|------|
| `Callout type="insight"` | For your core design belief or a key principle. Max 2 per case study. |
| `SideNote` | For theoretical references, psychological principles, or brief asides. |
| `VideoBreakout` | If a public trailer or demo video exists. |
| `AppStoreBadge` / `GooglePlayBadge` | If the app is publicly available. |

### Avoid in NDA-Sensitive Work

| Component | Why |
|-----------|-----|
| `MetricsRow` | Implies specific quantitative outcomes. |
| `BeforeAfter` | Implies showing internal "before" states that may not be public. |
| `AnnotatedImage` | Numbered callouts on internal wireframes or unreleased designs. |
| `ProcessTimeline` | Can imply a documented internal process. Use only for generic frameworks. |
| `Callout type="metric"` | Explicitly designed for numbers — skip it. |
| `Callout type="question"` | Can imply a specific research question was formally investigated. |

These components exist and are available for projects where NDA allows more detail (side projects, portfolio site case study, design analyses of public products).

---

## Frontmatter Guide

```yaml
title: "Product Name"              # The product, not the narrative hook
description: "..."                 # One sentence: what you did, framed as craft
pubDate: "YYYY-MM-DD"
company: "Company Name"
duration: "Month Year - Month Year"
role: "Your Title"
location: "City"
featured: true                     # Show on homepage
heroImage: "/works/project/hero.jpg"
phoneImage: "/works/project/phone.png"  # Optional phone mockup overlay
narrativeTitle: "The Narrative Hook"    # Philosophy-driven, not problem-driven
publish: true
```

### Writing the `description`

Frame it as what you did, not what was broken.

**Bad:** "Players were churning after milestones. I designed systems to fix retention."
**Good:** "Joined during softlaunch and carried the UX through full launch and into live operations — shaping player-facing systems across progression, engagement, and contextual guidance."

### Writing the `narrativeTitle`

This appears below the h1 on the case study page. It should name a design philosophy or approach, not a problem.

**Bad:** "Fixing Post-Milestone Drop-offs"
**Good:** "Designing Systems That Give Players Direction"

---

## Image Descriptions

Every `Image` inside `WorkImageGrid` needs a `title` and `description`. These appear in the lightbox.

- `title`: Short label (2-4 words) naming the system or pattern
- `description`: One sentence explaining the design intent — what the system does and *why* it's designed that way
- `alt`: Describe what's visually in the image for accessibility

**Example:**
```jsx
<Image
  src="/works/fv3/fv3Progression1.jpg"
  alt="Progression and motivation systems in Farmville 3"
  title="Progression Systems"
  description="Layered progression and motivation systems designed to adapt to different player lifecycles — surfacing the right level of detail depending on where someone is in the game."
/>
```

---

## Anti-Patterns

| Pattern | Why It's Wrong | Instead |
|---------|---------------|---------|
| Problem → Solution → Impact | Reads like a consulting deliverable. Implies access to data. | Context → Philosophy → Systems → Reflection |
| "The problem was..." | Frames the work as reactive, not principled. | "The principle that guided the work was..." |
| Specific metrics | NDA risk. Also makes the case study about proof, not craft. | Describe the design intent. Let the reader infer quality from the thinking. |
| "I led..." / "I drove..." | Sounds like a performance review. | "We designed..." / "I worked with [discipline] on..." |
| Listing every feature | Turns the case study into documentation. | Pick 2-3 systems that best represent your thinking. |
| Generic collaboration section | "Worked with cross-functional teams" says nothing. | Name what each discipline contributed specifically. |
| Inspirational closing | "And that's why great design matters!" — no. | End with a genuine personal takeaway. Quiet, specific. |

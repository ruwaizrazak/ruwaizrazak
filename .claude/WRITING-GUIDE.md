
# Case Study Writing Guide

Reference document for writing case studies in `src/content/works/`. Not a content file — lives in `.claude/` to avoid collection loader issues.

---

## The Philosophy

Every case study follows one principle: **show the thinking, not the outcomes.**

Inspired by Adrian Zumbrunnen's case studies — where design philosophy and systems come first, and internal data never appears. The goal is to demonstrate *how you think about design*, not to prove ROI.

### Direction Over Pressure

This phrase from the FV3 case study captures the approach:

> In games with deep feature sets, there's a temptation to push players toward engagement through urgency. We took a different approach: make the journey visible.

Apply this to how you write the case study itself. Don't pressure the reader with metrics and impact claims. Give them direction — show them how you think, what you value, how you make decisions. If the thinking is good, the reader will infer the impact.

---

## No Duplicate Text

This is a hard rule. No sentence, phrase, title, or description should appear more than once in a case study.

This applies across:
- `WorkSection` titles and body text
- `Image` titles, descriptions, and alt text
- `Callout` content
- Any other visible text

**Common violation:** using the same phrase as both a `WorkSection` title and an `Image` title (e.g. "Contextual Guidance" appearing as a section heading *and* an image label). One must be renamed.

**Self-check before publishing:** search the draft for any phrase that appears twice. If found, rewrite one instance. Repeated text signals the writer ran out of things to say. Each occurrence should carry distinct information.

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

Four sections. Not every one is required — adapt to fit the story. But the arc matters: it should feel like a tour of your thinking, not a timeline of events.

### 1. Context (untitled WorkSection)

Set the scene. What is the product? When did you join? What was the state of the project?

`WorkSection` with no `title` prop. 1-2 paragraphs. Optional app store badges inside. Followed by `VideoBreakout` if a public trailer exists.

**Do:** Describe the product and your relationship to it.
**Dont:** Frame a "problem" that needs solving. This isnt a problem-then-solution story.

> "Farmville 3 is a farming simulation game — the third in a franchise that helped define the casual mobile genre. I joined the team during softlaunch and stayed through full launch and into live operations."

### 2. Design Approach (optional)

Name the design principle that guided your work. Explain why you believe in it. Show how it shaped decisions.

`WorkSection title="Design Approach"` containing a `Callout type="insight"` for the core belief. Lead with the principle as an italicised phrase. Explain the *alternative* approach you chose not to take and why.

Not every case study needs this — Deer Hunter skips it. Include when the project had a clear guiding principle worth articulating.

> "The principle that guided most of my work on FV3 was a simple one: *direction over pressure.*"

### 3. Systems (2-3 sections — the core of the case study)

Walk through the specific systems you designed. Each system gets its own titled `WorkSection` followed by a `WorkImageGrid`.

Structure each system section as:
- What the system does (one paragraph)
- How it adapts or responds to context (one paragraph)
- A trade-off or design tension you navigated (one paragraph)

Use `Callout type="question"` to surface a design question you worked through. Use `SideNote` for theoretical references (goal gradient, Zeigarnik effect, etc.).

Pick 2-3 systems that best represent your thinking. This isnt documentation — its a curated tour.

### 4. Closing (WorkSection)

Either collaboration details or a brief closing perspective. Not a summary, not a personal reflection essay.

`WorkSection` with or without a title. 1-2 short paragraphs. Describe *what each discipline contributed*, not just that you "collaborated."

Some case studies end naturally after their last system section. Thats fine. A closing section isnt mandatory if the systems sections already land the story.

> "Game designers owned the system logic and content curves. I worked with them on the information hierarchy, interaction pattern, what gets surfaced, where, and at what priority."

---

## Tone and Voice

### Use "We"

Default to "we" for all design and shipping decisions. Use "I" only for:
- Describing your specific role ("I joined during softlaunch")
- Personal reflections ("This project taught me...")
- Claiming a specific contribution ("I worked with them on the information hierarchy")

### Be Honest About Constraints

Frame limitations as intentional design decisions, not compromises.

**Bad:** "We couldnt build the dynamic nudge system due to engineering constraints."
**Good:** "Some of the more dynamic ideas would have been expensive to build. We scoped down to what was feasible without losing the core intent."

### No Corporate Language

Avoid: "leveraged," "synergized," "stakeholders," "deliverables," "drove impact," "key learnings," "best practices," "north star metric"

Use: plain language. Short sentences. Contractions. Thinking out loud.

### Sentence Rhythm

Vary deliberately. Short declarative. Medium working sentence. Then a longer one when the thought needs room.

---

## Components

Two tiers. Keep imports minimal — only import what you use.

### Core (every case study uses these)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `WorkSection` | Section wrapper. Provides the centered layout and typography. | `title` (optional) — omit for context and closing sections |
| `WorkImageGrid` | 2-column responsive grid. Place after system sections. | None — wraps `Image` components via slot |
| `Image` | Optimized image with lightbox, zoom, and pan. Always inside `WorkImageGrid`. | `src`, `alt`, `title`, `description`, `loading` (optional, defaults to lazy) |

### Supporting (use when the content calls for it)

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `VideoBreakout` | Full-width YouTube embed | After the context section, if a public trailer exists |
| `Callout` | Inline highlight. `type="insight"` for core beliefs, `type="question"` for design questions you worked through | Max 2 per case study. Dont overuse |
| `SideNote` | Floating sidebar for theoretical references or brief asides | When referencing design theory without breaking the flow |
| `AppStoreBadge` / `GooglePlayBadge` | App store links | Inside the context WorkSection, if the app is publicly available |

---

## Frontmatter

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
narrativeTitle: "The Narrative Hook"    # Optional. Philosophy-driven, not problem-driven
appStoreUrl: "..."                 # Optional. iOS App Store link
playStoreUrl: "..."                # Optional. Google Play link
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
- `description`: One sentence explaining the design intent — what the system does and *why* its designed that way
- `alt`: Describe whats visually in the image for accessibility

Titles and descriptions must not repeat text from the surrounding `WorkSection`. See the No Duplicate Text rule.

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

| Pattern | Why Its Wrong | Instead |
|---------|--------------|---------|
| Problem → Solution → Impact | Reads like a consulting deliverable. Implies access to data. | Context → Philosophy → Systems → Closing |
| "The problem was..." | Frames the work as reactive, not principled. | "The principle that guided the work was..." |
| Specific metrics | NDA risk. Makes the case study about proof, not craft. | Describe the design intent. Let the reader infer quality from the thinking. |
| "I led..." / "I drove..." | Sounds like a performance review. | "We designed..." / "I worked with [discipline] on..." |
| Listing every feature | Turns the case study into documentation. | Pick 2-3 systems that best represent your thinking. |
| Generic collaboration section | "Worked with cross-functional teams" says nothing. | Name what each discipline contributed specifically. |
| Inspirational closing | "And thats why great design matters!" — no. | End with a brief collaboration note or let the last system section be the ending. |
| Repeated text | Signals the writer ran out of things to say. | Every title, description, and sentence carries distinct information. |

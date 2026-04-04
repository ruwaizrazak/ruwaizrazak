# Google Analytics Custom Events

GA4 Property: `G-75GYY3Y3H3`

All custom events are defined in `src/scripts/analytics.ts`.

## Events

### `contact_click`

Fires when a user clicks a contact link (LinkedIn, email, resume, GitHub) in the navigation or footer.

| Parameter  | Type   | Values                                  |
|------------|--------|-----------------------------------------|
| `method`   | string | `linkedin`, `email`, `resume`, `github` |
| `location` | string | `nav`, `footer`                         |

**Wired in:** `src/components/Footer.astro` (all pages)

**Triggered by:** Any element with a `data-contact` attribute. Added to:
- Navigation desktop dropdown (`src/components/Navigation.astro`, lines 106-141)
- Navigation mobile sidebar (`src/components/Navigation.astro`, lines 288-315)
- Footer social links (`src/components/Footer.astro`, conditional on `link.label`)

---

### `work_view`

Fires once when a user lands on a work case study page (`/works/*`).

| Parameter | Type   | Values              |
|-----------|--------|---------------------|
| `title`   | string | Page title          |
| `path`    | string | e.g. `/works/01Farmville3` |

**Wired in:** `src/layouts/WorkLayout.astro`

---

### `scroll_depth`

Fires as the reader scrolls through an article. Thresholds depend on the collection type:
- **Essays:** 25%, 50%, 75%
- **Notes:** 50% only

Each threshold fires only once per page load.

| Parameter    | Type   | Values                |
|--------------|--------|-----------------------|
| `depth`      | string | `25`, `50`, `75`      |
| `collection` | string | `essays`, `notes`     |
| `title`      | string | Page title            |

**Wired in:** `src/layouts/notesPost.astro`

**Requires:** `data-collection` attribute on `<main>` (set by the layout) and an `<article>` element in the page content.

---

## Automatic Events (GA4 built-in)

These are tracked automatically by GA4 with no custom code:

- `page_view` — every page navigation
- `session_start` — new session begins
- `first_visit` — first-time visitor
- `scroll` — 90% scroll depth (GA4 enhanced measurement)

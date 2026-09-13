# ImageLightbox v2 — architecture

## Resolver and island

`Image.astro` owns Astro-only image resolution and optimization, then passes serializable image data, metadata, and the full-size source to `ImageLightbox.svelte`. The Svelte island owns thumbnail rendering and every interactive overlay state. This boundary stays unchanged.

## Portal

The overlay uses the `portal` action to move itself beneath `<body>`. This keeps `position: fixed` relative to the viewport even when article ancestors are transformed, and lets Svelte remove the portal node when the island is destroyed.

## WorkImageGrid coupling

`WorkImageGrid.svelte` detects a single `astro-island` child. Astro renders that island with `display: contents`, so the lightbox thumbnail must remain a direct `<picture>` or `<img>` without an additional wrapper to preserve grid-item sizing.

## Pointer state machine

The island stores active pointer coordinates in a map. The first pointer establishes a pan anchor when zoomed. The second establishes a pinch anchor containing start distance, zoom, midpoint, and pan. Pointer moves derive either pan deltas or continuous pinch scale and midpoint deltas. Pointer release removes capture and, on a two-to-one transition, establishes a fresh pan anchor from the surviving pointer. The final release clears the gesture state and restores the transform transition.

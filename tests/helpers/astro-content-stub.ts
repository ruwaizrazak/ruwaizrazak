/**
 * Stand-in for Astro's virtual `astro:content` module.
 *
 * vitest.config.ts aliases `astro:content` to this file, so utils that call
 * getCollection() can be unit-tested against fixture entries instead of the
 * real content directory. Tests import __setCollections directly — Vite resolves
 * the alias and this path to the same module instance, so they share state.
 */

export interface StubEntry {
  id: string;
  collection?: string;
  data: Record<string, unknown>;
}

let store: Record<string, StubEntry[]> = {};

/** Seed the fake content store. Call in beforeEach. */
export function __setCollections(next: Record<string, StubEntry[]>): void {
  store = next;
}

export function __reset(): void {
  store = {};
}

/** Matches Astro's getCollection(name, filter?) signature closely enough. */
export async function getCollection(
  name: string,
  filter?: (entry: StubEntry) => boolean,
): Promise<StubEntry[]> {
  const entries = (store[name] ?? []).map((e) => ({ ...e, collection: name }));
  return filter ? entries.filter(filter) : entries;
}

/** Present so imports don't explode; unit tests never render content. */
export async function render(): Promise<never> {
  throw new Error('astro-content-stub: render() is not implemented');
}

/** Type-only export mirrored from astro:content so `import type` sites resolve. */
export type CollectionEntry<_T = unknown> = StubEntry;

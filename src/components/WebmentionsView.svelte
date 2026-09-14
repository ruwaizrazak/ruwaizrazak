<script lang="ts">
  import type { WebMention } from '../types';

  /**
   * Presentation + interaction half of Webmentions.
   *
   * LEARN: Webmentions.astro keeps the build-time work — reading the cached JSON,
   * matching the post URL, applying the ~180-domain spam blocklist and deduping
   * likes. None of that can run in Svelte (it imports JSON at build time and must
   * never ship to the browser), so this component receives the finished arrays.
   *
   * LEARN: this replaces scripts/webmentionsToggle.ts, which queried
   * `.wm-show-more`, walked up to `.wm-mentions-section`, re-queried `.wm-reply`,
   * toggled a `.wm-hidden` class by index, and rewrote the button's textContent
   * by hand — all guarded by `btn.dataset.bound` because initOnLoad double-fired.
   * It is one boolean here.
   */
  interface Props {
    likes: WebMention[];
    uniqueLikes: WebMention[];
    mentions: WebMention[];
  }

  let { likes, uniqueLikes, mentions }: Props = $props();

  const VISIBLE = 4;
  let expanded = $state(false);

  const hidden = $derived(Math.max(0, mentions.length - VISIBLE));

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatContent(content: string) {
    const cleaned = content.replace(/ruwaizrazak\.com.*/g, '');
    return cleaned.length > 280 ? cleaned.slice(0, 280) + '\u2026' : cleaned;
  }

  function mentionType(m: WebMention) {
    if (m['wm-property'] === 'in-reply-to') return 'replied';
    if (m['wm-property'] === 'mention-of') return 'mentioned';
    return '';
  }

  const plural = $derived(likes.length !== 1 ? 's' : '');
</script>

<div class="mx-auto mt-12 max-w-[65ch] px-6">
  <div class="overflow-hidden rounded-xl border border-card-border bg-cardbg">
    <h3 class="m-0 px-6 pt-5 pb-3 font-sans text-[1rem] font-light text-syoro">Mentions around the web</h3>

    {#if likes.length > 0}
      <div class="border-b border-b-card-border px-6 pb-5">
        <div class="flex flex-wrap items-center">
          {#each uniqueLikes.slice(0, 20) as like (like.url)}
            <div class="z-[1] -ml-2.5 first:ml-0">
              {#if like.author.photo}
                <img src={like.author.photo} alt={like.author.name} loading="lazy" class="block size-9 rounded-[50%] border-2 border-cardbg object-cover" />
              {:else}
                <svg class="block size-9 rounded-[50%] border-2 border-cardbg object-cover" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="var(--color-konpeki)" opacity="0.3" />
                </svg>
              {/if}
            </div>
          {/each}
          <span class="wm-likes-count ml-3 font-sans text-[0.8125rem] text-syoro opacity-70"
            >{likes.length} Like{plural} &amp; Repost{plural}</span
          >
        </div>
      </div>
    {/if}

    {#if mentions.length > 0}
      <div class="wm-mentions-section">
        <div class="flex flex-col">
          {#each mentions as m, index (m.url)}
            <div
              class={[
                'wm-reply flex items-start gap-3 px-6 py-4',
                { 'border-t border-t-card-border': index > 0 },
                // `wm-hidden` carries no styles now but the e2e suite selects on
                // `.wm-reply:not(.wm-hidden)`, so it stays as a hook beside `hidden`.
                { 'wm-hidden hidden': !expanded && index >= VISIBLE },
              ]}
            >
              {#if m.author.photo}
                <img src={m.author.photo} alt={m.author.name} class="size-10 shrink-0 rounded-[50%] object-cover" loading="lazy" />
              {:else}
                <svg class="size-10 shrink-0 rounded-[50%] object-cover" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="var(--color-konpeki)" opacity="0.3" />
                </svg>
              {/if}
              <div class="flex min-w-0 flex-col gap-1">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wm-reply-meta group/meta flex flex-wrap items-baseline gap-[0.4rem] text-syoro no-underline"
                >
                  <span
                    class="font-sans text-[0.875rem] font-semibold text-konpeki transition-[color] duration-150 ease-[ease] group-hover/meta:text-link"
                  >{m.author.name || m.url.split('/')[2]}</span>
                  <span class="font-sans text-[0.75rem] text-syoro opacity-50">{mentionType(m)}</span>
                  <time class="font-sans text-[0.75rem] text-syoro opacity-50">{formatDate(m['wm-received'])}</time>
                </a>
                {#if m.content?.text}
                  <p class="m-0 font-serif text-[0.9375rem] leading-[1.6] text-syoro opacity-90">{formatContent(m.content.text)}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        {#if mentions.length > VISIBLE}
          <button
            class="wm-show-more block w-full cursor-pointer border-0 border-t border-t-card-border bg-transparent p-4 font-sans text-[0.8125rem] text-syoro opacity-60 transition-[opacity,background] duration-150 ease-[ease] hover:bg-card-border hover:opacity-100"
            data-total={mentions.length}
            onclick={() => (expanded = !expanded)}
          >
            {expanded ? 'Show less' : `Show ${hidden} more`}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

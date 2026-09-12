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

<div class="wm-outer">
  <div class="wm-container">
    <h3 class="wm-title">Mentions around the web</h3>

    {#if likes.length > 0}
      <div class="wm-likes-section">
        <div class="wm-avatar-row">
          {#each uniqueLikes.slice(0, 20) as like (like.url)}
            <div class="wm-avatar-slot">
              {#if like.author.photo}
                <img src={like.author.photo} alt={like.author.name} loading="lazy" />
              {:else}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="var(--color-konpeki)" opacity="0.3" />
                </svg>
              {/if}
            </div>
          {/each}
          <span class="wm-likes-count"
            >{likes.length} Like{plural} &amp; Repost{plural}</span
          >
        </div>
      </div>
    {/if}

    {#if mentions.length > 0}
      <div class="wm-mentions-section">
        <div class="wm-mentions-list">
          {#each mentions as m, index (m.url)}
            <div class={['wm-reply', { 'wm-hidden': !expanded && index >= VISIBLE }]}>
              {#if m.author.photo}
                <img src={m.author.photo} alt={m.author.name} class="wm-reply-avatar" loading="lazy" />
              {:else}
                <svg class="wm-reply-avatar" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="var(--color-konpeki)" opacity="0.3" />
                </svg>
              {/if}
              <div class="wm-reply-body">
                <a href={m.url} target="_blank" rel="noopener noreferrer" class="wm-reply-meta">
                  <span class="wm-reply-author">{m.author.name || m.url.split('/')[2]}</span>
                  <span class="wm-reply-type">{mentionType(m)}</span>
                  <time class="wm-reply-date">{formatDate(m['wm-received'])}</time>
                </a>
                {#if m.content?.text}
                  <p class="wm-reply-content">{formatContent(m.content.text)}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        {#if mentions.length > VISIBLE}
          <button
            class="wm-show-more"
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

<style>
  .wm-outer {
    max-width: 65ch;
    margin: 3rem auto 0;
    padding: 0 1.5rem;
  }

  .wm-container {
    border: 1px solid var(--color-card-border);
    border-radius: 0.75rem;
    background: var(--color-cardbg);
    overflow: hidden;
  }

  .wm-title {
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 300;
    color: var(--color-syoro);
    margin: 0;
    padding: 1.25rem 1.5rem 0.75rem;
  }

  /* Likes avatar row */
  .wm-likes-section {
    padding: 0 1.5rem 1.25rem;
    border-bottom: 1px solid var(--color-card-border);
  }

  .wm-avatar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .wm-avatar-slot {
    margin-left: -10px;
    z-index: 1;
  }

  .wm-avatar-slot:first-child {
    margin-left: 0;
  }

  .wm-avatar-slot img,
  .wm-avatar-slot svg {
    display: block;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--color-cardbg);
    object-fit: cover;
  }

  .wm-likes-count {
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    color: var(--color-syoro);
    opacity: 0.7;
    margin-left: 0.75rem;
  }

  /* Replies / mentions */
  .wm-mentions-list {
    display: flex;
    flex-direction: column;
  }

  .wm-reply {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
  }

  .wm-reply + .wm-reply {
    border-top: 1px solid var(--color-card-border);
  }

  .wm-hidden {
    display: none;
  }

  .wm-reply-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .wm-reply-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .wm-reply-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem;
    text-decoration: none;
    color: var(--color-syoro);
  }

  .wm-reply-meta:hover .wm-reply-author {
    color: var(--color-link);
  }

  .wm-reply-author {
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-konpeki);
    transition: color 0.15s;
  }

  .wm-reply-type {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    color: var(--color-syoro);
    opacity: 0.5;
  }

  .wm-reply-date {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    color: var(--color-syoro);
    opacity: 0.5;
  }

  .wm-reply-content {
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-syoro);
    opacity: 0.9;
    margin: 0;
  }

  /* Show more button */
  .wm-show-more {
    display: block;
    width: 100%;
    padding: 1rem;
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    color: var(--color-syoro);
    opacity: 0.6;
    background: transparent;
    border: none;
    border-top: 1px solid var(--color-card-border);
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s;
  }

  .wm-show-more:hover {
    opacity: 1;
    background: var(--color-card-border);
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { initContactTracking } from '../scripts/analytics';

  interface SocialLink {
    href: string;
    label: string;
    rel?: string;
    class: string;
    symbolPath: string;
    symbolFill: 'fill' | 'stroke';
    contact?: string;
  }
  interface PageLink {
    href: string;
    label: string;
  }

  interface Props {
    socialLinks: SocialLink[];
    pageLinks: PageLink[];
  }

  let { socialLinks, pageLinks }: Props = $props();

  const year = new Date().getFullYear();

  onMount(() => initContactTracking());
</script>

<!-- LEARN: a <footer> element, not a <section>. It is the page's contentinfo
     landmark, which assistive tech and search engines anchor to. The #Contact id
     is load-bearing: analytics and the nav's contact anchor both target it. -->
<footer id="Contact" class="w-full border-t border-t-card-border bg-syoro/7 text-syoro">
  <div class="mx-auto w-full px-6 md:px-12 lg:px-20 pt-18 pb-7">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-x-18 gap-y-14">
      <!-- Invitation + contact -->
      <div class="flex min-w-0 flex-col gap-10">
        <h2
          class="max-w-[34ch] font-serif text-[clamp(28px,3.4vw,40px)] leading-[1.22] font-normal tracking-[-0.015em] text-pretty text-syoro"
        >
          Let's get in touch if you are intrigued about my work or just want to say hi!
        </h2>

        <!-- h-card / p-name / u-url / u-photo are microformats2: IndieWeb parsers
             (brid.gy, webmention.io) read them to attribute mentions. -->
        <div class="h-card flex flex-col gap-4">
          <span class="p-name" hidden>Ruwaiz Razak</span>
          <a href="https://ruwaizrazak.com" class="u-url" hidden aria-label="Ruwaiz Razak"></a>
          <img src="/avatar.jpg" class="u-photo" alt="Ruwaiz Razak" hidden />

          <h3
            class="font-handwriting text-[26px] font-bold tracking-[0.06em] uppercase text-syoro/70"
          >
            Say Hi
          </h3>

          <ul class="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {#each socialLinks as link (link.href)}
              <li class="list-none">
                <a
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.rel}
                  data-contact={link.contact}
                  class={`${link.class} inline-flex items-center gap-2.5 rounded-full border border-card-border bg-cardbg py-[11px] pr-5 pl-4 font-sans text-[19px] font-medium tracking-[0.02em] whitespace-nowrap text-syoro no-underline transition-[color,border-color,transform] duration-[220ms] ease-snappy hover:-translate-y-0.5 hover:border-chip hover:text-konpeki motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
                >
                  <svg
                    class="size-[18px] shrink-0"
                    viewBox="0 0 24 24"
                    fill={link.symbolFill === 'fill' ? 'currentColor' : 'none'}
                    stroke={link.symbolFill === 'stroke' ? 'currentColor' : undefined}
                    stroke-width={link.symbolFill === 'stroke' ? 2 : undefined}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d={link.symbolPath} />
                  </svg>
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </div>

      <!-- Page index -->
      <nav class="flex min-w-0 flex-col gap-3.5" aria-label="Site index">
        <div class="flex items-center gap-3.5">
          <span
            class="font-sans text-[14px] font-semibold tracking-[0.18em] uppercase text-syoro/60"
          >
            Index
          </span>
          <span class="h-px flex-1 bg-syoro/12" aria-hidden="true"></span>
        </div>

        <ul class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 p-0">
          {#each pageLinks as link, i (link.href)}
            <li class="list-none">
              <a
                href={link.href}
                title={`Go to ${link.label}`}
                class="flex items-baseline justify-between gap-3 border-b border-b-syoro/10 py-[13px] font-sans text-[20px] font-medium tracking-[0.02em] text-syoro no-underline transition-[color,padding-inline-start] duration-200 ease-snappy hover:ps-1.5 hover:text-konpeki motion-reduce:transition-none motion-reduce:hover:ps-0"
              >
                {link.label}
                <span class="font-mono text-label tracking-meta text-muted/65" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </div>

    <!-- Bottom rule -->
    <div
      class="mt-14 flex flex-wrap items-center justify-between gap-x-7 gap-y-4 border-t border-t-syoro/12 pt-[22px] font-mono text-[11px] tracking-[0.14em] uppercase text-muted"
    >
      <span>© {year} Ruwaiz Razak</span>
      <span class="inline-flex items-center gap-2.5">
        <span class="size-1.5 rotate-45 bg-konpeki" aria-hidden="true"></span>
        Built with Astro
      </span>
    </div>
  </div>
</footer>

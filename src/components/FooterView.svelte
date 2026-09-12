<script lang="ts">
  import { onMount } from 'svelte';
  import LinkView from './mdxComponents/LinkView.svelte';
  import { iconMorph } from '../lib/actions/iconMorph';
  import { initContactTracking } from '../scripts/analytics';

  /**
   * LEARN: replaces scripts/footerIconMorph.ts, which had NO idempotency guard at
   * all — initOnLoad fired it twice on first load, so every contact link got two
   * mouseenter/mouseleave pairs and two GSAP tweens fought over the same path on
   * each hover. The morph is a Svelte action now, so it is bound once per element
   * and torn down with the component.
   */
  interface SocialLink {
    href: string;
    label: string;
    rel?: string;
    class: string;
    diamondPath: string;
    symbolPath: string;
    contact?: string;
  }
  interface PageLink {
    href: string;
    label: string;
    tooltipHTML: string;
  }

  interface Props {
    socialLinks: SocialLink[];
    pageLinks: PageLink[];
  }

  let { socialLinks, pageLinks }: Props = $props();

  onMount(() => initContactTracking());
</script>

<section id="Contact" class="bg-syoro/10 text-syoro -mt-20 py-20 w-full md:w-screen md:ml-[calc(50%-50vw)]">
  <div class="mx-auto w-full py-12 px-6 md:px-20 md:py-16 lg:px-20 flex">
    <div class="flex flex-col md:flex-row w-full justify-between">
      <!-- Left: Quote + tagline -->
      <div>
        <h2 class="font-serif text-2xl max-w-xl italic font-normal leading-snug mb-8 md:text-3xl">
          Let's get in touch if you are intrigued about my work or just want to say hi!
        </h2>
        <div class="h-card">
          <span class="p-name" hidden>Ruwaiz Razak</span>
          <a href="https://ruwaizrazak.com" class="u-url" hidden aria-label="Ruwaiz Razak"></a>
          <img src="/avatar.jpg" class="u-photo" alt="Ruwaiz Razak" hidden />
          <h3 class="font-handwriting text-xl font-bold uppercase tracking-widest text-syoro/70 mb-5">
            Say Hi
          </h3>
          <ul class="list-none flex flex-row flex-wrap gap-3 p-0 m-0 w-full">
            {#each socialLinks as link (link.href)}
              <li class="list-none">
                <a
                  href={link.href}
                  target="_blank"
                  rel={link.rel}
                  class={`${link.class} inline-flex flex-row items-center gap-[0.6rem] whitespace-nowrap font-sans text-xl font-normal no-underline transition-colors duration-200`}
                  data-diamond={link.diamondPath}
                  data-symbol={link.symbolPath}
                  data-contact={link.contact}
                  use:iconMorph={{ diamond: link.diamondPath, symbol: link.symbolPath }}
                >
                  <svg class="contact-icon w-[1.125rem] h-[1.125rem] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path class="contact-icon-path" fill="currentColor" d={link.diamondPath} />
                  </svg>
                  <div class="w-full">{link.label}</div>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </div>

      <!-- Right: Page links -->
      <div class="justify-self-end">
        <ul class="list-none grid grid-cols-3 gap-3 p-0 mt-10 md:m-0">
          {#each pageLinks as link (link.href)}
            <li>
              <LinkView
                href={link.href}
                title={`Go to ${link.label}`}
                tooltipHTML={link.tooltipHTML}
                class="text-syoro font-sans font-normal no-underline transition-colors duration-200 hover:text-white text-lg md:text-xl"
              >
                {link.label}
              </LinkView>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>

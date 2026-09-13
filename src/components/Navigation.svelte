<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { Dropdown } from '../lib/state/dropdown.svelte';

  export interface MenuItem {
    name: string;
    href: string;
    icon?: string;
    description?: string;
  }

  export interface Props {
    menuItems?: MenuItem[];
    logoText?: string;
    logoHref?: string;
    class?: string;
    additionalLinks?: MenuItem[];
  }

  let {
    menuItems = [],
    logoText = 'Ruwaiz Razak',
    logoHref = '/',
    class: className = '',
    additionalLinks = [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
  }: Props = $props();

  /**
   * LEARN: this island replaces scripts/navigation.ts wholesale — 140 lines that
   * reached for 10 elements by id, mutated classList by hand, and needed a
   * `desktop-menu-button.dataset.initialized` guard because initOnLoad() ran it
   * twice. None of that survives: the template derives every class from state,
   * and every listener is torn down when the island unmounts.
   */
  /**
   * LEARN — Tailwind v4 + Svelte gotcha, found the hard way:
   * do NOT use `class:some-tailwind-utility={cond}`. Tailwind's scanner reads
   * `class:translate-x-full` as the variant `class` applied to `translate-x-full`,
   * discards it as an unknown variant, and NEVER EMITS THE UTILITY. The markup then
   * carries a class with no CSS behind it — here the mobile sidebar stopped being
   * translated off-screen and swallowed clicks meant for the menu button.
   * Svelte 5's object form inside `class={[...]}` keeps the utility as a plain
   * quoted string, which the scanner does pick up.
   */
  /**
   * LEARN: nothing in this component is a document heading. The logo used to be an
   * <h4> and every nav/menu label an <h3>, which put the site navigation into the
   * heading outline of EVERY page — ahead of the page's own <h1> — and produced
   * h1->h3 / h2->h4 jumps that the SEO integrity check flagged site-wide. They are
   * spans and paragraphs now; the classes are unchanged, so nothing moves visually.
   */
  const garden = new Dropdown();
  const about = new Dropdown();
  let mobileOpen = $state(false);

  const closeMobile = () => (mobileOpen = false);

  // LEARN: the icon mask is inlined per item; kept as a helper so the same string
  // isn't duplicated across the three places icons render.
  const maskStyle = (icon: string) =>
    `background-color: var(--color-syoro); mask: url(${icon}) center/contain no-repeat; -webkit-mask: url(${icon}) center/contain no-repeat;`;

  // LEARN: the Garden dropdown's "floating shelf" chip icon (1c in the design
  // review) uses --color-konpeki, not the --color-syoro every other masked icon
  // in this file uses — a separate helper beats overloading maskStyle with a
  // color argument nothing else needs.
  const chipIconStyle = (icon: string) =>
    `background-color: var(--color-konpeki); mask: url(${icon}) center/contain no-repeat; -webkit-mask: url(${icon}) center/contain no-repeat;`;

  // Close-on-outside for both dropdowns, from a single document listener.
  $effect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!gardenEl?.contains(target) && !gardenButton?.contains(target)) garden.close();
      if (!aboutEl?.contains(target) && !aboutButton?.contains(target)) about.close();
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  });

  // LEARN: bridges desktop/mobile so neither is left open in the other's layout.
  $effect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) closeMobile();
      else {
        garden.close();
        about.close();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // LEARN: body scroll lock follows mobileOpen. The cleanup also runs when the
  // island unmounts, so a navigation can never strand the page unscrollable —
  // which the old code could, since nothing undid the inline style on teardown.
  $effect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });

  $effect(() => () => {
    garden.destroy();
    about.destroy();
  });

  let gardenEl: HTMLElement | undefined = $state();
  let gardenButton: HTMLElement | undefined = $state();
  let aboutEl: HTMLElement | undefined = $state();
  let aboutButton: HTMLElement | undefined = $state();

  const gardenContains = (target: EventTarget | null) =>
    target instanceof Node && !!(gardenEl?.contains(target) || gardenButton?.contains(target));

  const showGarden = () => garden.show();
  // LEARN: don't close if the pointer/focus is moving between the Garden
  // button and its panel — otherwise the mt-3 gap (or tabbing into a link)
  // would hide the menu before you can use it. scheduleClose() still covers
  // the empty gap: show() on the panel cancels the pending close.
  const leaveGarden = (event: MouseEvent | FocusEvent) => {
    if (gardenContains(event.relatedTarget)) return;
    garden.scheduleClose();
  };

  const aboutContains = (target: EventTarget | null) =>
    target instanceof Node && !!(aboutEl?.contains(target) || aboutButton?.contains(target));

  const showAbout = () => about.show();
  const leaveAbout = (event: MouseEvent | FocusEvent) => {
    if (aboutContains(event.relatedTarget)) return;
    about.scheduleClose();
  };</script>

<nav class={`relative z-50 ${className}`}>
  <div>
    <!-- LEARN: 1c makes the nav row itself a surface (rounded-full, its own soft
         shadow) — that is what the shelf below detaches FROM. The mock sits this
         white pill on a warm #efece6 page; the site's light ground is #ffffff, so
         separation here comes from the warm border the rest of the site's cards
         already use, plus the design's shadow. h-16 is already the mock's 64px. -->
    <div
      class="relative flex flex-row justify-between items-center h-16 px-5 md:px-6 rounded-full bg-cardbg border border-card-border shadow-[0_1px_2px_rgba(0,53,53,0.06)]"
    >
      <!-- Logo -->
      <div class="flex-shrink-0 flex flex-row items-center gap-2">
        <!-- LEARN: was a raw inline onclick="" attribute — the only one in the
             project. The flag is read by the pre-paint entrance gate in index.astro. -->
        <a
          href={logoHref}
          data-astro-prefetch
          onclick={() => sessionStorage.setItem('skipIndexAnimations', '1')}
        >
          <span class="block text-xl md:text-2xl lg:text-3xl font-medium font-handwriting text-syoro">{logoText}</span>
        </a>
        <ThemeToggle />
      </div>

      <!-- Desktop Menu Buttons (md and up) -->
      <div class="hidden md:flex items-center gap-2">
        <!-- LEARN: was `grid grid-cols-3`, which forced "Garden ▾", "About" and
             "Live" into equal columns and padded the short labels out. The mock
             uses a flex row with a 3px inset, so each label keeps its own width. -->
        <div class="flex p-[3px] rounded-full bg-syoro/8 dark:bg-syoro/10">
          <!-- Garden Dropdown Button -->
          <button
            bind:this={gardenButton}
            id="desktop-menu-button"
            onmouseover={showGarden}
            onfocus={showGarden}
            onmouseleave={leaveGarden}
            onblur={leaveGarden}
            aria-haspopup="true"
            aria-expanded={garden.open}
            aria-controls="desktop-dropdown"
            class={[
              'flex items-center gap-2 px-5 py-1.5 text-sm md:text-lg lg:text-xl font-medium text-syoro rounded-full uppercase transition-colors duration-200 ease-snappy hover:bg-chip focus:outline-none focus:ring-2 focus:ring-syoro/20',
              // LEARN: the tab carries the open state in the mock (#EAF3FF light, a
              // syoro wash dark) — that is `bg-chip`, the same token as the icon
              // chips below. Object form, never `class:bg-chip`: Tailwind v4 reads
              // `class:` as a variant and never emits the utility.
              { 'bg-chip': garden.open },
            ]}
          >
            Garden
            <svg
              class={['w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-snappy', { 'rotate-180': garden.open }]}
              id="desktop-chevron"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <!--
            Desktop Dropdown Menu (md and up)
            LEARN: restyled to the "Floating shelf" (1c) direction from the Garden-dropdown
            design review — icon chips in a rounded-full badge, serif titles/descriptions,
            and a panel that reads as detached from the pill nav bar rather than pinned to it.
            The open/close contract is untouched: same #desktop-dropdown id, same Dropdown
            class driving `garden.hidden`/`garden.open`, same hidden-lag — that's what
            navigation.spec.ts asserts against, not the visual treatment.

            LEARN: it sits HERE, directly after its trigger, purely for tab order. The
            menu opens on focus, but while this lived at the end of <nav> the next Tab
            went to "About" — outside the panel — so leaveGarden() closed the shelf
            before anyone could reach a link inside it. It is position:absolute against
            <nav class="relative"> and nothing in between is positioned, so moving it
            changes the tab order and nothing else.
          -->
          <!--
            LEARN: the clip wrapper is what sells "it came from behind the pill".
            Its top edge is the bar's bottom edge (top-full against the bar, which is
            why the bar carries `relative`), and overflow-hidden means the shelf simply
            does not render above that line — so it slides out from under the bar with
            no seam. Z-order can't do this job: the shelf lives INSIDE the bar (for tab
            order), and a descendant always paints over its ancestor's background.
            The negative insets + matching padding buy room for the 48px shadow blur
            on the free sides while keeping the clip tight at the top.
            pointer-events-none so this large invisible box never eats a click; the
            panel re-enables them for itself when open.

            LEARN: `mt-px` is load-bearing. top-full resolves against the bar's PADDING
                 box, and the bar has a 1px border, so without it the clip line lands 1px
                 inside the pill — the panel flashes a hairline over the bar's own border
                 mid-slide, and the resting gap measures 9px instead of the design's 10px.
          -->
          <div class="absolute top-full mt-px -left-12 -right-12 px-12 pb-16 overflow-hidden pointer-events-none">
            <div
              bind:this={gardenEl}
              id="desktop-dropdown"
              role="region"
              aria-label="Garden"
              onmouseover={showGarden}
              onmouseleave={leaveGarden}
              onfocusin={showGarden}
              class={[
                // LEARN: bg-cardbg, not bg-backgroundcolor. In dark the latter is #1a1a1a —
                // the page colour — so the shelf had no surface at all and read as a bare
                // border. cardbg is #ffffff / #2a2a2a, exactly the two panel fills the mock
                // specifies. No backdrop-blur: the fill is opaque, so it only cost a layer.
                'md:block relative mt-2.5 w-full z-50 rounded-[26px] border border-card-border bg-cardbg shadow-[0_18px_48px_rgba(0,53,53,0.10)] dark:shadow-none',
                // LEARN: travel is its own height plus the 10px resting gap, so it starts
                // fully above the clip line (tucked behind the bar) rather than peeking.
                // 260ms matches the mock's transform duration AND Dropdown's hidden lag —
                // a longer slide would still be moving when display:none lands.
                'transition-[opacity,transform] duration-260 ease-snappy motion-reduce:transition-none motion-reduce:translate-y-0',
                { hidden: garden.hidden },
                garden.open
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-[calc(-100%-10px)] pointer-events-none',
              ]}
            >
                <!-- LEARN: was `flex justify-around` with `w-1/5` on each item, which baked the
                     item count into the markup (and `items-right`, which is not a Tailwind
                     utility at all). A grid takes its track count from the breakpoint instead,
                     so adding or removing a menuItem in Header.astro can't break the row. -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 p-5">
                  {#each menuItems as item (item.href)}
                    <a
                      href={item.href}
                      class="group flex flex-col gap-3 px-3.5 pt-4 pb-5 rounded-[14px] transition-colors duration-200 ease-snappy hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-syoro/20"
                    >
                      {#if item.icon}
                        <span class="flex items-center justify-center w-11 h-11 rounded-full bg-chip">
                          <span class="block w-[22px] h-[22px]" style={chipIconStyle(item.icon)} role="img" aria-label={item.name}></span>
                        </span>
                      {/if}
                      <span class="block text-xl font-medium font-serif text-syoro">
                        {item.name}
                      </span>
                      {#if item.description}
                        <p class="text-sm font-serif text-pretty text-muted">{item.description}</p>
                      {/if}
                    </a>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Additional Links -->
            {#each additionalLinks as link (link.href)}
              <a
                href={link.href}
                class="flex items-center justify-center px-5 py-1.5 text-sm md:text-lg lg:text-xl text-syoro rounded-full uppercase transition-colors duration-200 ease-snappy hover:bg-chip focus:outline-none focus:ring-2 focus:ring-syoro/20"
              >
                <span class="font-sans font-medium text-sm md:text-lg lg:text-xl flex items-center gap-2">
                  {#if link.icon}
                    <span
                      class="flex-shrink-0 w-6 h-6 inline-block"
                      style={maskStyle(link.icon)}
                      role="img"
                      aria-label={link.name}
                    ></span>
                  {/if}
                  {link.name}
                </span>
              </a>
            {/each}
          </div>

          <!-- Work with me contact dropdown (desktop) -->
          <!-- LEARN: no `relative` here any more. The clip wrapper below has to measure
               from the BAR's bottom edge; anchored to this button instead, its top edge
               would sit ~12px higher — inside the pill — and the panel would be seen
               sliding across the pill's own background instead of out from under it. -->
          <div id="contact-button">
            <div class="bg-link rounded-full">
              <button
                bind:this={aboutButton}
                id="about-menu-button"
                onmouseover={showAbout}
                onfocus={showAbout}
                onmouseleave={leaveAbout}
                onblur={leaveAbout}
                class="flex items-center text-sm md:text-lg lg:text-xl font-medium text-white rounded-full hover:bg-syoro/10 dark:hover:bg-syoro/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-syoro/20 dark:focus:ring-syoro/20 transition-[transform,background-color] duration-200 ease-snappy uppercase hover:scale-95 px-5 py-2"
              >
                Work with me
                <span class="text-white">
                  <svg
                    class={['ml-2 -mr-1 w-4 h-4 flex-shrink-0 transition-transform duration-200', { 'rotate-180': about.open }]}
                    id="about-chevron"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </span>
              </button>
            </div>
            <!-- Same clip-and-slide as the Garden shelf, so both panels in this bar
                 enter the same way. Right-aligned to the bar's edge rather than the
                 button's, which matches how the shelf sits full-bleed to the bar. -->
            <div class="absolute top-full mt-px right-0 -mr-12 px-12 pb-16 overflow-hidden pointer-events-none">
              <div
                bind:this={aboutEl}
                id="about-dropdown"
                role="region"
                aria-label="Contact"
                onmouseover={showAbout}
                onmouseleave={leaveAbout}
                onfocusin={showAbout}
                class={[
                  // LEARN: same fix as the Garden shelf — bg-backgroundcolor is the page
                  // colour (#1a1a1a) in dark, so this panel had no surface either, and
                  // `border` with no colour fell back to the default grey. Not part of
                  // the 1c design, but it is the sibling panel in the same bar.
                  'relative mt-2.5 w-56 shadow-lg rounded-xl bg-cardbg transition-[opacity,transform] duration-260 ease-snappy motion-reduce:transition-none motion-reduce:translate-y-0 border border-card-border z-50',
                  { hidden: about.hidden },
                  about.open
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-[calc(-100%-10px)] pointer-events-none',
                ]}
              >
              <div>
                <a
                  href="https://www.linkedin.com/in/ruwaizrazak"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-contact="linkedin"
                  class="p-4 text-sm md:text-lg lg:text-xl font-medium text-konpeki hover:bg-blue-50 dark:hover:bg-syoro/10 hover:text-link hover:scale-95 rounded-t-xl flex gap-2 transition-[transform,background-color,color] duration-200 ease-snappy"
                >
                  <span class="text-syoro">
                    <svg class="contact-icon w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path class="contact-icon-symbol" fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </span>
                  LinkedIn
                </a>
                <a
                  href="mailto:hello@ruwaizrazak.com"
                  data-contact="email"
                  class="group flex gap-2 hover:gap-4 transition-[transform,background-color,color,gap] duration-200 ease-snappy p-4 text-sm md:text-lg lg:text-xl font-medium text-konpeki hover:bg-blue-50 dark:hover:bg-syoro/10 hover:text-link hover:scale-95"
                >
                  <span class="text-syoro flex-shrink-0">
                    <svg class="contact-icon w-6 h-6 transition-colors duration-200 ease-snappy" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path class="contact-icon-symbol" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Mail me
                </a>
                <a
                  href="https://www.ruwaizrazak.com/ruwaizcv.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-contact="resume"
                  class="flex gap-2 p-4 text-sm md:text-lg lg:text-xl font-medium text-konpeki hover:bg-blue-50 dark:hover:bg-syoro/10 hover:text-link hover:scale-95 transition-[transform,background-color,color] duration-200 ease-snappy rounded-b-xl"
                >
                  <span class="text-syoro flex-shrink-0">
                    <svg class="contact-icon w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path class="contact-icon-diamond" fill="currentColor" d="M12,2 L22,12 L12,22 L2,12 Z" />
                    </svg>
                  </span>
                  Download resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile: menu button -->
      <div class="md:hidden flex items-center gap-2">
        <button
          id="mobile-menu-button"
          onclick={() => (mobileOpen = !mobileOpen)}
          class="inline-flex items-center justify-center p-2 rounded-md text-syoro hover:text-link hover:bg-syoro/10 dark:hover:bg-syoro/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-syoro/20 dark:focus:ring-syoro/20 transition-colors"
        >
          <svg class={['h-6 w-6', { hidden: mobileOpen }]} id="mobile-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg class={['h-6 w-6', { hidden: !mobileOpen }]} id="mobile-close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Sidebar Overlay -->
  <div
    id="mobile-overlay"
    onclick={closeMobile}
    role="presentation"
    class={[
      'md:hidden fixed inset-0 backdrop-blur-xs transition-opacity z-40 duration-300 ease-snappy',
      { hidden: !mobileOpen },
    ]}
  ></div>

  <!-- Mobile Sidebar -->
  <div
    id="mobile-sidebar"
    class={[
      'md:hidden fixed top-0 right-0 h-full w-80 bg-backgroundcolor border border-card-border shadow-xl z-50 transform transition-transform duration-300 ease-drawer overflow-y-auto scroll-auto',
      { 'translate-x-full': !mobileOpen },
    ]}
  >
    <div class="flex items-end justify-end p-4 border-b">
      <button
        id="mobile-close-button"
        onclick={closeMobile}
        class="p-2 rounded-md text-syoro hover:text-link hover:bg-syoro/10 dark:hover:bg-syoro/10 transition-colors"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="py-4">
      <!-- Additional Links in Mobile -->
      {#each additionalLinks as link (link.href)}
        <a
          href={link.href}
          onclick={closeMobile}
          class="flex items-center px-4 py-3 text-konpeki hover:scale-95 hover:text-link transition-[transform,color] duration-200 ease-snappy border-b border-gray-100 dark:border-card-border"
        >
          {#if link.icon}
            <span class="flex-shrink-0 mr-3">
              <span class="block w-6 h-6" style={maskStyle(link.icon)} role="img" aria-label={link.name}></span>
            </span>
          {/if}
          <div class="flex-1">
            <div class="font-medium font-serif">{link.name}</div>
            <div class="text-sm text-gray-500">{link.description}</div>
          </div>
        </a>
      {/each}

      <!-- Separator -->
      <div class="border-t border-gray-200 dark:border-card-border my-2"></div>

      <!-- Garden Menu Items -->
      <div class="px-4 py-2">
        <p class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Garden</p>
      </div>
      {#each menuItems as item (item.href)}
        <a
          href={item.href}
          onclick={closeMobile}
          class="flex items-center px-4 py-3 text-konpeki hover:bg-syoro/10 dark:hover:bg-syoro/10 hover:text-link transition-colors duration-200"
        >
          {#if item.icon}
            <span class="flex-shrink-0 mr-3">
              <span class="block w-6 h-6" style={maskStyle(item.icon)} role="img" aria-label={item.name}></span>
            </span>
          {/if}
          <div class="flex-1">
            <div class="font-medium">{item.name}</div>
            {#if item.description}
              <div class="text-sm text-gray-500">{item.description}</div>
            {/if}
          </div>
        </a>
      {/each}

      <!-- Separator -->
      <div class="border-t border-gray-200 dark:border-card-border my-2"></div>

      <!-- About / Connect section in mobile -->
      <div class="px-4 py-2">
        <p class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact</p>
      </div>
      <a
        href="https://www.linkedin.com/in/ruwaizrazak"
        target="_blank"
        rel="noopener noreferrer"
        data-contact="linkedin"
        onclick={closeMobile}
        class="flex items-center px-4 py-3 text-konpeki hover:bg-syoro/10 dark:hover:bg-syoro/10 hover:text-link transition-colors duration-200"
      >
        <div class="flex-1"><div class="font-medium">LINKED IN</div></div>
      </a>
      <a
        href="mailto:hello@ruwaizrazak.com"
        data-contact="email"
        onclick={closeMobile}
        class="flex items-center px-4 py-3 text-konpeki hover:bg-syoro/10 dark:hover:bg-syoro/10 hover:text-link transition-colors duration-200"
      >
        <div class="flex-1"><div class="font-medium">Mail me</div></div>
      </a>
      <a
        href="https://www.ruwaizrazak.com/ruwaizcv.pdf"
        target="_blank"
        rel="noopener noreferrer"
        data-contact="resume"
        onclick={closeMobile}
        class="flex items-center px-4 py-3 text-konpeki hover:bg-syoro/10 dark:hover:bg-syoro/10 hover:text-link transition-colors duration-200"
      >
        <div class="flex-1"><div class="font-medium">Download resume</div></div>
      </a>
    </div>
  </div>
</nav>

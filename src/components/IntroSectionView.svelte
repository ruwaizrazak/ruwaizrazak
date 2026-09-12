<script lang="ts">
  import LinkView from './mdxComponents/LinkView.svelte';
  import { pageType } from '../styles/typography';

  interface Props {
    /** Pre-rendered tooltip markup for the Nordeus link, resolved by IntroSection.astro. */
    nordeusTooltip?: string;
  }
  let { nordeusTooltip = '' }: Props = $props();
</script>

<section id="Intro-text" class="w-full sm:w-3/4 md:w-3/4 xl:w-[50%] font-serif my-30 text-syoro">
  <!-- LEARN: this is the page's <h1>. The homepage previously had NO h1 at all —
       nothing described the page to a screen reader or a search engine, and
       keyboard-a11y + integrity both flagged it. The lead line IS the page's
       primary statement, so it becomes the heading rather than adding a hidden
       one. Base h1 styles live in @layer base, which Tailwind utilities override,
       so the classes below keep it looking exactly as before. -->
  <h1 class={`index-intro ${pageType.description} font-sans mt-6 max-w-4xl lg:max-w-5xl mb-2 text-syoro/80`}>
    Senior UX Designer at <LinkView
      href="https://nordeus.com/"
      class="text-link"
      tooltipHTML={nordeusTooltip}
      isExternal>Nordeus.</LinkView
    >
  </h1>
  <p class={`index-intro ${pageType.description} mt-6 max-w-4xl lg:max-w-5xl text-syoro`}>
    Designs and optimize systems that improve onboarding, retention, and longterm user motivation
  </p>
</section>

<style>
  .index-intro {
    opacity: 0;
  }

  /* LEARN: these classes land on <body>/<html> from the entrance-gate script in
     index.astro, outside this component, so they must stay :global. Svelte scopes
     the @keyframes below and rewrites the reference to match. */
  :global(body.animate-in) .index-intro {
    animation: HeroSectionIntro 0.7s ease-in-out 0.3s forwards;
  }

  :global(html.returned-from-work) .index-intro,
  :global(body.returned-from-work) .index-intro {
    animation: none;
    opacity: 1;
    transform: none;
  }

  @keyframes HeroSectionIntro {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

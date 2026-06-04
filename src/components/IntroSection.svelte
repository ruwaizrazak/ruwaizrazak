<script lang="ts">
  // LEARN: The Nordeus link was a <Link> (build-time metadata tooltip). Since Svelte
  // can't render the async Astro <Link>, it's a plain external <a> here — the only
  // change is losing the hover preview on that one link.
</script>

<section id="Intro-text" class="w-full sm:w-3/4 md:w-3/4 xl:w-[50%] font-serif my-30 text-syoro">
  <p class="index-intro text-lg md:text-2xl mb-2 text-syoro/60 font-sans">
    Senior UX Designer at <a href="https://nordeus.com/" class="text-link" target="_blank" rel="noopener noreferrer">Nordeus.</a>
  </p>
  <p class="index-intro font-serif text-2xl md:text-3xl text-syoro">Designs and optimize systems that improve onboarding, retention, and longterm user motivation</p>
</section>

<style>
  .index-intro {
    opacity: 0;
  }

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

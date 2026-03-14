/**
 * Page-based responsive carousel for work experience.
 * Auto-advances by page, supports swipe, wheel, play/pause.
 * Responsive: 3 cards (lg), 2 cards (md), 1+peek (sm).
 */

const AUTO_PLAY_DURATION = 5000;

let currentPage = 0;
let isPlaying = true;
let timerId: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let timerStartTime = 0;
let slideCount = 0;

// DOM refs
let track: HTMLElement | null = null;
let slides: HTMLElement[] = [];
let dots: HTMLElement[] = [];
let prevBtn: HTMLElement | null = null;
let nextBtn: HTMLElement | null = null;
let playPauseBtn: HTMLElement | null = null;
let viewport: HTMLElement | null = null;

// Touch state
let touchStartX = 0;
let touchStartY = 0;
let touchDragging = false;
let trackBaseTranslate = 0;

function getCardsPerPage(): number {
  const w = window.innerWidth;
  if (w >= 1024) return 3;
  if (w >= 768) return 2;
  return 1;
}

function getPageCount(): number {
  return Math.ceil(slideCount / getCardsPerPage());
}

function goToPage(page: number) {
  const cpp = getCardsPerPage();
  const pageCount = getPageCount();
  if (pageCount === 0) return;

  currentPage = Math.max(0, Math.min(page, pageCount - 1));

  // Position the track
  if (track) {
    if (cpp === 1) {
      // sm: 85% slide width, 7.5% offset for peek
      track.style.transform = `translateX(calc(-${currentPage * 85}% + 7.5%))`;
    } else {
      // md/lg: full page shift
      track.style.transform = `translateX(-${currentPage * 100}%)`;
    }
  }

  // Toggle active-group on visible slides
  const startIdx = currentPage * cpp;
  const endIdx = startIdx + cpp;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active-group', i >= startIdx && i < endIdx);
  });

  // Show/hide dots based on page count
  dots.forEach((dot, i) => {
    dot.style.display = i < pageCount ? '' : 'none';
    dot.classList.toggle('active', i === currentPage);
    const progress = dot.querySelector<HTMLElement>('.dot-nav-progress');
    if (progress) progress.style.width = '0%';
  });

  if (isPlaying) {
    stopTimer();
    startAutoPlay();
  }
}

function startAutoPlay() {
  if (!isPlaying) return;
  timerStartTime = performance.now();

  const activeDot = dots[currentPage];
  const progress = activeDot?.querySelector<HTMLElement>('.dot-nav-progress');

  function tick() {
    const elapsed = performance.now() - timerStartTime;
    const pct = Math.min((elapsed / AUTO_PLAY_DURATION) * 100, 100);
    if (progress) progress.style.width = `${pct}%`;
    if (pct < 100) {
      rafId = requestAnimationFrame(tick);
    }
  }
  rafId = requestAnimationFrame(tick);

  timerId = setTimeout(() => {
    const pageCount = getPageCount();
    const next = (currentPage + 1) % pageCount;
    goToPage(next);
  }, AUTO_PLAY_DURATION);
}

function stopTimer() {
  if (timerId !== null) { clearTimeout(timerId); timerId = null; }
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  dots.forEach((dot) => {
    const progress = dot.querySelector<HTMLElement>('.dot-nav-progress');
    if (progress) progress.style.width = '0%';
  });
}

function togglePlayPause() {
  isPlaying = !isPlaying;
  updatePlayPauseIcon();
  if (isPlaying) {
    startAutoPlay();
  } else {
    stopTimer();
  }
}

function updatePlayPauseIcon() {
  if (!playPauseBtn) return;
  if (isPlaying) {
    playPauseBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/></svg>`;
    playPauseBtn.setAttribute('aria-label', 'Pause auto-play');
  } else {
    playPauseBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,0 12,6 2,12"/></svg>`;
    playPauseBtn.setAttribute('aria-label', 'Play auto-play');
  }
}

// Touch handlers
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchDragging = true;

  const cpp = getCardsPerPage();
  if (cpp === 1) {
    trackBaseTranslate = -(currentPage * 85) + 7.5;
  } else {
    trackBaseTranslate = -(currentPage * 100);
  }
  if (track) track.style.transition = 'none';
}

function onTouchMove(e: TouchEvent) {
  if (!touchDragging || !track || !viewport) return;
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;

  // If mostly vertical scroll, bail
  if (Math.abs(dy) > Math.abs(dx) * 1.5) return;

  const viewportWidth = viewport.clientWidth;
  const pctOffset = (dx / viewportWidth) * 100;
  track.style.transform = `translateX(calc(${trackBaseTranslate}% + ${pctOffset}%))`;
}

function onTouchEnd(e: TouchEvent) {
  if (!touchDragging) return;
  touchDragging = false;
  if (track) track.style.transition = '';

  const pageCount = getPageCount();
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    if (dx < 0 && currentPage < pageCount - 1) {
      goToPage(currentPage + 1);
    } else if (dx > 0 && currentPage > 0) {
      goToPage(currentPage - 1);
    } else {
      goToPage(currentPage); // snap back
    }
  } else {
    goToPage(currentPage); // snap back
  }
}

// Wheel handler (desktop horizontal scroll)
function onWheel(e: WheelEvent) {
  if (Math.abs(e.deltaX) < 30) return;
  e.preventDefault();

  const pageCount = getPageCount();
  if (e.deltaX > 0 && currentPage < pageCount - 1) {
    goToPage(currentPage + 1);
  } else if (e.deltaX < 0 && currentPage > 0) {
    goToPage(currentPage - 1);
  }
}

function onDotClick(e: Event) {
  const btn = (e.currentTarget as HTMLElement);
  const index = Number(btn.dataset.dotIndex);
  if (!isNaN(index)) goToPage(index);
}

// Cleanup function for view transitions
let cleanupFns: (() => void)[] = [];

function cleanup() {
  stopTimer();
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
  currentPage = 0;
  isPlaying = true;
}

export function initWorkExperienceCarousel() {
  cleanup();

  viewport = document.getElementById('carousel-viewport');
  track = document.getElementById('carousel-track');
  const nav = document.getElementById('carousel-nav');
  playPauseBtn = nav?.querySelector<HTMLElement>('.dot-nav-playpause') ?? null;
  prevBtn = nav?.querySelector<HTMLElement>('.dot-nav-prev') ?? null;
  nextBtn = nav?.querySelector<HTMLElement>('.dot-nav-next') ?? null;

  if (!viewport || !track) return;

  slides = Array.from(track.querySelectorAll<HTMLElement>('.carousel-slide'));
  dots = Array.from(nav?.querySelectorAll<HTMLElement>('.dot-nav-dot') ?? []);
  slideCount = slides.length;

  if (slideCount === 0) return;

  // Set initial state
  updatePlayPauseIcon();
  goToPage(0);

  // Dot click listeners
  dots.forEach((dot) => {
    dot.addEventListener('click', onDotClick);
    cleanupFns.push(() => dot.removeEventListener('click', onDotClick));
  });

  // Previous / Next
  function onPrev() {
    if (currentPage > 0) goToPage(currentPage - 1);
  }
  function onNext() {
    const pageCount = getPageCount();
    if (currentPage < pageCount - 1) goToPage(currentPage + 1);
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', onPrev);
    cleanupFns.push(() => prevBtn!.removeEventListener('click', onPrev));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', onNext);
    cleanupFns.push(() => nextBtn!.removeEventListener('click', onNext));
  }

  // Play/pause
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
    cleanupFns.push(() => playPauseBtn!.removeEventListener('click', togglePlayPause));
  }

  // Touch/swipe on viewport
  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchmove', onTouchMove, { passive: true });
  viewport.addEventListener('touchend', onTouchEnd);
  cleanupFns.push(() => {
    viewport!.removeEventListener('touchstart', onTouchStart);
    viewport!.removeEventListener('touchmove', onTouchMove);
    viewport!.removeEventListener('touchend', onTouchEnd);
  });

  // Wheel (desktop horizontal scroll)
  viewport.addEventListener('wheel', onWheel, { passive: false });
  cleanupFns.push(() => viewport!.removeEventListener('wheel', onWheel));

  // Pause on visibility change
  function onVisChange() {
    if (document.hidden) {
      stopTimer();
    } else if (isPlaying) {
      startAutoPlay();
    }
  }
  document.addEventListener('visibilitychange', onVisChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', onVisChange));

  // IntersectionObserver: morph dot nav when section is visible
  const workSection = document.getElementById('work-experience');
  const carouselNav = document.getElementById('carousel-nav');
  if (workSection && carouselNav) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            carouselNav.classList.add('dots-visible');
          } else {
            carouselNav.classList.remove('dots-visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(workSection);
    cleanupFns.push(() => observer.disconnect());
  }

  // Handle resize — recalculate and clamp
  function onResize() {
    const pageCount = getPageCount();
    if (currentPage >= pageCount) {
      currentPage = pageCount - 1;
    }
    goToPage(currentPage);
  }
  window.addEventListener('resize', onResize);
  cleanupFns.push(() => window.removeEventListener('resize', onResize));
}

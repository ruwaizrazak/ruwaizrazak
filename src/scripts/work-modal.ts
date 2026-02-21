import gsap from 'gsap';

const SELECTORS = {
  triggers: '.work-card-trigger',
  modal: 'work-modal',
  backdrop: 'work-modal-backdrop',
  panel: 'work-modal-panel',
  closeBtn: 'work-modal-close',
  titleEl: 'work-modal-title',
  contentContainer: 'work-modal-content',
} as const;

export function initWorkModal() {
  const triggers = document.querySelectorAll<HTMLElement>(SELECTORS.triggers);
  const modal = document.getElementById(SELECTORS.modal);
  const backdrop = document.getElementById(SELECTORS.backdrop);
  const panel = document.getElementById(SELECTORS.panel);
  const closeBtn = document.getElementById(SELECTORS.closeBtn);
  const titleEl = document.getElementById(SELECTORS.titleEl);
  const contentContainer = document.getElementById(SELECTORS.contentContainer);

  if (!modal || !panel || !triggers.length || !contentContainer) return;

  let isOpen = false;
  let activeTrigger: HTMLElement | null = null;

  function openModal(triggerEl: HTMLElement) {
    if (isOpen) return;
    isOpen = true;

    const rect = triggerEl.getBoundingClientRect();
    const slug = triggerEl.dataset.workSlug;
    const title = triggerEl.dataset.workTitle || '';
    const company = triggerEl.dataset.workCompany || '';

    if (titleEl) titleEl.textContent = `${title} | ${company}`;

    contentContainer.querySelectorAll('.work-modal-content').forEach((el) => {
      el.classList.add('hidden');
    });
    const contentEl = document.getElementById(`work-content-${slug}`);
    if (contentEl) {
      contentEl.classList.remove('hidden');
      contentEl.scrollTop = 0;
    }

    triggerEl.classList.add('work-card-trigger-hidden');
    triggerEl.style.visibility = 'hidden';

    modal.style.pointerEvents = 'auto';
    modal.style.opacity = '1';

    gsap.set(panel, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      opacity: 1,
    });
    gsap.set(backdrop, { opacity: 0 });

    gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.to(panel, {
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: Math.min(window.innerWidth * 0.95, 1280),
      height: Math.min(window.innerHeight * 0.9, 900),
      duration: 0.5,
      ease: 'power3.out',
      overwrite: true,
    });
    activeTrigger = triggerEl;
  }

  function closeModal() {
    if (!isOpen) return;
    const rect = activeTrigger?.getBoundingClientRect();

    gsap.to(backdrop, { opacity: 0, duration: 0.2 });
    gsap.to(panel, {
      top: rect?.top ?? window.innerHeight / 2,
      left: rect?.left ?? window.innerWidth / 2,
      xPercent: rect ? 0 : -50,
      yPercent: rect ? 0 : -50,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        contentContainer.querySelectorAll('.work-modal-content').forEach((el) => {
          el.classList.add('hidden');
        });
        activeTrigger?.classList.remove('work-card-trigger-hidden');
        if (activeTrigger) activeTrigger.style.visibility = '';
        modal.style.pointerEvents = 'none';
        modal.style.opacity = '0';
        isOpen = false;
        activeTrigger = null;
      },
    });
  }

  triggers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(el);
    });
  });

  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
}

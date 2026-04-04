// LEARN: Factory pattern deduplicates identical dropdown logic — each call
// returns isolated state + methods via closure, avoiding class boilerplate.

interface DropdownConfig {
  buttonId: string;
  dropdownId: string;
  chevronId: string;
}

interface DropdownControls {
  toggle: () => void;
  close: () => void;
  isOpen: () => boolean;
  containsTarget: (target: Node) => boolean;
}

function createDropdown(config: DropdownConfig): DropdownControls | null {
  const button = document.getElementById(config.buttonId);
  const dropdown = document.getElementById(config.dropdownId);
  const chevron = document.getElementById(config.chevronId);

  if (!button || !dropdown) return null;

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;

    if (isOpen) {
      dropdown!.classList.remove('hidden', 'opacity-0', 'scale-95', 'pointer-events-none');
      dropdown!.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
      chevron?.classList.add('rotate-180');
    } else {
      dropdown!.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      dropdown!.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
      chevron?.classList.remove('rotate-180');
      // LEARN: Delay adding 'hidden' so the CSS opacity/scale transition
      // can play out before the element is removed from layout flow.
      setTimeout(() => {
        if (!isOpen) dropdown!.classList.add('hidden');
      }, 200);
    }
  }

  function close() {
    if (isOpen) toggle();
  }

  function getIsOpen() {
    return isOpen;
  }

  function containsTarget(target: Node) {
    return button!.contains(target) || dropdown!.contains(target);
  }

  return { toggle, close, isOpen: getIsOpen, containsTarget };
}

export function initNavigation(): void {
  const guard = document.getElementById('desktop-menu-button');
  if (guard?.dataset.initialized === 'true') return;
  if (guard) guard.dataset.initialized = 'true';

  const gardenDropdown = createDropdown({
    buttonId: 'desktop-menu-button',
    dropdownId: 'desktop-dropdown',
    chevronId: 'desktop-chevron',
  });

  const aboutDropdown = createDropdown({
    buttonId: 'about-menu-button',
    dropdownId: 'about-dropdown',
    chevronId: 'about-chevron',
  });

  document.getElementById('desktop-menu-button')?.addEventListener('click', () => gardenDropdown?.toggle());
  document.getElementById('about-menu-button')?.addEventListener('click', () => aboutDropdown?.toggle());

  // LEARN: Single document click listener handles close-on-outside for all
  // dropdowns, rather than one listener per dropdown.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Node) {
      if (gardenDropdown && !gardenDropdown.containsTarget(target)) gardenDropdown.close();
      if (aboutDropdown && !aboutDropdown.containsTarget(target)) aboutDropdown.close();
    }
  });

  // Mobile sidebar
  const mobileButton = document.getElementById('mobile-menu-button');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const mobileCloseButton = document.getElementById('mobile-close-button');
  const mobileMenuIcon = document.getElementById('mobile-menu-icon');
  const mobileCloseIcon = document.getElementById('mobile-close-icon');

  let isMobileOpen = false;

  function toggleMobileSidebar() {
    isMobileOpen = !isMobileOpen;

    if (isMobileOpen) {
      mobileOverlay?.classList.remove('hidden');
      mobileSidebar?.classList.remove('translate-x-full');
      mobileMenuIcon?.classList.add('hidden');
      mobileCloseIcon?.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      mobileOverlay?.classList.add('hidden');
      mobileSidebar?.classList.add('translate-x-full');
      mobileMenuIcon?.classList.remove('hidden');
      mobileCloseIcon?.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function closeMobileSidebar() {
    if (isMobileOpen) toggleMobileSidebar();
  }

  mobileButton?.addEventListener('click', toggleMobileSidebar);
  mobileCloseButton?.addEventListener('click', closeMobileSidebar);
  mobileOverlay?.addEventListener('click', closeMobileSidebar);

  mobileSidebar?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileSidebar);
  });

  // LEARN: Resize handler bridges desktop/mobile — closing the sidebar on
  // wider viewports and closing dropdowns on narrower ones prevents stale UI.
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMobileSidebar();
    } else {
      gardenDropdown?.close();
      aboutDropdown?.close();
    }
  });
}

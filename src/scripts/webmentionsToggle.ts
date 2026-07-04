/**
 * Webmentions "Show more / Show less" toggle: reveals replies beyond the first
 * four and swaps the button label. Guards each button so re-inits don't rebind.
 */
export function initWebmentionsToggle() {
  document.querySelectorAll<HTMLButtonElement>('.wm-show-more').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    let expanded = false;
    btn.addEventListener('click', () => {
      const container = btn.closest('.wm-mentions-section');
      const replies = container?.querySelectorAll('.wm-reply');
      if (!replies) return;

      expanded = !expanded;
      replies.forEach((reply, i) => {
        if (i >= 4) reply.classList.toggle('wm-hidden', !expanded);
      });

      const total = parseInt(btn.dataset.total || '0');
      btn.textContent = expanded ? 'Show less' : `Show ${total - 4} more`;
    });
  });
}

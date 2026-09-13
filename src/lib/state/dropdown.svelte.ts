/**
 * Reactive open/close state for a nav dropdown.
 *
 * LEARN: this replaces the closure factory in scripts/navigation.ts. Same shape,
 * but the state is reactive, so the template derives its classes instead of the
 * script reaching into classList.
 *
 * `hidden` deliberately lags `open` by the transition duration. The panel fades
 * and slides back behind the nav pill first, and only then leaves layout flow —
 * adding `hidden` (display:none) immediately would cut the transition off
 * mid-flight. The e2e suite asserts exactly this: it waits for the `hidden` class
 * as the end state.
 */
export class Dropdown {
  open = $state(false);
  hidden = $state(true);

  #timer: ReturnType<typeof setTimeout> | undefined;
  readonly #delayMs: number;

  /**
   * LEARN: 260ms is not arbitrary — it is the panel's transition duration, taken
   * from the design file (which animates transform at 260ms). `hidden` applies
   * display:none, so if this lag were shorter the panel would vanish mid-slide and
   * the retract would snap. Raise one and you must raise the other.
   */
  constructor(delayMs = 260) {
    this.#delayMs = delayMs;
  }

  show(): void {
    clearTimeout(this.#timer);
    this.open = true;
    this.hidden = false;
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      // Re-check: the reader may have re-opened it inside the delay window.
      if (!this.open) this.hidden = true;
    }, this.#delayMs);
  }

  // LEARN: hover menus need a grace window so the pointer can cross the gap
  // between the trigger and the panel. `show()` clears this timer, so entering
  // the panel cancels the pending close. Click-outside still calls `close()`
  // immediately, so the e2e "ends up hidden" contract is unchanged.
  scheduleClose(): void {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.close(), this.#delayMs);
  }

  /** Clear the pending timer so a destroyed island can't write state later. */
  destroy(): void {
    clearTimeout(this.#timer);
  }
}

/**
 * Move an element to <body> for as long as the component lives.
 *
 * LEARN: a position:fixed element positions against the nearest TRANSFORMED
 * ancestor, not the viewport — and article content sits inside transformed
 * wrappers. The old lightbox solved this by calling document.body.appendChild
 * on itself during init, which left the node stranded after a view transition
 * because nothing ever moved it back. As an action the move is scoped to the
 * component's lifetime: destroy() removes the node, so nothing is orphaned.
 */
export function portal(node: HTMLElement) {
  document.body.appendChild(node);
  return {
    destroy() {
      node.remove();
    },
  };
}

/**
 * Svelte action to focus an element programmatically upon mounting.
 * This is an accessible alternative to the html autofocus attribute.
 * 
 * @param node The element to focus.
 * @param enabled Whether focus should be applied. Defaults to true.
 */
export function focus(node: HTMLElement, enabled: boolean | null | undefined = true) {
  if (enabled) {
    // Use requestAnimationFrame to ensure any rendering lifecycle completes
    // and the element is fully interactive and visible before focusing.
    requestAnimationFrame(() => {
      node.focus();
    });
  }
}

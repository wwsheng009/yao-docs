/**
 * List Component Script
 * Handles list operations for the List component test
 */

/**
 * Reverses the list items
 */
function reverse(ctx) {
  if (!ctx) {
    console.error('reverse called without context');
    return;
  }

  const items = ctx.tui.GetState('items') || [];
  const reversedItems = [...items].reverse();
  ctx.tui.SetState('items', reversedItems);
  ctx.tui.Refresh();
}

export { reverse };

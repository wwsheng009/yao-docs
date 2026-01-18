/**
 * Counter Script for TUI
 *
 * This script demonstrates basic TUI scripting with state management.
 * It provides increment, decrement, and reset export functions for a counter.
 */

/**
 * Increment the counter by 1
 * @param {Object} ctx - The TUI context object
 */
export function increment(ctx) {
  if (!ctx.tui) {
    console.log('increment called without TUI context');
    return;
  }

  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count + 1);
}

/**
 * Decrement the counter by 1
 * @param {Object} ctx - The TUI context object
 */
export function decrement(ctx) {
  if (!ctx.tui) {
    console.log('decrement called without TUI context');
    return;
  }

  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count - 1);
}

/**
 * Reset the counter to 0
 * @param {Object} ctx - The TUI context object
 */
export function reset(ctx) {
  if (!ctx.tui) {
    console.log('reset called without TUI context');
    return;
  }

  ctx.tui.SetState('count', 0);
}

/**
 * Add a specific value to the counter
 * @param {Object} ctx - The TUI context object
 * @param {number} value - The value to add
 */
export function add(ctx, value) {
  if (!ctx.tui) {
    console.log('add called without TUI context');
    return;
  }

  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count + (value || 0));
}

/**
 * Get the current count (for testing)
 * @param {Object} ctx - The TUI context object
 * @returns {number} The current count
 */
export function getCount(ctx) {
  if (!ctx.tui) {
    return 0;
  }

  return ctx.tui.GetState('count') || 0;
}

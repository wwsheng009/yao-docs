/**
 * Help Component Script
 * Handles help display for the Help component test
 */

let helpVisible = true;

/**
 * Toggles help visibility
 */
function toggle(ctx) {
  if (!ctx) {
    console.error('toggle called without context');
    return;
  }

  helpVisible = !helpVisible;

  // Toggle help section visibility by updating state
  // In a real implementation, this would show/hide the help
  console.log(`Help visibility: ${helpVisible}`);

  ctx.tui.Refresh();
}

export { toggle };

/**
 * Cursor Component Script
 * Handles cursor display for the Cursor component test
 */

const CURSOR_STYLES = ['block', 'underline', 'bar'];
let currentStyleIndex = 0;

/**
 * Toggles cursor visibility
 */
function toggleVisible(ctx) {
  if (!ctx) {
    console.error('toggleVisible called without context');
    return;
  }

  let cursorVisible = ctx.tui.GetState('cursorVisible') || true;
  cursorVisible = !cursorVisible;

  ctx.tui.UpdateState({
    cursorVisible: cursorVisible
  });
  ctx.tui.Refresh();
}

/**
 * Cycles through cursor styles
 */
function cycleStyle(ctx) {
  if (!ctx) {
    console.error('cycleStyle called without context');
    return;
  }

  currentStyleIndex = (currentStyleIndex + 1) % CURSOR_STYLES.length;
  const cursorStyle = CURSOR_STYLES[currentStyleIndex];

  ctx.tui.UpdateState({
    cursorStyle: cursorStyle
  });
  ctx.tui.Refresh();
}

export { toggleVisible, cycleStyle };

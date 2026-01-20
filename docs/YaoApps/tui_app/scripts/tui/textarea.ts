/**
 * Textarea Component Script
 * Handles multi-line input for the Textarea component test
 */

/**
 * Clears the textarea content
 */
function clear(ctx) {
  if (!ctx) {
    console.error('clear called without context');
    return;
  }

  ctx.tui.SetState('message-input', '');
  ctx.tui.Refresh();
}

/**
 * Loads sample text into the textarea
 */
function loadSample(ctx) {
  if (!ctx) {
    console.error('loadSample called without context');
    return;
  }

  const sampleText =
    'This is a sample text that spans multiple lines.\n\nLine 1\nLine 2\nLine 3\n\nParagraph 2 with more content to test scrolling.';
  ctx.tui.SetState('message-input', sampleText);
  ctx.tui.Refresh();
}

export { clear, loadSample };

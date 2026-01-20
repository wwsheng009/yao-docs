/**
 * FilePicker Component Script
 * Handles file picker operations for the FilePicker component test
 */

let showHidden = false;

/**
 * Toggles hidden files visibility
 */
function toggleHidden(ctx) {
  if (!ctx) {
    console.error('toggleHidden called without context');
    return;
  }

  showHidden = !showHidden;

  // In a real implementation, this would refresh the file list
  // with or without hidden files
  console.log(`Show hidden files: ${showHidden}`);

  ctx.tui.UpdateState({
    showHidden: showHidden
  });
  ctx.tui.Refresh();
}

export { toggleHidden };

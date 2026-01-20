/**
 * Progress Component Script
 * Handles progress bar operations for the Progress component test
 */

/**
 * Increases the progress percentage
 */
function increase(ctx) {
  if (!ctx) {
    console.error('increase called without context');
    return;
  }

  let progress = ctx.tui.GetState('progress') || 0;
  const maxProgress = ctx.tui.GetState('maxProgress') || 100;

  progress = Math.min(progress + 10, maxProgress);

  let status = 'Ready';
  if (progress > 0 && progress < maxProgress) {
    status = 'In Progress';
  } else if (progress >= maxProgress) {
    status = 'Completed';
  }

  ctx.tui.UpdateState({
    progress: progress,
    status: status
  });
  ctx.tui.Refresh();
}

/**
 * Decreases the progress percentage
 */
function decrease(ctx) {
  if (!ctx) {
    console.error('decrease called without context');
    return;
  }

  let progress = ctx.tui.GetState('progress') || 0;
  const maxProgress = ctx.tui.GetState('maxProgress') || 100;

  progress = Math.max(progress - 10, 0);

  let status = 'Ready';
  if (progress > 0 && progress < maxProgress) {
    status = 'In Progress';
  } else if (progress >= maxProgress) {
    status = 'Completed';
  }

  ctx.tui.UpdateState({
    progress: progress,
    status: status
  });
  ctx.tui.Refresh();
}

/**
 * Resets the progress to 0
 */
function reset(ctx) {
  if (!ctx) {
    console.error('reset called without context');
    return;
  }

  ctx.tui.UpdateState({
    progress: 0,
    status: 'Ready'
  });
  ctx.tui.Refresh();
}

export { increase, decrease, reset };

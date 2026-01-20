/**
 * Timer Component Script
 * Handles countdown timer operations for the Timer component test
 */

/**
 * Toggles the timer between running and paused
 */
function toggle(ctx) {
  if (!ctx) {
    console.error('toggle called without context');
    return;
  }

  let isRunning = ctx.tui.GetState('isRunning') || false;
  isRunning = !isRunning;

  ctx.tui.UpdateState({
    isRunning: isRunning,
    status: isRunning ? 'Running' : 'Stopped'
  });
  ctx.tui.Refresh();
}

/**
 * Resets the timer to initial state
 */
function reset(ctx) {
  if (!ctx) {
    console.error('reset called without context');
    return;
  }

  ctx.tui.UpdateState({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    status: 'Stopped'
  });
  ctx.tui.Refresh();
}

/**
 * Adds 10 seconds to the timer
 */
function addTime(ctx) {
  if (!ctx) {
    console.error('addTime called without context');
    return;
  }

  let seconds = ctx.tui.GetState('seconds') || 0;
  let minutes = ctx.tui.GetState('minutes') || 0;

  seconds += 10;

  if (seconds >= 60) {
    seconds = seconds % 60;
    minutes += Math.floor(seconds / 60);
  }

  ctx.tui.UpdateState({
    minutes: minutes,
    seconds: seconds,
    status: 'Running'
  });
  ctx.tui.Refresh();
}

/**
 * Removes 10 seconds from the timer
 */
function removeTime(ctx) {
  if (!ctx) {
    console.error('removeTime called without context');
    return;
  }

  let seconds = ctx.tui.GetState('seconds') || 0;
  let minutes = ctx.tui.GetState('minutes') || 0;

  seconds -= 10;

  if (seconds < 0) {
    minutes -= 1;
    if (minutes < 0) {
      minutes = 0;
      seconds = 0;
    } else {
      seconds = 60 + seconds;
    }
  }

  ctx.tui.UpdateState({
    minutes: minutes,
    seconds: seconds,
    status: 'Running'
  });
  ctx.tui.Refresh();
}

export { toggle, reset, addTime, removeTime };

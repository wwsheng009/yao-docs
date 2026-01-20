/**
 * Stopwatch Component Script
 * Handles stopwatch operations for the Stopwatch component test
 */

/**
 * Toggles the stopwatch between running and paused
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
 * Resets the stopwatch to initial state
 */
function reset(ctx) {
  if (!ctx) {
    console.error('reset called without context');
    return;
  }

  ctx.tui.UpdateState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    isRunning: false,
    status: 'Stopped',
    laps: []
  });
  ctx.tui.Refresh();
}

/**
 * Records a lap time
 */
function lap(ctx) {
  if (!ctx) {
    console.error('lap called without context');
    return;
  }

  const isRunning = ctx.tui.GetState('isRunning') || false;
  if (!isRunning) {
    console.warn('Cannot record lap: stopwatch is not running');
    return;
  }

  const lapTime = {
    hours: ctx.tui.GetState('hours') || 0,
    minutes: ctx.tui.GetState('minutes') || 0,
    seconds: ctx.tui.GetState('seconds') || 0,
    milliseconds: ctx.tui.GetState('milliseconds') || 0
  };

  const laps = ctx.tui.GetState('laps') || [];
  laps.push(lapTime);

  ctx.tui.SetState('laps', laps);
  ctx.tui.Refresh();
}

export { toggle, reset, lap };

/**
 * Table demo script
 */

/**
 * Quit the table application
 * @param ctx - The TUI context
 */
export function quit(ctx: any) {
  if (ctx && ctx.tui) {
    ctx.tui.Quit();
  }
}

/**
 * Add a new user to the table
 * @param ctx - The TUI context
 */
export function addUser(ctx: any) {
  if (!ctx || !ctx.tui) {
    console.log('addUser called without valid context');
    return;
  }

  const users = ctx.tui.GetState('users') || [];
  const newId =
    users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    name: `New User ${newId}`,
    email: `user${newId}@example.com`,
    role: 'User'
  };

  const updatedUsers = [...users, newUser];

  ctx.tui.SetState('users', updatedUsers);
}

/**
 * Remove the last user from the table
 * @param ctx - The TUI context
 */
export function removeUser(ctx: any) {
  if (!ctx || !ctx.tui) {
    console.log('removeUser called without valid context');
    return;
  }

  const users = ctx.tui.GetState('users') || [];

  if (users.length > 0) {
    const updatedUsers = users.slice(0, -1);
    ctx.tui.SetState('users', updatedUsers);
  }
}

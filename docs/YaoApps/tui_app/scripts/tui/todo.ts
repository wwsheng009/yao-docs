declare var log: {
  Debug(message: string, ...args: any[]): void;
  Info(message: string, ...args: any[]): void;
  Warn(message: string, ...args: any[]): void;
  Error(message: string, ...args: any[]): void;
};

/**
 * Todo 应用示例脚本
 * 演示如何在 TUI 中使用 JavaScript/TypeScript 脚本
 */

/**
 * 添加新的待办事项
 * @param {Object} ctx - TUI 上下文对象
 * @param {string} item - 待办事项文本
 */
export function addItem(ctx, item) {
  if (!ctx.tui) {
    log.Debug('addItem called without TUI context');
    return;
  }

  // 如果没有提供项目，则使用当前输入框的值
  if (!item) {
    item = ctx.tui.GetState('input') || '';
  }

  if (!item.trim()) {
    log.Debug('Cannot add empty todo item');
    return;
  }

  // 获取当前待办事项列表
  const todos = ctx.tui.GetState('todos') || [];

  // 添加新项目
  todos.push({
    id: Date.now(),
    text: item.trim(),
    completed: false
  });

  // 更新状态
  ctx.tui.SetState('todos', todos);

  // 清空输入框
  ctx.tui.SetState('input', '');

  log.Debug(`Added todo: ${item}`);
}

/**
 * 切换待办事项完成状态
 * @param {Object} ctx - TUI 上下文对象
 * @param {number} id - 待办事项 ID
 */
export function toggleItem(ctx, id) {
  if (!ctx.tui) {
    log.Debug('toggleItem called without TUI context');
    return;
  }

  // 如果没有提供ID，尝试从按键上下文中获取（如t1, t2等）
  if (id === undefined) {
    log.Debug('toggleItem called without ID');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const updatedTodos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  ctx.tui.SetState('todos', updatedTodos);

  log.Debug(`Toggled todo ${id} completion status`);
}

/**
 * 删除待办事项
 * @param {Object} ctx - TUI 上下文对象
 * @param {number} id - 待办事项 ID
 */
export function deleteItem(ctx, id) {
  if (!ctx.tui) {
    log.Debug('deleteItem called without TUI context');
    return;
  }

  // 如果没有提供ID，尝试从按键上下文中获取（如d1, d2等）
  if (id === undefined) {
    log.Debug('deleteItem called without ID');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const filteredTodos = todos.filter((todo) => todo.id !== id);

  ctx.tui.SetState('todos', filteredTodos);

  log.Debug(`Deleted todo ${id}`);
}

/**
 * 清除所有已完成的待办事项
 * @param {Object} ctx - TUI 上下文对象
 */
export function clearCompleted(ctx) {
  if (!ctx.tui) {
    log.Debug('clearCompleted called without TUI context');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const activeTodos = todos.filter((todo) => !todo.completed);

  ctx.tui.SetState('todos', activeTodos);

  log.Debug('Cleared completed todos');
}

/**
 * 设置输入框的值
 * @param {Object} ctx - TUI 上下文对象
 * @param {string} value - 输入值
 */
export function setInput(ctx, value) {
  log.Debug('setInput called');
  log.Debug(JSON.stringify(ctx));

  log.Debug('type of ctx.:', typeof ctx);
  log.Debug('type of ctx.tui:', typeof ctx.tui);
  log.Debug('type of ctx.tui.SetState:', typeof ctx.tui.SetState);

  if (!ctx.tui) {
    log.Debug('setInput called without TUI context');
    return;
  }

  // 如果提供了值，则设置输入框
  if (value !== undefined) {
    ctx.tui.SetState('input', value);
    log.Debug(`Set input to: ${value}`);
  } else {
    // 如果没有提供值，可能是想开启编辑模式或清空输入框
    // 这里我们可以清空输入框并准备输入新内容
    ctx.tui.SetState('input', '');
    log.Debug('Cleared input field');

    // 可以添加更多编辑逻辑，例如弹出输入提示等
    // 目前我们只是清空输入框
  }
}

/**
 * 开始编辑指定的待办事项
 * @param {Object} ctx - TUI 上下文对象
 * @param {number} id - 待办事项 ID
 */
export function startEdit(ctx, id) {
  log.Debug('startEdit called');

  if (!ctx.tui) {
    log.Debug('startEdit called without TUI context');
    return;
  }

  if (id === undefined) {
    log.Debug('startEdit called without ID');
    // 如果没有ID，可以默认编辑第一个项目或显示错误
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const todoToEdit = todos.find((todo) => todo.id === id);

  if (!todoToEdit) {
    log.Debug(`Todo with ID ${id} not found`);
    return;
  }

  // 将待编辑的项目内容设置到输入框
  ctx.tui.SetState('input', todoToEdit.text);
  // 设置当前编辑的项目ID
  ctx.tui.SetState('editingId', id);

  log.Debug(`Started editing todo ${id}: ${todoToEdit.text}`);
}

/**
 * 完成编辑并保存更改
 * @param {Object} ctx - TUI 上下文对象
 */
export function saveEdit(ctx) {
  log.Debug('saveEdit called');

  if (!ctx.tui) {
    log.Debug('saveEdit called without TUI context');
    return;
  }

  // 从输入框获取当前文本
  const inputText = ctx.tui.GetState('input');

  if (!inputText || !inputText.trim()) {
    log.Debug('Cannot save empty todo text');
    return;
  }

  // 获取当前正在编辑的项目ID
  const editingId = ctx.tui.GetState('editingId');

  if (!editingId) {
    log.Debug('No item is currently being edited');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const updatedTodos = todos.map((todo) =>
    todo.id === editingId ? { ...todo, text: inputText.trim() } : todo
  );

  ctx.tui.SetState('todos', updatedTodos);
  // 清除编辑状态
  ctx.tui.SetState('editingId', null);
  ctx.tui.SetState('input', '');

  log.Debug(`Saved edit for todo ${editingId}: ${inputText}`);
}

/**
 * 取消编辑
 * @param {Object} ctx - TUI 上下文对象
 */
export function cancelEdit(ctx) {
  log.Debug('cancelEdit called');

  if (!ctx.tui) {
    log.Debug('cancelEdit called without TUI context');
    return;
  }

  // 清除编辑状态
  ctx.tui.SetState('editingId', null);
  ctx.tui.SetState('input', '');

  log.Debug('Cancelled editing');
}

/**
 * 标记所有待办事项为完成
 * @param {Object} ctx - TUI 上下文对象
 */
export function markAllComplete(ctx) {
  if (!ctx.tui) {
    log.Debug('markAllComplete called without TUI context');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const completedTodos = todos.map((todo) => ({ ...todo, completed: true }));

  ctx.tui.SetState('todos', completedTodos);

  log.Debug('Marked all todos as complete');
}

/**
 * 获取统计信息
 * @param {Object} ctx - TUI 上下文对象
 */
export function getStats(ctx) {
  if (!ctx.tui) {
    log.Debug('getStats called without TUI context');
    return null;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const active = total - completed;

  const stats = { total, completed, active };
  ctx.tui.SetState('stats', stats);

  log.Debug(
    `Stats - Total: ${total}, Completed: ${completed}, Active: ${active}`
  );
  return stats;
}

/**
 * 退出应用
 * @param {Object} ctx - TUI 上下文对象
 */
export function quit(ctx) {
  if (!ctx.tui) {
    log.Debug('quit called without TUI context');
    return;
  }

  log.Debug('Quitting application');

  // 使用TUI的Quit方法退出应用
  ctx.tui.Quit();
}

/**
 * 显示编辑帮助信息
 * @param {Object} ctx - TUI 上下文对象
 */
export function showEditHelp(ctx) {
  log.Debug('showEditHelp called');

  if (!ctx.tui) {
    log.Debug('showEditHelp called without TUI context');
    return;
  }

  // 显示编辑相关的帮助信息，可能通过临时状态显示
  ctx.tui.SetState(
    'helpMessage',
    'Edit mode: Use i1, i2, etc. to edit specific items'
  );

  log.Debug('Displayed edit help message');
}

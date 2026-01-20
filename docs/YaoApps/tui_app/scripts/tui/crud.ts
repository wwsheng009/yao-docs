/**
 * CRUD Component Script
 * Handles CRUD operations for the CRUD component test
 */

/**
 * Creates a new item
 */
function newItem(ctx) {
  if (!ctx) {
    console.error('newItem called without context');
    return;
  }

  const items = ctx.tui.GetState('items') || [];
  const newId = Math.max(...items.map((item) => item.id)) + 1;

  const newItem = {
    id: newId,
    name: 'New User',
    email: `user${newId}@example.com`,
    role: 'User'
  };

  items.push(newItem);
  ctx.tui.UpdateState({
    items: items,
    mode: 'add'
  });
  ctx.tui.Refresh();
}

/**
 * Edits the selected item
 */
function editItem(ctx) {
  if (!ctx) {
    console.error('editItem called without context');
    return;
  }

  const selectedItem = ctx.tui.GetState('selectedItem');
  if (!selectedItem) {
    console.warn('No item selected for editing');
    return;
  }

  // In a real implementation, this would open a form to edit the item
  // For this test, we'll just toggle edit mode
  const isEditMode = ctx.tui.GetState('editMode') || false;
  ctx.tui.UpdateState({
    editMode: !isEditMode,
    mode: isEditMode ? 'list' : 'edit'
  });
  ctx.tui.Refresh();
}

/**
 * Deletes the selected item
 */
function deleteItem(ctx) {
  if (!ctx) {
    console.error('deleteItem called without context');
    return;
  }

  const selectedItem = ctx.tui.GetState('selectedItem');
  if (!selectedItem) {
    console.warn('No item selected for deletion');
    return;
  }

  const items = ctx.tui.GetState('items') || [];
  const filteredItems = items.filter((item) => item.id !== selectedItem.id);

  ctx.tui.UpdateState({
    items: filteredItems,
    selectedItem: null,
    editMode: false,
    mode: 'list'
  });
  ctx.tui.Refresh();
}

export { newItem, editItem, deleteItem };

/**
 * TUI List Script
 * Handles the TUI list display and selection
 */

/**
 * Shows the command to run the selected TUI
 */
function runSelected(ctx) {
  if (!ctx) {
    console.error('runSelected called without context');
    return;
  }

  const selectedItem = ctx.tui.GetState('tuiList_selected_item');
  if (selectedItem && selectedItem.value) {
    const tuiID = selectedItem.value.id;
    console.log('');
    console.log('To run the selected TUI, use:');
    console.log(`  yao tui ${tuiID}`);
    console.log('');
    ctx.tui.Quit();
  }
}

/**
 * Populates the TUI list with available TUIs
 * This is called during initialization
 */
function loadTUIList(ctx) {
  if (!ctx) {
    console.error('loadTUIList called without context');
    return;
  }

  // Get all available TUI configurations
  const tuiIDs = process.tui.list();
  const items = [];

  for (const id of tuiIDs) {
    const cfg = process.tui.get(id);
    items.push({
      id: id,
      title: cfg && cfg.name ? `${id} - ${cfg.name}` : id,
      description: cfg && cfg.name ? cfg.name : '',
      value: { id, name: cfg?.name || '' }
    });
  }

  ctx.tui.SetState('items', items);
  ctx.tui.Refresh();
}

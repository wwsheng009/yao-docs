/**
 * Paginator Component Script
 * Handles pagination operations for the Paginator component test
 */

const SPINNER_TYPES = [
  'dots',
  'line',
  'arrow',
  'miniDot',
  'jump',
  'points',
  'globe',
  'moon'
];

/**
 * Moves to the next page
 */
function nextPage(ctx) {
  if (!ctx) {
    console.error('nextPage called without context');
    return;
  }

  let currentPage = ctx.tui.GetState('currentPage') || 1;
  const totalPages = ctx.tui.GetState('totalPages') || 10;

  if (currentPage < totalPages) {
    currentPage++;
    const startItem =
      (currentPage - 1) * (ctx.tui.GetState('itemsPerPage') || 10) + 1;
    const endItem = Math.min(
      startItem + (ctx.tui.GetState('itemsPerPage') || 10) - 1,
      ctx.tui.GetState('totalItems') || 95
    );

    ctx.tui.UpdateState({
      currentPage: currentPage,
      startItem: startItem,
      endItem: endItem
    });
    ctx.tui.Refresh();
  }
}

/**
 * Moves to the previous page
 */
function prevPage(ctx) {
  if (!ctx) {
    console.error('prevPage called without context');
    return;
  }

  let currentPage = ctx.tui.GetState('currentPage') || 1;

  if (currentPage > 1) {
    currentPage--;
    const startItem =
      (currentPage - 1) * (ctx.tui.GetState('itemsPerPage') || 10) + 1;
    const endItem = Math.min(
      startItem + (ctx.tui.GetState('itemsPerPage') || 10) - 1,
      ctx.tui.GetState('totalItems') || 95
    );

    ctx.tui.UpdateState({
      currentPage: currentPage,
      startItem: startItem,
      endItem: endItem
    });
    ctx.tui.Refresh();
  }
}

/**
 * Jumps to the first page
 */
function firstPage(ctx) {
  if (!ctx) {
    console.error('firstPage called without context');
    return;
  }

  const itemsPerPage = ctx.tui.GetState('itemsPerPage') || 10;

  ctx.tui.UpdateState({
    currentPage: 1,
    startItem: 1,
    endItem: itemsPerPage
  });
  ctx.tui.Refresh();
}

/**
 * Jumps to the last page
 */
function lastPage(ctx) {
  if (!ctx) {
    console.error('lastPage called without context');
    return;
  }

  const totalPages = ctx.tui.GetState('totalPages') || 10;
  const totalItems = ctx.tui.GetState('totalItems') || 95;
  const itemsPerPage = ctx.tui.GetState('itemsPerPage') || 10;
  const startItem = (totalPages - 1) * itemsPerPage + 1;

  ctx.tui.UpdateState({
    currentPage: totalPages,
    startItem: startItem,
    endItem: totalItems
  });
  ctx.tui.Refresh();
}

export { nextPage, prevPage, firstPage, lastPage };

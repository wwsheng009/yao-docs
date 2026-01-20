/**
 * Event System Test Script
 * Handles event publishing and subscription
 */

/**
 * Triggers a selected event
 */
function triggerEvent(ctx) {
  if (!ctx) {
    console.error('triggerEvent called without context');
    return;
  }

  const selectedEvent = ctx.tui.GetState('selectedEvent');
  if (!selectedEvent) {
    console.warn('No event selected');
    return;
  }

  // Publish the event
  const timestamp = new Date().toISOString();
  ctx.tui.PublishEvent('eventTest', selectedEvent.type, {
    ...selectedEvent,
    timestamp: timestamp
  });

  // Add to event log
  const eventLog = ctx.tui.GetState('eventLog') || [];
  eventLog.push({
    id: eventLog.length + 1,
    timestamp: timestamp,
    event: selectedEvent.type,
    data: selectedEvent.data
  });

  ctx.tui.UpdateState({
    eventLog: eventLog
  });
  ctx.tui.Refresh();

  console.log(`Event triggered: ${selectedEvent.type}`);
}

// Subscribe to events when the component loads
export function init(ctx) {
  if (!ctx) {
    console.error('init called without context');
    return;
  }

  // Subscribe to table selection events
  ctx.tui.SubscribeToEvent('ROW_SELECTED', (msg) => {
    console.log('Row selected event:', msg.data.rowIndex);

    // When a row is selected, trigger the corresponding event
    const events = ctx.tui.GetState('events') || [];
    const selectedEvent = events[msg.data.rowIndex];

    if (selectedEvent) {
      ctx.tui.SetState('selectedEvent', selectedEvent);
      console.log('Event selected:', selectedEvent.type);
    }
  });
}

export { triggerEvent, init };

/**
 * Multi-Form Component Script
 * Handles multi-field form operations
 */

/**
 * Submits the form data
 */
function submit(ctx) {
  if (!ctx) {
    console.error('submit called without context');
    return;
  }

  const formData = ctx.tui.GetState('formData') || {};

  // Validate form data
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!formData.email.includes('@')) {
    errors.email = 'Email must contain @';
  }

  if (Object.keys(errors).length > 0) {
    ctx.tui.SetState('errors', errors);
    console.log('Form validation errors:', errors);
  } else {
    ctx.tui.UpdateState({
      submitted: true,
      errors: {}
    });
    console.log('Form submitted successfully:', formData);
  }

  ctx.tui.Refresh();
}

/**
 * Clears the form
 */
function clear(ctx) {
  if (!ctx) {
    console.error('clear called without context');
    return;
  }

  ctx.tui.UpdateState({
    formData: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zip: ''
    },
    submitted: false,
    errors: {}
  });
  ctx.tui.Refresh();
}

export { submit, clear };

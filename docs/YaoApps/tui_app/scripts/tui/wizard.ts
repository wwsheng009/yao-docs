/**
 * Wizard Component Script
 * Handles multi-step wizard operations
 */

/**
 * Moves to the next wizard step
 */
function next(ctx) {
  if (!ctx) {
    console.error('next called without context');
    return;
  }

  let currentStep = ctx.tui.GetState('currentStep') || 1;
  const totalSteps = ctx.tui.GetState('totalSteps') || 3;
  const wizardData = ctx.tui.GetState('wizardData') || {};

  // Validate current step before proceeding
  let canProceed = true;

  if (currentStep === 1) {
    if (!wizardData.step1.name || wizardData.step1.name.trim().length === 0) {
      canProceed = false;
    } else if (
      !wizardData.step1.email ||
      wizardData.step1.email.trim().length === 0
    ) {
      canProceed = false;
    }
  }

  if (canProceed && currentStep < totalSteps) {
    currentStep++;
    ctx.tui.UpdateState({
      currentStep: currentStep
    });
  } else if (!canProceed) {
    console.warn('Cannot proceed: validation failed');
  }

  ctx.tui.Refresh();
}

/**
 * Moves to the previous wizard step
 */
function previous(ctx) {
  if (!ctx) {
    console.error('previous called without context');
    return;
  }

  let currentStep = ctx.tui.GetState('currentStep') || 1;

  if (currentStep > 1) {
    currentStep--;
    ctx.tui.UpdateState({
      currentStep: currentStep
    });
    ctx.tui.Refresh();
  }
}

export { next, previous };

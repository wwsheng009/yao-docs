/**
 * Chat application script
 */

/**
 * Quit the chat application
 * @param ctx - The TUI context
 */
function quit(ctx: any) {
  if (ctx && ctx.tui) {
    ctx.tui.Quit();
  }
}

/**
 * Send a message in the chat
 * @param ctx - The TUI context
 */
function sendMessage(ctx: any) {
  if (!ctx || !ctx.tui) {
    console.log('sendMessage called without valid context');
    return;
  }

  // Get current input value
  const input = ctx.tui.GetState('input') || '';

  if (!input.trim()) {
    console.log('No message to send');
    return;
  }

  // Get current messages
  const messages = ctx.tui.GetState('messages') || [];

  // Add user message
  const userMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: input,
    timestamp: new Date().toISOString()
  };

  const updatedMessages = [...messages, userMessage];

  // Update state with new message
  ctx.tui.UpdateState({
    messages: updatedMessages,
    input: '' // Clear input field
  });

  // Simulate AI response after a delay
  setTimeout(() => {
    simulateAIResponse(ctx);
  }, 1000);
}

/**
 * Simulate AI response
 * @param ctx - The TUI context
 */
function simulateAIResponse(ctx: any) {
  if (!ctx || !ctx.tui) {
    return;
  }

  const aiResponses = [
    'I understand your question.',
    "That's an interesting point.",
    'Let me think about that.',
    'I can help you with that.',
    'Thanks for sharing that with me.',
    'I see what you mean.'
  ];

  const randomResponse =
    aiResponses[Math.floor(Math.random() * aiResponses.length)];

  // Get current messages
  const messages = ctx.tui.GetState('messages') || [];

  // Add AI message
  const aiMessage = {
    id: `ai_${Date.now()}`,
    role: 'assistant',
    content: randomResponse,
    timestamp: new Date().toISOString()
  };

  const updatedMessages = [...messages, aiMessage];

  // Update state with AI response
  ctx.tui.UpdateState({
    messages: updatedMessages
  });
}

// Export functions
export { quit, sendMessage, simulateAIResponse };

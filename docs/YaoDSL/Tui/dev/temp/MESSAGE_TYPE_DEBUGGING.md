# Message Type Debugging Improvement

## Problem

When processing TUI messages, the system would log "unknown" for any message type not explicitly handled in the `getMsgTypeName` function. This made debugging difficult because:

1. No information about what type of message was being received
2. Hard to identify missing message handlers
3. Difficult to understand component interactions

Example of problematic logs:

```
TUI Update: Received message of type unknown
TUI Update: No handler found for message type unknown, broadcasting to all components
```

## Solution

Modified the `getMsgTypeName` function in `message_handlers.go` to return the actual message type name using Go's reflection (`fmt.Sprintf("%T", msg)`) instead of the generic "unknown" string.

### Changes Made

1. **Added `fmt` package import** to support type reflection
2. **Updated `getMsgTypeName` function** to return actual type names for unknown messages

```go
// Before
default:
    return "unknown"
}

// After
default:
    // For unknown message types, return the actual type name for better debugging
    // This helps identify messages from components that are not in the switch
    // For example: bubbletea cursor.BlinkMsg, etc.
    if msg == nil {
        return "nil"
    }
    // Use the full type name including package path for maximum clarity
    return fmt.Sprintf("%T", msg)
}
```

## Benefits

### 1. Better Debugging

Now logs show the actual message type:

```
TUI Update: Received message of type tea.cursor.BlinkMsg
TUI Update: No handler found for message type tea.cursor.BlinkMsg, broadcasting to all components
```

### 2. Identify Missing Handlers

Easy to see which message types need handlers by looking at the logs.

### 3. Understand Component Interactions

Can trace message flow between components by seeing the exact message types.

### 4. Type Safety

Uses Go's reflection to provide accurate type information including full package paths.

## Common Unknown Message Types

After this fix, these previously "unknown" messages are now properly identified:

- `tea.cursor.BlinkMsg` - Cursor blinking events
- `tea.WindowSizeMsg` - Window resize events
- Custom component messages
- Third-party library messages

## Testing

Added comprehensive tests in `get_msg_type_name_test.go`:

- `TestGetMsgTypeName` - Tests all known message types
- `TestGetMsgTypeNameUnknownType` - Tests unknown message types return actual type names

Run tests with:

```bash
go test ./tui -v -run TestGetMsgTypeName
```

## Example Usage

When a component returns an unhandled message:

```go
// Component Update method
func (m *MyComponent) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    // Handle some messages
    if _, ok := msg.(tea.KeyMsg); ok {
        // ... handle key press
        return m, nil
    }

    // Return a custom message that's not in the global handlers
    return m, func() tea.Msg {
        return CustomComponentMessage{Data: "example"}
    }
}
```

The logs will now show:

```
TUI Update: Received message of type tui.CustomComponentMessage
TUI Update: No handler found for message type tui.CustomComponentMessage, broadcasting to all components
```

This makes it immediately clear what type of message is being handled and whether you need to add a handler for it.

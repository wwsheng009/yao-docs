# Cursor Component Optimization Summary

This document summarizes the optimizations applied to the cursor component in the Yao TUI project.

## Overview

The cursor component has been refactored to provide better integration with input components and simplify cursor management across forms.

## Key Changes

### 1. New CursorHelper Utility Class

**File**: `tui/components/cursor.go`

A new `CursorHelper` class has been introduced to simplify cursor management:

```go
type CursorHelper struct {
    config CursorConfig
    model  cursor.Model
}

func NewCursorHelper(config CursorConfig) *CursorHelper
func (h *CursorHelper) GetMode() cursor.Mode
func (h *CursorHelper) SetMode(mode cursor.Mode)
func (h *CursorHelper) GetChar() string
func (h *CursorHelper) SetChar(char string)
func (h *CursorHelper) SetVisible(visible bool)
func (h *CursorHelper) GetVisible() bool
```

**Benefits**:

- Simplified API for cursor control
- Encapsulates cursor behavior
- Easy to integrate with input components

### 2. Enhanced Input Component

**File**: `tui/components/input.go`

The `InputComponentWrapper` now integrates `CursorHelper`:

```go
type InputComponentWrapper struct {
    model        textinput.Model
    cursorHelper *CursorHelper  // NEW
    props        InputProps
    // ...
}
```

**New Properties**:

- `CursorMode`: "blink", "static", or "hide"
- `CursorChar`: Custom cursor character

**New Methods**:

- `SetCursorMode(mode string)`: Updates cursor mode
- `SetCursorChar(char string)`: Updates cursor character
- `GetCursorHelper() *CursorHelper`: Returns cursor helper instance
- `SetFocusBatch(focus bool) tea.Cmd`: Focus with cursor blink command

### 3. Form Component Cursor Management

**File**: `tui/components/form.go`

Form component now manages cursor settings for all input fields:

```go
type FormComponentWrapper struct {
    inputFields map[string]*InputComponentWrapper  // NEW
    props       FormProps
    // ...
}

type FormProps struct {
    // ... existing fields
    CursorMode string `json:"cursorMode"`  // NEW
    CursorChar string `json:"cursorChar"`  // NEW
    // ...
}
```

**New Methods**:

- `SetCursorMode(mode string)`: Updates cursor mode for all fields
- `SetCursorChar(char string)`: Updates cursor character for all fields
- `RegisterInputField(name string, field *InputComponentWrapper)`: Register field
- `GetInputField(name string) (*InputComponentWrapper, bool)`: Retrieve field

### 4. Simplified CursorComponentWrapper

**File**: `tui/components/cursor.go`

The `CursorComponentWrapper` now uses `CursorHelper` internally:

```go
type CursorComponentWrapper struct {
    helper   *CursorHelper  // Uses CursorHelper
    props    CursorProps
    // ...
}
```

This simplifies the implementation and reduces code duplication.

### 5. Helper Functions

**File**: `tui/components/cursor.go`

- `ParseCursorMode(style string) cursor.Mode`: Converts string to cursor mode
- `getCursorModeChar(style, customChar string) string`: Gets appropriate cursor character
- `getCursorChar(style, customChar string) string`: Gets cursor character (fixed logic)

## Usage Examples

### Input Component with Custom Cursor

```go
props := InputProps{
    Placeholder: "Enter your name",
    CursorMode:  "static",
    CursorChar:  "█",
}

wrapper := NewInputComponentWrapper(props, "name-input")

// Change cursor mode dynamically
wrapper.SetCursorMode("blink")
wrapper.SetCursorChar("|")
```

### Form with Unified Cursor

```go
props := FormProps{
    Title:      "User Settings",
    CursorMode: "blink",
    CursorChar: "|",
    Fields: []Field{
        {Type: "input", Name: "username", Label: "Username"},
        {Type: "input", Name: "email", Label: "Email"},
    },
}

form := NewFormComponentWrapper(props, "user-form")

// Register input fields
usernameField := NewInputComponentWrapper(InputProps{}, "username-field")
emailField := NewInputComponentWrapper(InputProps{}, "email-field")

form.RegisterInputField("username", usernameField)
form.RegisterInputField("email", emailField)

// Update cursor for all fields at once
form.SetCursorMode("static")
form.SetCursorChar("█")
```

### Using CursorHelper Directly

```go
config := CursorConfig{
    Mode:       cursor.CursorBlink,
    Char:       "|",
    BlinkSpeed: 530 * time.Millisecond,
    Visible:    true,
}

helper := NewCursorHelper(config)

// Dynamic updates
helper.SetMode(cursor.CursorStatic)
helper.SetChar("█")
helper.SetVisible(false)
```

## Migration Guide

### For Existing Input Components

If you have existing input components that use cursor directly:

**Before**:

```go
input.Cursor.SetMode(cursor.CursorBlink)
input.Cursor.SetChar("|")
```

**After**:

```go
wrapper.SetCursorMode("blink")
wrapper.SetCursorChar("|")
// or
wrapper.GetCursorHelper().SetMode(cursor.CursorBlink)
wrapper.GetCursorHelper().SetChar("|")
```

### For Form Components

**Before**:

```go
// Each field manages its own cursor
field1.Cursor.SetMode(mode)
field2.Cursor.SetMode(mode)
// ...
```

**After**:

```go
// Set for all fields at once
form.SetCursorMode(mode)
form.SetCursorChar(char)
```

## Testing

New test files:

- `cursor_helper_test.go`: Tests for CursorHelper utility
- Tests for InputComponentWrapper cursor methods
- Tests for FormComponentWrapper cursor management

All tests pass:

```bash
cd tui/components
go test -v
```

## Benefits

1. **Simplicity**: CursorHelper provides a clean API for cursor management
2. **Consistency**: Form components can manage cursor settings uniformly
3. **Flexibility**: Dynamic cursor mode changes without recreating components
4. **Integration**: Better integration with Bubbles cursor library
5. **Maintainability**: Reduced code duplication, centralized cursor logic

## Backward Compatibility

- Existing `CursorModel` and `CursorComponentWrapper` are still available
- Marked as DEPRECATED for future removal
- New code should use `CursorHelper` instead

## Performance Considerations

- CursorHelper is lightweight, no significant overhead
- Form cursor management is O(n) where n is number of fields
- Cursor operations are cached and apply changes immediately

## Future Improvements

1. Add cursor animation support
2. Theme integration for cursor styles
3. Cursor position tracking across focus changes
4. Default cursor settings per form type
5. Cursor accessibility features (slower blink, larger characters)

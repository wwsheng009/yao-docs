# List Component Keyboard Navigation Issue

## Problem

When running a TUI with a list component, pressing arrow keys (up/down) shows:

```
time="2026-01-20T19:40:32+08:00" level=trace msg="TUI: handleBoundActions: checking bindings for key=\"down\""
time="2026-01-20T19:40:32+08:00" level=trace msg="TUI: No binding found for key: \"down\""
time="2026-01-20T19:40:32+08:00" level=trace msg="TUI: Component itemList returned: handled=false"
```

The list does not respond to keyboard navigation.

## Root Cause

The list component has **two levels of focus** that need to be synchronized:

1. **Global Focus (`model.CurrentFocus`)**: Tracks which component is currently focused at the TUI model level
2. **Component Focus (`component.GetFocus()` / `component.SetFocus()`)**: Internal focus state of individual components

When the TUI initializes:

- ✅ `model.CurrentFocus` is set to the component ID (if autofocus is working)
- ❌ `component.SetFocus(true)` is NOT called on the component
- ❌ `component.GetFocus()` returns `false`

This causes the `DefaultInteractiveUpdateMsg` handler (in `DefaultInteractiveUpdateMsg`) to return `Ignored` because it checks `w.GetFocus()` at line 124:

```go
// Layer 2.1: 焦点检查（交互组件必需）
if !w.GetFocus() {
    return nil, Ignored
}
```

When the component returns `Ignored`, the keyboard message is not handled by the component and it bubbles up to check global bindings, which don't exist for navigation keys.

## Test Evidence

From our tests:

1. **`TestListNavigation` - PASS**: When we manually call `SetFocus(true)` before sending keys, navigation works:
   - Initial index: 0
   - After down key #1: Index = 1 ✅
   - After down key #2: Index = 2 ✅

2. **`TestListAutoFocus` - FAIL**: When using `AutoFocus: true`, focus is NOT properly set:
   - InitializeComponents returned 0 commands
   - CurrentFocus: "" (empty!)
   - Component GetFocus(): false ❌

3. **User Logs Show**: `CurrentFocus="itemList"` but component returns `handled=false`

## Issue: AutoFocus Not Working

The problem is that `AutoFocus: true` in the config does not automatically set focus on the first focusable component. The initialization logic doesn't call the focus manager.

## Solution

There are TWO ways to fix this:

### Option 1: Ensure InitializeComponents Sets Focus (Recommended)

Modify the TUI initialization to call focus manager after initializing components:

```go
func (m *Model) InitializeComponents() []tea.Cmd {
    // ... existing initialization code ...

    // After all components are initialized, handle autofocus
    if m.Config.AutoFocus != nil && *m.Config.AutoFocus {
        focusableIDs := m.getFocusableComponentIDs()
        if len(focusableIDs) > 0 {
            m.CurrentFocus = focusableIDs[0]
            m.updateInputFocusStates() // This calls SetFocus on the component
        }
    }

    return allCmds
}
```

### Option 2: Ensure validateAndCorrectFocusState is Called After Init

Make sure the focus state is validated after initialization and window resize:

```go
// In the Update() handler for WindowSizeMsg:
case tea.WindowSizeMsg:
    m.Width = msg.Width
    m.Height = msg.Height
    m.Ready = true

    // Validate and correct focus state
    m.validateAndCorrectFocusState()
```

## Current Workaround

Until the fix is implemented, you can manually set focus on the list component using TUI JavaScript API:

```javascript
// In a TUI script or init action
tui.setFocus('itemList');
```

Or ensure your TUI config has `AutoFocus: true` AND the first focusable component will get focus during initialization (requires Option 1 fix above).

## Files to Check

1. **`tui/component_initializer.go`** - Should set focus if AutoFocus is enabled
2. **`tui/model.go`** - WindowSizeMsg handler should validate focus state
3. **`tui/focus_manager.go`** - `updateInputFocusStates()` correctly synchronizes focus

## Verification

After fixing, verify with:

```bash
cd tui
go test -v -run "TestListAutoFocus"
```

Should show:

- `CurrentFocus: "itemList"`
- `Component GetFocus(): true`
- Arrow keys move the list selection

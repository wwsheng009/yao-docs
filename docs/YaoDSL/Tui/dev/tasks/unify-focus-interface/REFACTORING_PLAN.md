# Unify Focus Interface - Task: Remove HasFocus() and Use GetFocus()

## Problem Statement

Component wrappers have two redundant methods for checking focus state:

- `GetFocus() bool` - defined in `ComponentInterface` (required)
- `HasFocus() bool` - defined in `InteractiveBehavior` (optional)

This causes confusion and maintenance issues. The FilePicker component only implements `GetFocus()`, triggering this warning:

```
TUI: Component filePicker does not implement HasFocus() interface
```

## Solution: Unify on GetFocus()

Remove `HasFocus()` entirely and use the existing `GetFocus()` method throughout the codebase.

### Rationale

1. `GetFocus()` is already defined as a required method in `ComponentInterface`
2. All components already implement `GetFocus()`
3. Simpler design - single method for reading focus state
4. Minimal changes required to fix the issue

## Changes Required

### 1. Core Interface Changes

**File: `tui/core/message_handler.go`**

- Remove `HasFocus() bool` from `InteractiveBehavior` interface (line 27)
- Update `DefaultInteractiveUpdateMsg` to use `GetFocus()` instead of `HasFocus()` (line 127)

### 2. Message Handling Changes

**File: `tui/message_handlers.go`**

- Replace type assertion with direct call to `GetFocus()` (around line 309)
- Change from:
  ```go
  if focusChecker, ok := comp.Instance.(interface{ HasFocus() bool }); ok {
      hasFocus := focusChecker.HasFocus()
  ```
- To:
  ```go
  hasFocus := comp.Instance.GetFocus()
  ```

### 3. Model Changes

**File: `tui/model.go`**

- Update focus check to use `GetFocus()` (around line 230)
- Change from:
  ```go
  case interface{ HasFocus() bool }:
      if !comp.HasFocus() {
  ```
- To:
  ```go
  if !comp.GetFocus() {
  ```

### 4. Component Wrapper Cleanup

Remove redundant `HasFocus()` methods from these wrappers:

1. **tui/components/input.go** (line 404)
2. **tui/components/textarea.go** (line 268, 472)
3. **tui/components/table.go** (line 765)
4. **tui/components/cursor.go** (line 419)
5. **tui/components/paginator.go** (line 400)
6. **tui/components/viewport.go** (line 400)

Note: Keep `GetFocus()` implementation in all these files.

## Testing Checklist

- [ ] Run `make unit-test-core` to ensure core tests pass
- [ ] Test focus navigation with Tab/Shift+Tab
- [ ] Test ESC key to lose focus
- [ ] Verify warning message is gone for filePicker component
- [ ] Test all interactive components maintain correct focus behavior
- [ ] Run `make fmt-check` and `make vet` to ensure code quality

## Benefits

1. **Eliminates confusion**: Single method for reading focus state
2. **Fixes warnings**: FilePicker and similar components won't show warnings
3. **Simpler code**: Less type assertion and interface checking
4. **Better maintainability**: One source of truth for focus state

## Migration Notes

- This is a breaking change for external code that relies on `HasFocus()`
- All such code should be updated to use `GetFocus()` instead
- The functional behavior remains identical - `HasFocus()` always returned the same value as `GetFocus()`

## Completion Date

2026-01-20

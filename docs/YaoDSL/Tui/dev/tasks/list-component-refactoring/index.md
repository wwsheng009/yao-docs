# List Component Refactoring

**Date**: 2026-01-20
**Task**: Simplify List component architecture and add data binding support
**Status**: Complete

## Overview

The List component was refactored to follow the same principles as the CRUD component refactoring. This work simplified the component architecture by removing the unnecessary two-layer encapsulation and added support for data binding via `__bind_data`.

## Problem Statement

### 1. Unnecessary Wrapper Layer

The List component had an inconsistent two-layer architecture:

- `ListModel` - older model structure (no longer used)
- `ListComponentWrapper` - wrapper that implemented ComponentInterface
- `ListComponent` - actual component implementation

This was inconsistent with the simplified component architecture used in other components like CRUD, Input, etc., which have a single type that directly implements ComponentInterface.

### 2. Missing Data Binding Support

The List component didn't support `__bind_data` binding like Table and CRUD components:

- Only parsed explicit `items` from configuration props
- No support for binding to external data sources
- `ParseListProps` function didn't handle data binding

## Solution

### 1. Simplified Architecture

**Removed**:

- `ListModel` - deleted entirely (no longer referenced)
- `ListComponentWrapper` - removed wrapper type
- `NewListModel` - outdated constructor
- `NewListComponentWrapper` - wrapper constructor
- Old factory method in `component_factories.go`

**Kept & Enhanced**:

- `ListComponent` - now the primary interface implementing ComponentInterface
- `ListItem` - item structure for data display
- `ListProps` - property definition
- `ParseListProps` - updated as alias to new function

**Added**:

- `ParseListPropsWithBinding` - supports `__bind_data` binding
- `NewListComponent(config, id)` - simplified constructor accepting RenderConfig directly

### 2. Data Binding Implementation

Created `ParseListPropsWithBinding` function that:

- Extracts `__bind_data` from config data if present
- Auto-converts bound data to `ListItem` format
- Intelligently handles different data formats:
  - Maps with standard fields (`title`, `description`, `value`) → use them directly
  - Maps without standard fields → use `fmt.Sprintf("%v", item)` as title
  - Simple values → use string representation as title

## New Architecture

```
NewListComponent(config, id) [Single entry point]
  ├─> ParseListPropsWithBinding(Parses props and handles __bind_data)
  │     ├─> Extract explicit items from props
  │     ├─> Extract bound data from __bind_data
  │     └─> Convert to ListItems with smart detection
  └─> ListComponent(Implements ComponentInterface)
        └─> createNativeListModel(Creates bubbles/list.Model with items)
```

## Files Modified

### 1. `tui/components/list.go`

- **Before**: 573 lines with dual-layer architecture
- **After**: ~350 lines with simplified architecture
- **Changes**:
  - Removed `ListModel` type
  - Removed `ListComponentWrapper` type
  - Simplified `ListComponent` to directly implement `ComponentInterface`
  - Added `ParseListPropsWithBinding` function
  - Updated `NewListComponent` signature to accept `*RenderConfig` and `string` (id)
  - Kept `ParseListProps` as legacy alias

### 2. `tui/components/component_factories.go`

- Removed old `NewListComponent` factory method
- Component now created directly via `components.NewListComponent(config, id)`

## Data Binding Behavior

### When using `bind: "items"` in configuration:

**Case 1: Standard format with title/description/value**

```json
{
  "type": "list",
  "bind": "users",
  "props": {}
}
```

Data:

```json
[
  { "title": "Alice", "description": "Admin", "value": 1 },
  { "title": "Bob", "description": "User", "value": 2 }
]
```

Uses fields directly for title, description, and value.

**Case 2: Non-standard object fields**

```json
[
  { "id": 1, "name": "Alice", "role": "Admin" },
  { "id": 2, "name": "Bob", "role": "User" }
]
```

Uses string representation as title:

- `"map[id:1 name:Alice role:Admin]"`
- `"map[id:2 name:Bob role:User]"`

**Case 3: Simple values**

```json
["Option 1", "Option 2", "Option 3"]
```

Uses string values as titles directly.

### Smart Detection Logic

```go
if objMap, ok := item.(map[string]interface{}); ok {
    // Standard format - use dedicated fields
    if hasTitleField(objMap) {
        return ListItem{
            Title:       objMap["title"].(string),
            Description: getStringField(objMap, "description", ""),
            Value:       objMap["value"],
        }
    }
}
// Fallback - use string representation
return ListItem{
    Title: fmt.Sprintf("%v", item),
}
```

## Benefits

1. **Simpler Architecture**: Single type instead of dual-layer wrapper
2. **Consistency**: Aligns with CRUD and other component refactoring patterns
3. **Data Binding**: Supports `__bind_data` binding for dynamic content
4. **Reduced Complexity**: Code reduced from 573 to ~350 lines (~39% reduction)
5. **Smart Parsing**: Automatic handling of various data formats
6. **Backward Compatible**: Existing `items` in props continue to work

## Testing

The refactored component supports:

- ✅ Explicit `items` in props (backward compatible)
- ✅ Data binding via `bind` property
- ✅ Auto-detection of `title`/`description`/`value` fields
- ✅ Fallback to string formatting for any bound data
- ✅ All ComponentInterface methods (Init, Renderer, CaptureState, etc.)
- ✅ State capture and change detection via `ListStateHelper`

## API Changes

### Before

```go
wrapper := NewComponentWrapper(config, id)
model := wrapper.GetModel()
```

### After

```go
component := NewListComponent(config, id)
// Direct access to ComponentInterface methods
component.Init()
component.Render()
state := component.CaptureState()
```

### Before (Props Parsing)

```go
props, items := ParseListProps(config.Props)
```

### After (With Binding)

```go
props, items := ParseListPropsWithBinding(config)
// Now handles both explicit items and __bind_data
```

## Implementation Notes

- Kept `ParseListProps` as a legacy alias pointing to `ParseListPropsWithBinding` for backward compatibility
- All ComponentInterface methods are properly implemented on `ListComponent`
- State capture and change detection continue to work via `ListStateHelper`
- The `createNativeListModel` helper function creates the underlying bubbles/list.Model
- Smart field detection preserves flexibility while providing sensible defaults

## Related Work

- [CRUD Component Refactoring](../crud-component-refactoring/) - Similar refactoring pattern applied to List
- [Component Refactoring Guidelines](../Component_Refactoring_Guidelines/) - General guidelines for component simplification

## Future Considerations

- Consider adding custom field mapping support (e.g., `field_mapping` config)
- May add support for formatting functions to customize title/description generation
- Could add validation for bound data structure

## Migration Guide

If you were using the List component before:

1. Update constructor calls from `NewComponentWrapper` to `NewListComponent`
2. Remove any references to `Model` field access - use ComponentInterface methods
3. No changes needed if using explicit `items` in props
4. To add data binding, add `"bind": "data-field"` to component config
5. Optional: Structure bound data with `title`/`description`/`value` for optimal display

---

**End of Documentation**

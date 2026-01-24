# List Component Fix Summary

## Problem

The List component in the Yao TUI was not displaying items correctly. When a TUI configuration with a list component was rendered, only dots (`•••`) appeared instead of the actual list items.

## Root Causes Identified

### 1. **Missing list.Item Interface Methods**

The `ListItem` struct had fields named `Title` and `Description`, but the Bubble Tea `list.Item` interface requires **methods** `Title()`, `Description()`, and `FilterValue()`, not fields.

**File**: `tui/components/list.go`

**Fix**:

```go
// Changed from fields to methods
type ListItem struct {
    titleText    string  // Internal storage
    descText     string  // Internal storage
    Value        interface{}
    // ...
}

func (i ListItem) Title() string {
    return i.titleText
}

func (i ListItem) Description() string {
    return i.descText
}

func (i ListItem) FilterValue() string {
    return i.titleText
}
```

### 2. **Inefficient Default Delegate**

The code was using `list.NewDefaultDelegate()` which has:

- `Height() = 2` (takes 2 lines per item)
- `Spacing() = 1` (1 line gap between items)
- Each item: 3 lines total

With a list height of 10, only ~2-3 items would fit, and with status bars, title, etc., even fewer would be visible.

**Reference**: `E:\projects\yao\temp\bubbletea\examples\list-simple\main.go`

**Fix**:

```go
type ListItemDelegate struct{}

func (d ListItemDelegate) Height() int  { return 1 }
func (d ListItemDelegate) Spacing() int { return 0 }
func (d ListItemDelegate) Update(_ tea.Msg, _ *list.Model) tea.Cmd {
    return nil
}

func (d ListItemDelegate) Render(w io.Writer, m list.Model, index int, listItem list.Item) {
    i, ok := listItem.(ListItem)
    if !ok {
        return
    }

    str := fmt.Sprintf(" %s", i.Title())

    if index == m.Index() {
        color := lipgloss.Color("170")
        fmt.Fprintf(w, "%s", lipgloss.NewStyle().Foreground(color).Render("> "+str))
    } else {
        fmt.Fprintf(w, "  %s", str)
    }
}
```

### 3. **Missing itemTemplate Support**

The `itemTemplate` property was being evaluated as a global state expression, causing `"{{id}}. {{name}} - {{price}}"` to become `".  -"` because `id`, `name`, and `price` don't exist in global state (they only exist in individual list items).

**File**: `tui/props_resolver.go`

**Fix**: Added `itemTemplate` to a list of props that should NOT be evaluated:

```go
propsToSkipEvaluation := map[string]bool{
    "itemTemplate": true,
    "labelTemplate": true,
    "format": true,
}

// In resolveProps:
for key, value := range comp.Props {
    if propsToSkipEvaluation[key] {
        // Keep the literal value without evaluation
        result[key] = value
    } else {
        result[key] = m.evaluateValue(value)
    }
}
```

### 4. **itemTemplate Implementation**

Added support for `itemTemplate` to format list items dynamically:

**File**: `tui/components/list.go`

**Fix**:

```go
func ParseListPropsWithBinding(props map[string]interface{}) ListProps {
    // ...

    var itemTemplate string
    if template, ok := props["itemTemplate"].(string); ok {
        itemTemplate = template
    }

    // For each item:
    if itemMap, ok := item.(map[string]interface{}); ok {
        listItem := ListItem{
            titleText: fmt.Sprintf("%v", itemMap),
            Value:     item,
        }

        if title, ok := itemMap["title"].(string); ok && title != "" {
            listItem.titleText = title
        } else if itemTemplate != "" {
            listItem.titleText = applyTemplate(itemTemplate, itemMap)
        } else {
            // Fallback to 'name' or 'id'
            if name, ok := itemMap["name"].(string); ok && name != "" {
                listItem.titleText = name
            } else if id, ok := itemMap["id"]; ok {
                listItem.titleText = fmt.Sprintf("Item %v", id)
            }
        }
        // ...
    }
}

func applyTemplate(template string, data map[string]interface{}) string {
    result := template
    for key, value := range data {
        placeholder := "{{" + key + "}}"
        result = fmt.Sprintf("%s", strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value)))
    }
    return result
}
```

### 5. **Missing Width/Height Updates During Render**

The list model's width and height were not being updated when `Render()` was called with new dimensions.

**File**: `tui/components/list.go`

**Fix**:

```go
func (c *ListComponent) Render(config core.RenderConfig) (string, error) {
    // Update items
    if props.Items != nil {
        items := make([]list.Item, len(props.Items))
        for i, item := range props.Items {
            items[i] = item
        }
        c.model.SetItems(items)
    }

    // Update dimensions from render config
    c.updateListDimensions(config, props)

    return c.View(), nil
}

func (c *ListComponent) updateListDimensions(config core.RenderConfig, props ListProps) {
    if props.Width > 0 {
        c.model.SetWidth(props.Width)
    } else if config.Width > 0 {
        c.model.SetWidth(config.Width)
    }

    if props.Height > 0 {
        c.model.SetHeight(props.Height)
    } else if config.Height > 0 {
        c.model.SetHeight(config.Height)
    }
}
```

### 6. **List Component Not Focusable**

The list component was not registered as focusable, which could affect keyboard navigation.

**File**: `tui/registry.go`

**Fix**:

```go
r.focusableTypes[ListComponent] = true
```

## Changes Made

### Files Modified:

1. **tui/components/list.go**
   - Changed `ListItem` fields to methods for `list.Item` interface
   - Added `ListItemDelegate` with efficient rendering
   - Added `itemTemplate` support with `applyTemplate` function
   - Added `updateListDimensions` method

2. **tui/props_resolver.go**
   - Added `propsToSkipEvaluation` to preserve template strings
   - Modified `resolveProps` to skip evaluation for template-like props

3. **tui/registry.go**
   - Registered `ListComponent` as focusable

## Example Usage

```json
{
  "name": "List Component Test",
  "data": {
    "items": [
      { "id": 1, "name": "Apple", "price": "$1.99" },
      { "id": 2, "name": "Banana", "price": "$0.99" },
      { "id": 3, "name": "Cherry", "price": "$2.99" }
    ]
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "Fruit List"
        }
      },
      {
        "type": "list",
        "id": "itemList",
        "bind": "items",
        "props": {
          "height": 12,
          "width": 50,
          "itemTemplate": "{{id}}. {{name}} - {{price}}",
          "showTitle": false,
          "showFilter": false
        }
      }
    ]
  }
}
```

## Output

```
Fruit List

8 items

>  1. Apple - $1.99
   2. Banana - $0.99
   3. Cherry - $2.99
   4. Date - $3.99
   5. Elderberry - $4.99
   6. Fig - $1.49
   7. Grape - $2.49
   8. Honeydew - $3.49

↑/k up • ↓/j down • / filter • q quit • ? more
```

## Tests Added

1. **list_item_template_test.go** - Tests for `itemTemplate` parsing
2. **list_debug_test.go** - Debug tests for list rendering
3. **list_render_test.go** - Full flow rendering tests
4. **list_height_test.go** - Height and viewport investigation tests
5. **list_tui_flow_test.go** - Tests through full TUI flow
6. **list_props_test.go** - Props resolution tests
7. **list_integration_test.go** - Integration tests
8. **list_summary_test.go** - Comprehensive validation of all fixes

## Verification

Run the following tests to verify all fixes:

```bash
cd tui
go test -v -run TestList
```

All tests pass successfully, validating that:

- ✓ List component properly implements list.Item interface
- ✓ Custom ListItemDelegate renders efficiently
- ✓ itemTemplate is preserved and applied to each item
- ✓ Width/height are correctly updated during rendering
- ✓ List component is registered as focusable
- ✓ List items display with correct formatting

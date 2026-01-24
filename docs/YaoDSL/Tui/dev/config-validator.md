# TUI Configuration Validator

## Overview

The `ConfigValidator` is a comprehensive TUI configuration validation system that ensures configuration files are valid and compatible with the TUI rendering engine. It provides detailed error reporting and works closely with the component registry to validate component types.

## Features

### 1. Basic Structure Validation

- Validates required fields (name, layout, direction)
- Checks for valid log levels
- Validates autoFocus configuration
- Ensures data section exists

### 2. Layout Structure Validation

- Validates layout direction (vertical/horizontal/row/column)
- Checks padding format and values
- Validates nesting depth (max 50 levels)
- Warns about performance issues (many children, deep nesting)

### 3. Component Validation

- **Type Validation**: Checks if component types are registered in the component registry
- **Built-in Support**: Recognizes all built-in component types (text, table, list, input, etc.)
- **ID Checking**: Warns about components without IDs (affects binding and focus)
- **Binding Validation**: Verifies data bindings reference existing state keys

### 4. Component-Specific Props Validation

#### Table Component

- Validates columns array is not empty
- Checks each column has required "key" field
- Validates height is reasonable (> 0)

#### List Component

- Warns about empty items array

#### Input/Textarea Components

- Validates character limits are reasonable

#### Menu Component

- Warns about empty items array

### 5. Integration with Rendering Engine

The validator is tightly coupled with the rendering engine:

- **Component Registry**: Uses the same `ComponentRegistry` that the render engine uses
- **Component Factories**: Checks if the same factories used for rendering exist
- **Type System**: Validates types that will be used in `InitializeComponents()`
- **Data Binding**: Validates bindings that will be resolved by `resolveProps()`

## Usage

### Automatic Validation

The validator is automatically called when loading TUI configurations:

```go
// In loader.go
registry := GetGlobalRegistry()
validator := NewConfigValidator(cfg, registry)

if !validator.Validate() {
    log.Error("TUI validation failed:\n%s", validator.GetErrorSummary())
    // Handle validation failure
}
```

### Manual Validation

You can also validate a configuration programmatically:

```go
cfg := &Config{
    Name: "My TUI",
    Layout: Layout{...},
}

registry := GetGlobalRegistry()
validator := NewConfigValidator(cfg, registry)

if !validator.Validate() {
    fmt.Println(validator.GetErrorSummary())
}
```

## Validation Levels

### Errors (Block TUI Loading)

- Missing required fields (name)
- Invalid component types
- Invalid layout types
- Invalid column configurations
- Exceeded maximum nesting depth

### Warnings (Allow Loading)

- Components without IDs
- Empty arrays (items, columns)
- Invalid numeric sizes (negative)
- Partial padding specifications
- Too many children (performance warning)

## Error Reporting Format

### Validation Summary

```
Validation Summary for TUI 'My App':
  2 Error(s):
    - name: TUI name is required
    - layout.children[0].type: unknown component type: 'invalid_type'
  3 Warning(s):
    - layout.children[0].id: component has no ID
    - layout.children[1].props.columns: table columns array is empty
    - layout.padding: partial padding specified (2 values), will be normalized
```

### JSON Path Format

The validator uses JSON-style paths to identify configuration locations:

- `name` - Top-level field
- `layout.direction` - Layout direction
- `layout.children[0].type` - First child's type
- `layout.children[0].props.columns[0].key` - First column's key

## Key Design Principles

### 1. Render Engine Alignment

The validator validates the exact same configurations that the render engine will use:

```go
// Validator checks component exists in registry
factory, exists := registry.GetComponentFactory(ComponentType(comp.Type))

// Render engine uses the same registry
factory := registry.GetComponentFactory(ComponentType(comp.Type))

// Both use the same component factories
instance := factory(renderConfig, id)
```

### 2. Data Binding Consistency

Validator checks bindings that `resolveProps()` will use:

```go
// Validator checks binding exists in data
if v.getDataValue(comp.Bind) {
    // Binding will work in render
}

props := m.resolveProps(comp) // Uses the same check
```

### 3. Configuration Normalization

The validator normalizes configurations the same way the render engine does:

```go
// Both accept "column" and "vertical"
if layout.Direction == "column" {
    layout.Direction = "vertical" // Normalized
}
```

## Examples

### Invalid Configuration

```json
{
  "name": "",
  "layout": {
    "direction": "invalid",
    "children": [
      {
        "type": "nonexistent",
        "props": {}
      }
    ]
  }
}
```

**Validation Output:**

```
[Config Validator] Error #1 at name: TUI name is required
[Config Validator] Error #2 at layout.direction: invalid direction
[Config Validator] Error #3 at layout.children[0].type: unknown component type: 'nonexistent'
```

### Valid Configuration with Warnings

```json
{
  "name": "Valid App",
  "layout": {
    "direction": "vertical",
    "padding": [1, 2],
    "children": [
      {
        "type": "text",
        "props": {
          "height": -5
        }
      }
    ]
  }
}
```

**Validation Output:**

```
[Config Validator] Warning at layout.padding: partial padding (2 values), will be normalized to 4
[Config Validator] Warning at layout.children[0].props.height: size value is negative, may cause rendering issues
[Config Validator] TUI 'Valid App' is valid with 2 warnings
```

## Testing

Run the config validator tests:

```bash
go test ./tui -v -run TestConfigValidator
```

### Test Coverage

- ✅ Valid configurations
- ✅ Missing required fields
- ✅ Invalid directions (old and new formats)
- ✅ Invalid component types
- ✅ Missing component IDs
- ✅ Invalid data bindings
- ✅ Empty table columns
- ✅ Nested layouts
- ✅ Error summary generation
- ✅ Warnings (partial errors)
- ✅ Component-specific props validation

## API Reference

### `NewConfigValidator(cfg, registry)`

Creates a new validator instance.

### `validator.Validate()`

Runs all validations and returns true if valid.

### `validator.GetErrors()`

Returns a slice of `ValidationError` objects.

### `validator.GetWarnings()`

Returns a slice of `ValidationError` objects.

### `validator.GetErrorSummary()`

Returns a formatted summary of all validation issues.

## Relationship with Rendering Engine

```
Configuration Loading
    ↓
ConfigValidator (validates)
    ↓
Config.Normalize()
    ↓
Model.InitializeComponents()
    ↓
LayoutEngine (uses validated config)
    ↓
RenderComponent()
```

The validator ensures that by the time the configuration reaches the render engine, all potential issues have been identified and logged.

## Benefits

1. **Early Error Detection**: Catch configuration errors before runtime
2. **Detailed Messages**: Clear, actionable error reports
3. **Integration**: Works seamlessly with existing render engine
4. **Performance**: Warnings about configurations that may be slow
5. **Backward Compatible**: Existing configs continue to work
6. **Future-Proof**: Easy to add new validation rules

## Future Enhancements

Potential improvements:

- Support for custom component type validation
- Schema-based validation for component props
- Configuration suggestions for common mistakes
- Validation rules in configuration files
- Interactive validation mode (CLI)
- Configuration diff comparison

# Focusable Component Registry Usage Guide

## Overview

The TUI framework now supports automatic registration of focusable component types through a centralized registry. This replaces the previous hardcoded approach in `focus_manager.go`.

## Key Features

1. **Automatic Registration**: Components declare their focus capability during registration
2. **Centralized Management**: All focusable types are managed in one place
3. **Dynamic Registration**: Custom components can be registered as focusable at runtime
4. **Type Safety**: Uses component type constants instead of magic strings

## Usage

### For Built-in Components

Built-in components are automatically registered in `registry.go`:

```go
// In RegisterBuiltInComponents()
r.focusableTypes[InputComponent] = true
r.focusableTypes[TextareaComponent] = true
r.focusableTypes[MenuComponent] = true
// ... etc
```

### For Custom Components

When creating custom components, you can register them as focusable:

```go
import "github.com/yaoapp/yao/tui"

// Get the global registry
registry := tui.GetGlobalRegistry()

// Define your custom component type
const MyCustomComponent tui.ComponentType = "my-custom"

// Register it as focusable
registry.RegisterFocusableComponent(MyCustomComponent)
```

### Querying Focusable Components

The focus manager now automatically discovers focusable components:

```go
// In focus_manager.go
func (m *Model) getFocusableComponentIDs() []string {
    registry := GetGlobalRegistry()
    ids := []string{}
    for id, comp := range m.Components {
        if registry.IsFocusable(ComponentType(comp.Type)) {
            ids = append(ids, id)
        }
    }
    return ids
}
```

### API Reference

#### RegisterFocusableComponent

```go
func (r *ComponentRegistry) RegisterFocusableComponent(componentType ComponentType)
```

Marks a component type as focusable.

#### IsFocusable

```go
func (r *ComponentRegistry) IsFocusable(componentType ComponentType) bool
```

Checks if a component type is focusable.

#### GetFocusableComponentTypes

```go
func (r *ComponentRegistry) GetFocusableComponentTypes() []ComponentType
```

Returns all registered focusable component types.

#### UnregisterFocusableComponent

```go
func (r *ComponentRegistry) UnregisterFocusableComponent(componentType ComponentType)
```

Removes focusable flag from a component type.

## Benefits of This Refactoring

### 1. Open/Closed Principle

New component types can be registered without modifying existing code.

### 2. Single Responsibility

Focus management logic is centralized in the registry, not scattered across focus_manager.go.

### 3. Type Safety

Uses component type constants (e.g., `InputComponent`) instead of magic strings (e.g., `"input"`).

### 4. Extensibility

Custom components can easily declare their focus capability.

### 5. Testability

The registry can be easily mocked or tested independently.

## Migration Notes

### Before (Hardcoded)

```go
func (m *Model) getFocusableComponentIDs() []string {
    focusableTypes := map[string]bool{
        "input":    true,
        "textarea": true,
        "menu":     true,
        // ... more types
    }
    // ... filtering logic
}
```

### After (Registry-based)

```go
func (m *Model) getFocusableComponentIDs() []string {
    registry := GetGlobalRegistry()
    ids := []string{}
    for id, comp := range m.Components {
        if registry.IsFocusable(ComponentType(comp.Type)) {
            ids = append(ids, id)
        }
    }
    return ids
}
```

## Testing

The refactoring includes comprehensive tests in `focus_registry_test.go`:

- `TestFocusableComponentRegistration`: Verifies built-in components are registered
- `TestFocusableComponentDynamicRegistration`: Tests dynamic registration/unregistration
- `TestGetFocusableComponentTypes`: Validates retrieval of all focusable types

Run tests with:

```bash
go test ./tui -v -run TestFocusable
```

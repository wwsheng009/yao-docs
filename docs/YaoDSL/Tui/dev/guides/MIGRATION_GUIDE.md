# TUI Migration Guide: Legacy to Runtime

## Overview

This guide helps you migrate from the Legacy TUI system (Bubble Tea based) to the new Runtime engine (pure layout kernel).

## Key Differences

| Aspect           | Legacy (Bubble Tea)       | Runtime (Native)                        |
| ---------------- | ------------------------- | --------------------------------------- |
| **Architecture** | Tree traversal based      | Geometry based                          |
| **Layout**       | Bubble Tea View()         | Three-phase (Measure → Layout → Render) |
| **Sizing**       | Component-controlled      | Constraint-driven                       |
| **Positioning**  | Relative to parent        | Relative + Absolute positioning         |
| **Events**       | Tree-based bubbling       | Geometry-based dispatch                 |
| **Dependencies** | Requires Bubble Tea       | Pure Go, no external deps               |
| **Performance**  | Full re-render each frame | Dirty region tracking                   |

## Migration Steps

### Step 1: Understand the Component Interface

Legacy components implemented `bubbletea.Model`:

```go
// LEGACY
type MyComponent struct {
    // ... fields
}

func (m MyComponent) Init() tea.Cmd {
    return nil
}

func (m MyComponent) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    // ... handle updates
    return m, nil
}

func (m MyComponent) View() string {
    // ... render view
    return "content"
}
```

Runtime components implement `runtime.Component`:

```go
// RUNTIME
type MyComponent struct {
    content string
    Style   runtime.Style
}

func (m *MyComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    // Calculate intrinsic size
    return runtime.Size{Width: len(m.content), Height: 1}
}

func (m *MyComponent) Render(buf *runtime.CellBuffer, box runtime.LayoutBox) {
    // Render to cell buffer
    for i, char := range m.content {
        buf.SetContent(box.X+i, box.Y, box.ZIndex, char, runtime.CellStyle{}, m.ID())
    }
}

func (m *MyComponent) HandleEvent(ev runtime.Event) {
    // Handle events
}

func (m *MyComponent) ID() string {
    return "my-component"
}

func (m *MyComponent) Type() string {
    return "my"
}

func (m *MyComponent) Instance() runtime.Component {
    return m
}

func (m *MyComponent) View() string {
    return m.content
}
```

### Step 2: Convert View() to Measure() + Render()

**Legacy View():**

```go
func (m MyComponent) View() string {
    return lipgloss.NewStyle().
        Width(m.width).
        Height(m.height).
        Render(m.content)
}
```

**Runtime Measure():**

```go
func (m *MyComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    width := m.width
    height := m.height

    // Apply constraints
    if width > constraints.MaxWidth {
        width = constraints.MaxWidth
    }
    if width < constraints.MinWidth {
        width = constraints.MinWidth
    }

    return runtime.Size{
        Width:  width,
        Height: height,
    }
}
```

**Runtime Render():**

```go
func (m *MyComponent) Render(buf *runtime.CellBuffer, box runtime.LayoutBox) {
    // box.X, box.Y = final position
    // box.W, box.H = final size

    for y := 0; y < box.H; y++ {
        for x := 0; x < box.W; x++ {
            if x < len(m.content) && y == 0 {
                buf.SetContent(box.X+x, box.Y+y, box.ZIndex,
                    rune(m.content[x]), runtime.CellStyle{}, m.ID())
            }
        }
    }
}
```

### Step 3: Convert Update() to HandleEvent()

**Legacy Update():**

```go
func (m MyComponent) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "enter":
            // Handle enter key
            return m, nil
        }
    }
    return m, nil
}
```

**Runtime HandleEvent():**

```go
func (m *MyComponent) HandleEvent(ev runtime.Event) {
    if ev.Type == "key" {
        if key, ok := ev.Data.(rune); ok {
            if key == '\n' { // Enter key
                // Handle enter key
            }
        }
    }
}
```

### Step 4: Register Component

```go
func init() {
    registry.RegisterDefault("my", func() runtime.Component {
        return NewMyComponent("")
    })
}
```

### Step 5: Update DSL Configuration (if applicable)

Legacy DSL:

```json
{
  "type": "layout",
  "props": {
    "direction": "horizontal"
  },
  "children": [...]
}
```

Runtime DSL:

```json
{
  "type": "row",
  "props": {
    "justify": "start",
    "alignItems": "center"
  },
  "children": [...]
}
```

## Common Migration Patterns

### Pattern 1: Text Display

**Legacy:**

```go
func (m TextComponent) View() string {
    return lipgloss.NewStyle().
        Foreground(lipgloss.Color("red")).
        Bold(true).
        Render(m.text)
}
```

**Runtime:**

```go
func (t *TextComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    return runtime.Size{
        Width:  len(t.text),
        Height: 1,
    }
}

func (t *TextComponent) Render(buf *runtime.CellBuffer, box runtime.LayoutBox) {
    style := runtime.CellStyle{
        Bold: true,
        // Note: Color support via render module
    }
    for i, char := range t.text {
        buf.SetContent(box.X+i, box.Y, box.ZIndex, char, style, t.ID())
    }
}
```

### Pattern 2: Container Layout

**Legacy:**

```go
func (m Container) View() string {
    children := []string{}
    for _, child := range m.children {
        children = append(children, child.View())
    }
    return lipgloss.JoinHorizontal(lipgloss.Top, children...)
}
```

**Runtime:**

```go
// Use Row component instead
row := components.NewRow()
for _, child := range m.children {
    row.AddChild(child)
}
```

### Pattern 3: Input Handling

**Legacy:**

```go
func (m Input) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "ctrl+c":
            return m, tea.Quit
        case "enter":
            m.value = m.input.Value()
            return m, nil
        }
    }
    return m, nil
}
```

**Runtime:**

```go
func (i *InputComponent) HandleEvent(ev runtime.Event) {
    if ev.Type == "key" {
        if key, ok := ev.Data.(rune); ok {
            if key == '\x03' { // Ctrl+C
                // Quit handling
            } else if key == '\n' { // Enter
                i.value = i.input
            }
        }
    }
}
```

## Layout Migration

### Flex Layouts

Legacy used `layout` type with direction:

```json
{
  "type": "layout",
  "props": {
    "direction": "horizontal",
    "justify": "space-between"
  }
}
```

Runtime uses specific layout types:

```json
{
  "type": "row",
  "props": {
    "justify": "space-between"
  }
}
```

Or for vertical:

```json
{
  "type": "column",
  "props": {
    "justify": "center"
  }
}
```

### Sizing

Legacy:

```json
{
  "width": "100%",
  "height": "auto"
}
```

Runtime:

```json
{
  "props": {
    "width": "flex",
    "height": -1
  }
}
```

Or fixed:

```json
{
  "props": {
    "width": 80,
    "height": 24
  }
}
```

## Positioning Migration

### Relative Positioning (Default)

Both systems support relative positioning:

```json
{
  "type": "text",
  "props": {
    "content": "Hello"
  }
}
```

### Absolute Positioning

Runtime adds explicit absolute positioning:

```json
{
  "type": "text",
  "props": {
    "content": "Modal",
    "style": {
      "position": "absolute",
      "top": 10,
      "left": 20
    }
  }
}
```

## Testing Migration

### Legacy Tests

```go
func TestLegacyComponent(t *testing.T) {
    model := MyComponent{}
    view := model.View()
    assert.Contains(t, view, "expected text")
}
```

### Runtime Tests

```go
func TestRuntimeComponent(t *testing.T) {
    comp := NewMyComponent("test")

    // Test Measure
    size := comp.Measure(runtime.BoxConstraints{
        MinWidth: 0,
        MaxWidth: 100,
    })
    assert.Equal(t, 4, size.Width)

    // Test Render
    buf := runtime.NewCellBuffer(20, 5)
    box := runtime.LayoutBox{
        X: 0,
        Y: 0,
        W: size.Width,
        H: size.Height,
    }
    comp.Render(buf, box)

    // Verify buffer content
    cell := buf.GetContent(0, 0)
    assert.Equal(t, 't', cell.Char)
}
```

## DSL Configuration Migration

### Enable Runtime Engine

Add to your TUI config:

```json
{
  "name": "My Application",
  "useRuntime": true,
  "layout": {
    // Runtime layout config
  }
}
```

### Convert Component Types

| Legacy Type                             | Runtime Type                 |
| --------------------------------------- | ---------------------------- |
| `layout` with `direction: "horizontal"` | `row`                        |
| `layout` with `direction: "vertical"`   | `column`                     |
| `static`                                | `text`                       |
| `box`                                   | Use borders on any component |
| Custom layout component                 | `row` or `column` with props |

## Performance Considerations

### Dirty Region Tracking

Runtime automatically tracks dirty regions:

```go
// Only changed regions are re-rendered
runtime.ComputeDiff(oldFrame, newFrame)
```

### Measurement Caching

Runtime caches measurements:

```go
// Measurements are cached until constraints change
node.MeasuredWidth  // Cached value
node.MeasuredHeight // Cached value
```

## Troubleshooting

### Issue: Components not visible

**Cause:** Measure phase returning incorrect size

**Solution:**

```go
// Ensure Measure returns reasonable size
func (c *MyComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    return runtime.Size{
        Width:  max(10, min(constraints.MaxWidth, 100)),
        Height: max(1, min(constraints.MaxHeight, 10)),
    }
}
```

### Issue: Events not received

**Cause:** Component not in focus or wrong geometry

**Solution:**

```go
// Check focus state
if !focused {
    return // Ignore event
}

// Check event coordinates
if ev.X < box.X || ev.X >= box.X+box.W ||
   ev.Y < box.Y || ev.Y >= box.Y+box.H {
    return // Event outside component
}
```

### Issue: Layout overlaps

**Cause:** Absolute positioning without offsets

**Solution:**

```json
{
  "style": {
    "position": "absolute",
    "top": 10,
    "left": 10
  }
}
```

## Best Practices

1. **Always implement Measure phase** - Even for fixed-size components
2. **Use constraints wisely** - Don't ignore BoxConstraints
3. **Test with various window sizes** - Runtime is more constraint-sensitive
4. **Leverage existing components** - Row, Column, Flex handle most layouts
5. **Register components in init()** - Ensures availability at startup
6. **Use semantic types** - `row` instead of `layout` with direction

## Resources

- **Runtime Behavior Spec:** `tui/runtime/BEHAVIOR.md`
- **Component Examples:** `tui/ui/components/`
- **DSL Factory:** `tui/runtime/dsl/factory.go`
- **Registry:** `tui/runtime/registry/registry.go`
- **Tests:** `tui/runtime_e2e_test.go`

## Get Help

1. Check existing component implementations in `tui/ui/components/`
2. Review tests in `tui/runtime/*_test.go`
3. Enable debug output: `runtime.SetDebug(true)`
4. Export layout for visualization: `export.ExportSVG(frame, "debug.svg")`

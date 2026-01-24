# TUI Runtime Engine - Behavior Specification

## Overview

The TUI Runtime engine is a pure layout kernel that provides geometry-based rendering for terminal UI applications. It implements a three-phase rendering model: **Measure → Layout → Render**.

## Core Principles

### 1. Geometry-First Design

- All interactions are based on final `LayoutBox` geometry, not the component tree
- Components receive explicit dimensions during rendering
- Position-based event dispatch (X, Y coordinates) rather than component path traversal

### 2. Three-Phase Rendering

#### Phase 1: Measure

**Purpose:** Calculate intrinsic sizes for components

**Process:**

- Each component receives `BoxConstraints` (min/max width and height)
- Components return their preferred `Size` (width × height)
- Layout nodes cache `MeasuredWidth` and `MeasuredHeight`
- Special values:
  - `-1` = Auto size (determined by content)
  - `-2` to `-101` = Percentage (2% to 101%)

**Example:**

```go
// Text component measures based on content length
func (t *TextComponent) Measure(constraints BoxConstraints) Size {
    textWidth := len(t.content)
    return Size{
        Width:  min(textWidth, constraints.MaxWidth),
        Height: 1, // Single line text
    }
}
```

#### Phase 2: Layout

**Purpose:** Calculate final positions and distribute available space

**Process:**

- Flexbox algorithm distributes available space
- Parent constraints flow down to children
- Child measurements flow up (bottom-up)
- Layout nodes receive final `X` and `Y` coordinates
- `MeasuredWidth/Height` may be adjusted based on available space

**Flex Distribution:**

1. **Fixed sizes** are allocated first
2. **Remaining space** is distributed to flexible children based on `FlexGrow`
3. **Shrink** factors are applied when space is insufficient
4. **Position** is calculated (X, Y for relative; AbsoluteX, AbsoluteY for absolute)

**Example:**

```go
// Row layout with 3 children:
// [Fixed: 20] [Flex: 1] [Flex: 2]
// Available: 100
// Distribution:
// - Fixed takes 20
// - Remaining: 80
// - Flex 1 gets: 80 * (1/3) = 26
// - Flex 2 gets: 80 * (2/3) = 53
```

#### Phase 3: Render

**Purpose:** Generate visual output to CellBuffer

**Process:**

- Components render to `CellBuffer` (virtual canvas)
- Z-index determines layering (higher values render on top)
- ANSI escape codes handle text styling (Bold, Underline, Italic)
- Final output is a `Frame` containing the rendered buffer

**Example:**

```go
func (t *TextComponent) Render(buf *CellBuffer, box LayoutBox) {
    for i, char := range t.content {
        buf.SetContent(
            box.X + i,  // X position
            box.Y,      // Y position
            box.ZIndex, // Z-index
            char,       // Character
            CellStyle{}, // Style
            t.id,       // Component ID
        )
    }
}
```

## Layout Behavior

### Container Types

#### Row (Horizontal Layout)

```go
row := NewRow()
row.Style.Gap = 1           // Spacing between children
row.Style.Justify = JustifySpaceBetween
row.Style.AlignItems = AlignCenter
```

**Behavior:**

- Children are arranged horizontally
- Width distributes across available space (respecting FlexGrow)
- Height is determined by tallest child (or container height)

#### Column (Vertical Layout)

```go
column := NewColumn()
column.Style.Gap = 1
column.Style.Justify = JustifyCenter
column.Style.AlignItems = AlignStretch
```

**Behavior:**

- Children are arranged vertically
- Height distributes across available space (respecting FlexGrow)
- Width is determined by widest child (or container width)

### Positioning

#### Relative Positioning (Default)

```go
node.Position.Type = PositionRelative
// X and Y are relative to parent
```

**Behavior:**

- Participates in flex layout
- X, Y calculated by flexbox algorithm
- AbsoluteX = X, AbsoluteY = Y

#### Absolute Positioning

```go
node.Position.Type = PositionAbsolute
node.Position.Left = &left   // Offset from left edge
node.Position.Top = &top     // Offset from top edge
node.Position.Right = &right // Offset from right edge
node.Position.Bottom = &bottom // Offset from bottom edge
```

**Behavior:**

- Removed from flex layout flow
- Positioned relative to parent container
- AbsoluteX = Parent.X + Left (or Right calculation)
- AbsoluteY = Parent.Y + Top (or Bottom calculation)

### Alignment

#### Justify Content (Main Axis)

- `JustifyStart`: Items at start of container
- `JustifyCenter`: Items centered
- `JustifyEnd`: Items at end
- `JustifySpaceBetween`: Equal spacing between items
- `JustifySpaceAround`: Equal spacing around items

#### Align Items (Cross Axis)

- `AlignStart`: Items at start of cross axis
- `AlignCenter`: Items centered on cross axis
- `AlignEnd`: Items at end of cross axis
- `AlignStretch`: Items stretch to fill cross axis

## Constraints

### BoxConstraints

```go
type BoxConstraints struct {
    MinWidth  int  // Minimum width (0 = unconstrained)
    MaxWidth  int  // -1 = unconstrained (infinite)
    MinHeight int
    MaxHeight int
}
```

**Behavior:**

- Components must fit within Min ≤ Size ≤ Max
- `-1` (or Unconstrained) means "use natural size"
- Tight constraints: Min == Max (exact size required)
- Loose constraints: Min < Max (flexibility allowed)

## Event Dispatch

### Geometry-Based Hit Testing

```go
func (r *RuntimeImpl) DispatchEvent(ev Event) {
    for _, box := range r.boxes {
        if hitTest(box, ev.X, ev.Y) {
            box.Node.Component.HandleEvent(ev)
            break // Stop at first hit (z-index order)
        }
    }
}
```

**Behavior:**

- Events are dispatched based on X, Y coordinates
- Z-index determines hit priority (higher on top)
- First matching component receives the event
- Event bubbling not supported (geometry-first design)

## Performance Considerations

### Dirty Region Tracking

- Only re-render changed regions
- `ComputeDiff()` compares frames to identify changes
- Dirty regions are marked for next render cycle

### Measurement Caching

- `MeasuredWidth/Height` cached during Measure phase
- Reused during Layout phase
- Invalidated when constraints change

### Z-Index Optimization

- Higher Z-index values render last (on top)
- No automatic layer merging (manual optimization required)

## Module Boundaries

### Runtime Package MUST NOT:

- Import Bubble Tea (`github.com/charmbracelet/bubbletea`)
- Import DSL parsers
- Import concrete components from `tui/components/`
- Direct terminal I/O operations
- Import lipgloss (except via render module adapter)

### Runtime Package CAN:

- Implement pure layout algorithms (Flex, Constraint)
- Calculate geometry
- Render to virtual canvas (CellBuffer)
- Dispatch events based on geometry
- Manage focus state

## Common Patterns

### Creating a Component

```go
type MyComponent struct {
    content string
    Style   runtime.Style
}

func NewMyComponent(content string) *MyComponent {
    return &MyComponent{
        content: content,
        Style:   runtime.NewStyle(),
    }
}

func (m *MyComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    // Calculate intrinsic size
    width := len(m.content)
    return runtime.Size{Width: width, Height: 1}
}

func (m *MyComponent) Render(buf *runtime.CellBuffer, box runtime.LayoutBox) {
    // Render to buffer
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

### Registering a Component

```go
func init() {
    registry.RegisterDefault("my", func() runtime.Component {
        return NewMyComponent("")
    })
}
```

## Testing Strategies

### Unit Tests

- Test Measure phase with various constraints
- Test Layout phase with different flex configurations
- Test Render output to CellBuffer

### Integration Tests

- Test full three-phase pipeline
- Test component interactions
- Test event dispatch

### E2E Tests

- Test complete UI layouts
- Test user workflows
- Test performance with large component trees

## Migration from Legacy

### Key Differences

1. **No Tree Traversal:** Legacy used component tree traversal; Runtime uses geometry
2. **Explicit Constraints:** Components receive explicit size constraints
3. **Phase Separation:** Measure, Layout, Render are distinct phases
4. **No Direct Tea:** Runtime doesn't depend on Bubble Tea

### Migration Steps

1. Implement `Component` interface (Measure, Render, HandleEvent)
2. Register in `registry`
3. Update DSL factory if needed
4. Add tests

## Debugging

### Enable Debug Output

```go
runtime.SetDebug(true)
```

### Visualize Layout Tree

```go
debug.DebugTree(root, 0)
```

### Export Frames

```go
export.ExportTXT(frame, "output.txt")
export.ExportSVG(frame, "output.svg")
export.ExportPNG(frame, "output.png")
```

## Future Enhancements

### Phase 3: Event System

- Full event bubbling
- Event delegation
- Mouse event support

### Phase 4: Performance

- Frame-to-frame diffing (✅ implemented in diff.go)
- Incremental rendering
- Layout caching

### Phase 5: Advanced Features

- Grid layout system
- Wrap layout
- Rich text formatting
- Animations

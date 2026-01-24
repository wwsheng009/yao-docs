# TUI Layout System

A flexible, responsive layout system for Yao's Terminal UI (TUI) framework, inspired by CSS Flexbox and Grid layouts.

## Features

- **Flexbox Layout**: Flexible box layout with support for row/column direction, alignment, justification, and flex grow
- **Grid Layout**: CSS-like grid layout with configurable columns and rows
- **Absolute Positioning**: Absolute positioning support for precise control
- **Nested Layouts**: Fully nested layout support for complex UI hierarchies
- **Responsive Design**: Automatic adaptation to terminal size changes
- **Padding & Margins**: Full support for padding and margins
- **Size Constraints**: Min/Max width and height constraints
- **Gap Support**: Flex gap for spacing between elements

## Installation

The layout system is included in the `tui/layout` package:

```go
import "github.com/yaoapp/yao/tui/layout"
```

## Quick Start

### Creating a Flex Container

```go
import (
    "github.com/yaoapp/yao/tui/layout"
)

root := layout.NewFlexContainer("root", layout.DirectionColumn)
layout.ApplyStyle(root,
    layout.WithFlexDirection(layout.DirectionRow),
    layout.WithAlignItems(layout.AlignCenter),
    layout.WithJustify(layout.JustifyCenter),
    layout.WithGap(2),
)
```

### Creating a Grid Container

```go
grid := layout.NewGridContainer("grid")
layout.ApplyStyle(grid,
    layout.WithGap(1),
)
```

### Adding Components

```go
child1 := layout.NewFlexContainer("child1", layout.DirectionRow)
layout.ApplyStyle(child1, layout.WithWidth(30))

child2 := layout.NewFlexContainer("child2", layout.DirectionRow)
layout.ApplyStyle(child2, layout.WithWidth("flex"))

root.Children = append(root.Children, child1, child2)
child1.Parent = root
child2.Parent = root
```

### Using the Layout Engine

```go
config := &layout.LayoutConfig{
    Root: root,
    WindowSize: &layout.WindowSize{
        Width:  80,
        Height: 24,
    },
}

engine := layout.NewEngine(config)
result := engine.Layout()

for _, node := range result.Nodes {
    fmt.Printf("Node %s: x=%d, y=%d, w=%d, h=%d\n",
        node.ID, node.Bound.X, node.Bound.Y,
        node.Bound.Width, node.Bound.Height)
}
```

## Layout Types

### Flexbox

Flexbox provides flexible box layout with one-dimensional control.

**Properties:**

- `Direction`: Row or Column
- `AlignItems`: Start, Center, End, Stretch
- `Justify`: Start, Center, End, SpaceBetween, SpaceAround, SpaceEvenly
- `Wrap`: Enable/disable wrapping
- `Gap`: Spacing between children

**Example:**

```go
flexContainer := layout.NewFlexContainer("flex", layout.DirectionRow)
layout.ApplyStyle(flexContainer,
    layout.WithFlexDirection(layout.DirectionRow),
    layout.WithAlignItems(layout.AlignCenter),
    layout.WithJustify(layout.JustifySpaceBetween),
    layout.WithGap(2),
)
```

### Grid

Grid provides two-dimensional layout with columns and rows.

**Properties:**

- `Columns`: Number of columns (default 2)
- `Gap`: Spacing between cells
- Auto-sizing of rows based on content

**Example:**

```go
gridContainer := layout.NewGridContainer("grid")
layout.ApplyStyle(gridContainer,
    layout.WithGap(1),
)
```

### Absolute

Absolute positioning allows precise pixel-based positioning.

**Properties:**

- `Position`: Absolute
- `Left`, `Top`, `Right`, `Bottom`: Position coordinates

**Example:**

```go
absContainer := layout.NewAbsoluteContainer("absolute")
child := layout.NewFlexContainer("child", layout.DirectionColumn)
layout.ApplyStyle(child,
    layout.WithPosition(layout.PositionAbsolute),
    layout.WithPositioning(10, 10, 0, 0),
    layout.WithWidth(20),
    layout.WithHeight(10),
)
```

## Style Modifiers

The layout system provides functional style modifiers:

```go
layout.WithFlexDirection(layout.DirectionRow)
layout.WithAlignItems(layout.AlignCenter)
layout.WithJustify(layout.JustifyCenter)
layout.WithGap(5)
layout.WithPadding(2, 4, 2, 4)
layout.WithMargin(1, 2, 1, 2)
layout.WithWidth(100)
layout.WithHeight(50)
layout.WithMinWidth(50)
layout.WithMinHeight(30)
layout.WithMaxWidth(200)
layout.WithMaxHeight(150)
layout.WithPosition(layout.PositionAbsolute)
layout.WithPositioning(10, 20, 0, 0)
```

## Responsive Design

The layout engine automatically handles window size changes:

```go
engine := layout.NewEngine(config)

result := engine.Layout()

engine.UpdateWindowSize(100, 50)
result = engine.Layout()
```

## Nested Layouts

The layout system supports arbitrary nesting:

```go
root := layout.NewFlexContainer("root", layout.DirectionColumn)

sidebar := layout.NewFlexContainer("sidebar", layout.DirectionColumn)
main := layout.NewFlexContainer("main", layout.DirectionRow)

sidebarItem := layout.NewFlexContainer("sidebar-item", layout.DirectionRow)
sidebar.Children = append(sidebar.Children, sidebarItem)
sidebarItem.Parent = sidebar

root.Children = append(root.Children, sidebar, main)
sidebar.Parent = root
main.Parent = root
```

## Working with Components

The layout system integrates with existing TUI components:

```go
import (
    "github.com/yaoapp/yao/tui/core"
)

componentInstance := &core.ComponentInstance{
    ID:       "my-component",
    Type:     "text",
    Instance: textComponent,
}

componentNode := layout.NewComponentNode("comp", componentInstance)
root.Children = append(root.Children, componentNode)
componentNode.Parent = root
```

## Demo Configuration Files

Example layout configurations are available in `tui/demo/tuis/`:

- `flexbox-demo.tui.yao`: Flexbox layout example
- `grid-demo.tui.yao`: Grid layout example
- `nested-demo.tui.yao`: Deep nested layout example

## Testing

Run the layout tests:

```bash
go test ./tui/layout -v
```

## API Reference

### Types

- `LayoutType`: Flex, Grid, Absolute
- `Direction`: Row, Column
- `Align`: Start, Center, End, Stretch
- `Justify`: Start, Center, End, SpaceBetween, SpaceAround, SpaceEvenly
- `Position`: Relative, Absolute

### Core Functions

- `NewEngine(config *LayoutConfig) *Engine`: Create a new layout engine
- `NewBuilder() *Builder`: Create a new layout builder
- `NewFlexContainer(id string, direction Direction) *LayoutNode`: Create flex container
- `NewGridContainer(id string) *LayoutNode`: Create grid container
- `NewAbsoluteContainer(id string) *LayoutNode`: Create absolute container

### Engine Methods

- `Engine.Layout() *LayoutResult`: Perform layout calculation
- `Engine.UpdateWindowSize(width, height int)`: Update terminal size
- `Engine.MarkDirty(node *LayoutNode)`: Mark node as needing re-layout

### Utility Functions

- `FindNodeByID(root *LayoutNode, id string) *LayoutNode`: Find node by ID
- `GetNodePath(root *LayoutNode, id string) []*LayoutNode`: Get node path
- `ValidateLayoutTree(node *LayoutNode, parent *LayoutNode) error`: Validate layout tree

## Performance Considerations

- Dirty flagging system for efficient partial re-layout
- Cached metrics for repeated calculations
- Linear layout complexity for typical use cases
- Minimal allocations during layout computation

## License

Part of the Yao project. See LICENSE for details.

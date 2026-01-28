# TUI Runtime API Documentation

This document provides comprehensive API documentation for the Yao TUI Runtime system.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Runtime Package](#runtime-package)
- [Render Package](#render-package)
- [Event Package](#event-package)
- [Focus Management](#focus-management)
- [Components](#components)

---

## Overview

The TUI Runtime is a high-performance terminal UI framework built on Bubble Tea, featuring:

- **Three-Phase Rendering**: Measure → Layout → Render
- **Event System**: Capturing, At-Target, and Bubbling phases
- **Focus Management**: Tab navigation with focus traps
- **Virtual Scrolling**: Efficient handling of large lists
- **Style Caching**: Performance optimization for repeated rendering
- **Component Library**: Calendar, Checkbox, Radio, and more

---

## Core Concepts

### Measurable Interface

Components implement the `Measurable` interface to participate in layout:

```go
type Measurable interface {
    Measure(constraints BoxConstraints) Size
}
```

### BoxConstraints

```go
type BoxConstraints struct {
    MinWidth  int
    MaxWidth  int
    MinHeight int
    MaxHeight int
}
```

### Cell and CellStyle

```go
type Cell struct {
    Char   rune
    Style  CellStyle
    ZIndex int
    NodeID string
}

type CellStyle struct {
    Bold          bool
    Italic        bool
    Underline     bool
    Strikethrough bool
    Blink         bool
    Reverse       bool
    Foreground    string
    Background    string
}
```

### Frame

```go
type Frame struct {
    Buffer *CellBuffer
    Width  int
    Height int
}
```

---

## Runtime Package

### LayoutNode

```go
type LayoutNode struct {
    ID       string
    Type     NodeType
    Style    *Style
    Parent   *LayoutNode
    Children []*LayoutNode
    Component *ComponentInstance
    Bound    LayoutBox
}
```

**Key Methods:**

- `NewLayoutNode(id, nodeType, style) *LayoutNode` - Create a new node
- `Measure(constraints) Size` - Measure the node
- `Layout(constraints) LayoutBox` - Layout the node
- `FindNode(id) *LayoutNode` - Find a child node by ID

### LayoutEngine

```go
type LayoutEngine struct {
    rootNode *LayoutNode
    cache    *layoutCache
}
```

**Key Methods:**

- `New(root *LayoutNode) *LayoutEngine` - Create a new layout engine
- `Layout() LayoutResult` - Perform layout calculation
- `Measure() Size` - Measure the root node
- `GetNodeByID(id) *LayoutNode` - Get a node by ID

### CellBuffer

```go
type CellBuffer struct {
    width  int
    height int
    cells  [][]Cell
}
```

**Key Methods:**

- `NewCellBuffer(width, height int) *CellBuffer` - Create a new buffer
- `Width() int` - Get buffer width
- `Height() int` - Get buffer height
- `GetCell(x, y int) Cell` - Get a cell
- `SetContent(x, y, zIndex, char, style, combo) Cell` - Set cell content
- `Clear()` - Clear all cells
- `Fill(char, style)` - Fill buffer with a character

---

## Render Package

### Lipgloss Adapter

```go
func LipglossToCellStyle(style lipgloss.Style) runtime.CellStyle
func LipglossToCellStyleCached(style lipgloss.Style) runtime.CellStyle
func RenderLipglossToBuffer(buf *CellBuffer, text string, style lipgloss.Style, x, y, zIndex int)
func MeasureLipglossText(text string, style lipgloss.Style) int
func MeasureLipglossTextCached(text string, style lipgloss.Style) int
```

### Frame Diffing

```go
type DiffResult struct {
    DirtyRegions []Rect
    HasChanges   bool
    ChangedCells int
}

func ComputeDiff(oldFrame, newFrame Frame) DiffResult
func RenderWithDiff(buffer *CellBuffer, newFrame Frame, diff DiffResult)
func GetChangedCellsCount(oldFrame, newFrame Frame) int
func ShouldRerender(oldFrame, newFrame Frame, threshold float64) bool
func OptimizeFrame(oldFrame, newFrame Frame) Frame
```

### Caching

```go
type Cache struct {
    // Private fields
}

type CacheConfig struct {
    MaxSize     int
    TTL         time.Duration
    EnableStats bool
}

func NewCache(config CacheConfig) *Cache
func GetGlobalCache() *Cache
func (c *Cache) GetStyle(style lipgloss.Style) (CellStyle, bool)
func (c *Cache) SetStyle(style lipgloss.Style, cellStyle CellStyle)
func (c *Cache) Stats() CacheStats
```

### Viewport (Virtual Scrolling)

```go
type Viewport struct {
    // Private fields
}

func NewViewport(contentWidth, contentHeight, viewportWidth, viewportHeight int) *Viewport
func (v *Viewport) GetVisibleRange() (startX, endX, startY, endY int)
func (v *Viewport) ScrollTo(x, y int)
func (v *Viewport) ScrollBy(dx, dy int)
func (v *Viewport) IsVisible(x, y, width, height int) bool
func (v *Viewport) GetVisibleRows(itemHeight int) []int
```

---

## Event Package

### Event Types

```go
type EventType int

const (
    EventTypeMouse EventType = iota
    EventTypeKey
    EventTypeResize
    EventTypeCustom
)
```

### Event

```go
type Event struct {
    Type   EventType
    Mouse  *MouseEvent
    Key    *KeyEvent
    Resize *ResizeEvent
    Custom interface{}

    // Propagation control
    Phase          EventPhase
    CurrentTarget  *LayoutNode
    Target         *LayoutNode
    StoppedPropagation bool
    StoppedImmediatePropagation bool
}
```

### Event Dispatcher

```go
type EventDispatcher struct {
    // Private fields
}

func NewEventDispatcher() *EventDispatcher
func (d *EventDispatcher) Dispatch(event Event, boxes []LayoutBox) EventResult
func (d *EventDispatcher) SetDelegate(priority DelegationPriority, handler DelegateHandler)
```

### Event Phases

Events propagate in three phases:

1. **Capturing Phase**: Root → Target (event goes down the tree)
2. **At-Target Phase**: Handler at target executes
3. **Bubbling Phase**: Target → Root (event goes up the tree)

**Example:**

```go
func (c *MyComponent) handleMouse(ev event.Event) event.EventResult {
    switch ev.Phase {
    case event.PhaseCapturing:
        // Handle during capture phase
    case event.PhaseAtTarget:
        // Handle at target
    case event.PhaseBubbling:
        // Handle during bubbling
    }

    return event.Handled
}
```

---

## Focus Management

### Focus Manager

```go
type Manager struct {
    // Private fields
}

func NewFocusManager(rootNode *LayoutNode) *Manager
func (fm *Manager) Register(componentID string)
func (fm *Manager) FocusNext() (string, bool)
func (fm *Manager) FocusPrevious() (string, bool)
func (fm *Manager) FocusFirst() (string, bool)
func (fm *Manager) FocusLast() (string, bool)
func (fm *Manager) GetFocused() (string, bool)
func (fm *Manager) IsFocusable(componentID string) bool
```

### Focus Trap

```go
type TrapType int

const (
    TrapModal TrapType = iota
    TrapDialog
)

type FocusTrap struct {
    ID       string
    Type     TrapType
    RootNode *LayoutNode
    Active   bool
}

func NewFocusTrap(id string, trapType TrapType, rootNode *LayoutNode) *FocusTrap
func (ft *FocusTrap) Activate()
func (ft *FocusTrap) Deactivate()
func (ft *FocusTrap) Contains(componentID string) bool
```

**Example: Modal with Focus Trap**

```go
modal := components.NewModal("Confirm")
modalTrap := focus.NewFocusTrap("modal-confirm", focus.TrapModal, modal.ToLayoutNode("modal"))

// Activate trap when modal opens
modalTrap.Activate()

// User can't tab out of modal
// Tab navigation stays within modal

// Deactivate when modal closes
modalTrap.Deactivate()
```

---

## Components

### ComponentInterface

All components implement the core interface:

```go
type ComponentInterface interface {
    // Rendering
    View() string
    Render(config RenderConfig) (string, error)

    // Size Notification
    SetSize(width, height int)
    // Called by Runtime before rendering to inform the component
    // of the actual space allocated by the layout algorithm

    // Layout Measurement
    Measure(constraints BoxConstraints) Size
    // Called during Measure phase to calculate ideal size

    // Lifecycle
    Init() tea.Cmd
    UpdateMsg(msg tea.Msg) (ComponentInterface, tea.Cmd, Response)
    Cleanup()

    // Metadata
    GetID() string
    GetComponentType() string
    GetStateChanges() (map[string]interface{}, bool)
    GetSubscribedMessageTypes() []string

    // Focus
    SetFocus(focused bool)
    IsFocusable() bool
    IsFocused() bool
    GetFocus() bool
}
```

### Calendar

```go
type CalendarComponent struct {
    // Private fields
}

func NewCalendar() *CalendarComponent
func (c *CalendarComponent) WithDate(year int, month time.Month, day int) *CalendarComponent
func (c *CalendarComponent) WithWeekStart(weekStart int) *CalendarComponent
func (c *CalendarComponent) WithOnDateSelect(fn func(year int, month time.Month, day int)) *CalendarComponent
func (c *CalendarComponent) NextMonth()
func (c *CalendarComponent) PrevMonth()
func (c *CalendarComponent) GoToToday()
func (c *CalendarComponent) GetSelectedDate() (year int, month time.Month, day int)
```

**Keyboard Shortcuts:**

- Arrow keys: Navigate between days
- PageUp/PageDown: Navigate between months
- Home: Go to today
- Space/Enter: Select date

### Checkbox

```go
type CheckboxComponent struct {
    // Private fields
}

func NewCheckbox(label string) *CheckboxComponent
func (c *CheckboxComponent) WithChecked(checked bool) *CheckboxComponent
func (c *CheckboxComponent) WithOnChange(fn func(checked bool)) *CheckboxComponent
func (c *CheckboxComponent) Toggle()
func (c *CheckboxComponent) IsChecked() bool
```

**Keyboard Shortcuts:**

- Space/Enter: Toggle checkbox

### Radio

```go
type RadioOption struct {
    Label string
    Value string
}

type RadioComponent struct {
    // Private fields
}

func NewRadio(options []RadioOption) *RadioComponent
func (r *RadioComponent) WithSelected(index int) *RadioComponent
func (r *RadioComponent) WithSelectedByValue(value string) *RadioComponent
func (r *RadioComponent) WithVertical(vertical bool) *RadioComponent
func (r *RadioComponent) WithOnChange(fn func(value string)) *RadioComponent
func (r *RadioComponent) SelectOption(index int)
func (r *RadioComponent) GetSelectedValue() string
```

**Keyboard Shortcuts:**

- Left/Right arrows: Cycle through options
- Space: Select first option if none selected

---

## Usage Examples

### Creating a Simple Component

```go
package main

import (
    "github.com/yaoapp/yao/tui/runtime"
    "github.com/yaoapp/yao/tui/ui/components"
)

type MyComponent struct {
    text string
}

func (m *MyComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    textWidth := len([]rune(m.text))
    width, height := constraints.Constrain(textWidth, 1)
    return runtime.Size{Width: width, Height: height}
}

func (m *MyComponent) View() string {
    return m.text
}
```

### Using the Layout Engine

```go
root := runtime.NewLayoutNode("root", runtime.NodeTypeColumn, runtime.NewStyle())

child1 := components.NewText("Hello").ToLayoutNode("text1")
child2 := components.NewButton("Click").ToLayoutNode("btn1")

root.Children = []*runtime.LayoutNode{child1, child2}

engine := runtime.NewLayoutEngine(root)
engine.Layout()
```

### Handling Events

```go
func (c *MyComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch ev := msg.(type) {
    case tea.KeyMsg:
        switch ev.String() {
        case "q":
            return c, tea.Quit, core.Handled
        case "enter":
            // Handle enter key
            return c, nil, core.Handled
        }
    }
    return c, nil, core.Ignored
}
```

### Using Focus Management

```go
focusManager := focus.NewFocusManager(rootNode)

// Register focusable components
focusManager.Register("button1")
focusManager.Register("input1")
focusManager.Register("checkbox1")

// Navigate focus
if focused, hasFocus := focusManager.FocusNext(); hasFocus {
    // Move focus to focused component
}
```

### Virtual Scrolling with Large Lists

```go
type VirtualList struct {
    itemCount     int
    itemHeight    int
    viewport      *render.Viewport
    state         *render.VirtualListState
}

func (vl *VirtualList) View() string {
    // Get visible items only
    visibleItems := vl.state.GetVisibleItems(vl.itemHeight)

    // Render only visible items
    for _, index := range visibleItems {
        // Render item at index
    }

    return ""
}
```

---

## Performance Considerations

### Caching

The global cache provides 6.5x speedup for text measurement:

```go
// Uncached: 2823 ns/op
// Cached: 433 ns/op

// Use cached versions for better performance
width := render.MeasureLipglossTextCached(text, style)
```

### Frame Diffing

Only re-render changed cells:

```go
diff := render.ComputeDiff(oldFrame, newFrame)

if diff.HasChanges {
    render.RenderWithDiff(buffer, newFrame, diff)
}
```

### Virtual Scrolling

Only render visible items:

```go
viewport := render.NewViewport(totalWidth, totalHeight, viewWidth, viewHeight)
visibleRows := viewport.GetVisibleRows(itemHeight)

// Only render visibleRows instead of all items
```

---

## API Reference

### Runtime Package

| Function                         | Description               |
| -------------------------------- | ------------------------- |
| `NewLayoutNode(id, type, style)` | Create a new layout node  |
| `NewStyle()`                     | Create a new style object |
| `NewCellBuffer(w, h)`            | Create a new cell buffer  |
| `NewLayoutEngine(root)`          | Create a layout engine    |
| `Size{Width, Height}`            | Create a size object      |
| `BoxConstraints{...}`            | Create layout constraints |

### Render Package

| Function                                        | Description                 |
| ----------------------------------------------- | --------------------------- |
| `ComputeDiff(old, new)`                         | Compare two frames          |
| `RenderWithDiff(buf, new, diff)`                | Render only changed regions |
| `NewViewport(contentW, contentH, viewW, viewH)` | Create viewport             |
| `GetGlobalCache()`                              | Get global cache instance   |
| `LipglossToCellStyle(style)`                    | Convert lipgloss style      |

### Focus Package

| Function                       | Description          |
| ------------------------------ | -------------------- |
| `NewFocusManager(root)`        | Create focus manager |
| `NewFocusTrap(id, type, root)` | Create focus trap    |
| `TrapModal`, `TrapDialog`      | Trap type constants  |

### Event Package

| Function                                           | Description             |
| -------------------------------------------------- | ----------------------- |
| `NewEventDispatcher()`                             | Create event dispatcher |
| `PhaseCapturing`, `PhaseAtTarget`, `PhaseBubbling` | Event phases            |
| `Handled`, `Ignored`                               | Response values         |

---

## See Also

- [Getting Started Guide](GETTING_STARTED.md)
- [Component Examples](../examples/)
- [Bubble Tea Documentation](https://github.com/charmbracelet/bubbletea)

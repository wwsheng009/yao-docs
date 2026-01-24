# Getting Started with Yao TUI

This guide will help you create your first terminal UI application using the Yao TUI Runtime.

## Table of Contents

- [Installation](#installation)
- [Your First TUI App](#your-first-tui-app)
- [Building Components](#building-components)
- [Layout Management](#layout-management)
- [Event Handling](#event-handling)
- [Focus Management](#focus-management)
- [Advanced Topics](#advanced-topics)

---

## Installation

```bash
go get github.com/yaoapp/yao
go build -o yao cmd/main.go
```

---

## Your First TUI App

### Basic Hello World

Create a file `main.go`:

```go
package main

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui"
)

type model struct{}

func (m model) Init() tea.Cmd {
    return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    return m, nil
}

func (m model) View() string {
    return lipgloss.NewStyle().
        Foreground(lipgloss.Color("cyan")).
        Bold(true).
        Render("Hello, Yao TUI!")
}

func main() {
    p := tea.NewProgram(model{})
    if err := p.Start(); err != nil {
        panic(err)
    }
}
```

### Run the App

```bash
go run main.go
```

---

## Building Components

### Creating a Text Component

```go
package components

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/core"
    "github.com/yaoapp/yao/tui/runtime"
)

type TextComponent struct {
    text   string
    style  lipgloss.Style
}

func NewText(text string) *TextComponent {
    return &TextComponent{
        text:  text,
        style: lipgloss.NewStyle(),
    }
}

func (t *TextComponent) View() string {
    return t.style.Render(t.text)
}

func (t *TextComponent) Measure(constraints runtime.BoxConstraints) runtime.Size {
    textWidth := lipgloss.Width(t.text)
    width, height := constraints.Constrain(textWidth, 1)
    return runtime.Size{Width: width, Height: height}
}

// Implement core.ComponentInterface
func (t *TextComponent) Init() tea.Cmd { return nil }
func (t *TextComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    return t, nil, core.Ignored
}
func (t *TextComponent) GetID() string { return "text" }
func (t *TextComponent) GetComponentType() string { return "text" }
func (t *TextComponent) Render(config core.RenderConfig) (string, error) {
    return t.View(), nil
}
func (t *TextComponent) UpdateRenderConfig(config core.RenderConfig) error {
    return nil
}
func (t *TextComponent) GetStateChanges() (map[string]interface{}, bool) {
    return nil, false
}
func (t *TextComponent) GetSubscribedMessageTypes() []string {
    return []string{}
}
func (t *TextComponent) Cleanup() { return nil }
func (t *TextComponent) GetBoundMethod(name string) (interface{}, error) {
    return nil, nil
}
func (t *TextComponent) Validate() error { return nil }
func (t *TextComponent) GetFocus() bool { return false }
func (t *Component) SetFocus(bool) {}
func (t *Component) IsFocusable() bool { return false }
func (t *Component) IsFocused() bool { return false }
func (t *Component) ToLayoutNode(id string) *runtime.LayoutNode {
    node := runtime.NewLayoutNode(id, runtime.NodeTypeCustom, runtime.NewStyle())
    node.Component = &core.ComponentInstance{Instance: t}
    return node
}
```

### Using the Component

```go
type model struct {
    text *TextComponent
}

func (m model) Init() tea.Cmd {
    m.text = NewText("Hello, World!")
    return nil
}

func (m model) View() string {
    return m.text.View()
}
```

---

## Layout Management

### Using the Layout Engine

```go
import (
    "github.com/yaoapp/yao/tui/runtime"
    "github.com/yaoapp/yao/tui/runtime"
)

func createLayout() *runtime.LayoutEngine {
    // Create root container
    root := runtime.NewLayoutNode(
        "root",
        runtime.NodeTypeColumn,
        runtime.NewStyle(),
    )

    // Create header
    header := components.NewText("My App").
        ToLayoutNode("header")

    // Create content area
    content := components.NewText("Content here").
        ToLayoutNode("content")

    // Add children
    root.Children = []*runtime.LayoutNode{header, content}

    // Create and run layout
    engine := runtime.NewLayoutEngine(root)
    engine.Layout()

    return engine
}
```

### Flex Layout

```go
func createFlexLayout() *runtime.LayoutEngine {
    // Create flex container
    flex := runtime.NewLayoutNode(
        "flex",
        runtime.NodeTypeRow,
        runtime.NewStyle().
            WithFlex(1).       // Grow to fill available space
            WithPadding(10),
    )

    // Add flex items
    item1 := components.NewText("Item 1").ToLayoutNode("item1")
    item2 := components.NewText("Item 2").ToLayoutNode("item2")
    item3 := components.NewText("Item 3").ToLayoutNode("item3")

    flex.Children = []*runtime.LayoutNode{item1, item2, item3}

    return runtime.NewLayoutEngine(flex)
}
```

---

## Event Handling

### Keyboard Events

```go
type model struct {
    selectedOption int
    options []string
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "up", "k":
            if m.selectedOption > 0 {
                m.selectedOption--
            }
        case "down", "j":
            if m.selectedOption < len(m.options)-1 {
                m.selectedOption++
            }
        case "q", "ctrl+c":
            return m, tea.Quit
        }
    }
    return m, nil
}
```

### Mouse Events

```go
func (c *MyComponent) handleMouse(ev event.Event) event.EventResult {
    mouse := ev.Mouse
    if mouse == nil {
        return event.Ignored
    }

    switch mouse.Action {
    case event.MousePress:
        if mouse.Button == event.MouseLeft {
            // Handle left click
            return event.Handled
        }
    case event.MouseRelease:
        // Handle release
    case event.MouseMove:
        // Handle mouse move
    }

    return event.Ignored
}
```

---

## Focus Management

### Setting Up Focus Navigation

```go
import "github.com/yaoapp/yao/tui/runtime/focus"

func createFocusManager(root *runtime.LayoutNode) *focus.Manager {
    fm := focus.NewFocusManager(root)

    // Register focusable components
    fm.Register("button1")
    fm.Register("button2")
    fm.Register("input1")

    return fm
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "tab":
            if focused, ok := m.focusManager.FocusNext(); ok {
                // Update focus state
            }
        case "shift+tab":
            if focused, ok := m.focusManager.FocusPrevious(); ok {
                // Update focus state
            }
        }
    }
    return m, nil
}
```

### Focus Traps for Modals

```go
import "github.com/yaoapp/yao/tui/runtime/focus"

func showModal(modal *components.ModalComponent) {
    // Create focus trap for modal
    trap := focus.NewFocusTrap(
        "modal-trap",
        focus.TrapModal,
        modal.ToLayoutNode("modal"),
    )

    // Activate trap
    trap.Activate()
    defer trap.Deactivate()

    // Run modal
    // User can't tab out of modal
}
```

---

## Advanced Topics

### Virtual Scrolling for Large Lists

```go
import "github.com/yaoapp/yao/tui/runtime/render"

type VirtualListModel struct {
    itemCount    int
    itemHeight   int
    viewport     *render.Viewport
    virtualState *render.VirtualListState
}

func NewVirtualList(items []string) *VirtualListModel {
    itemCount := len(items)
    itemHeight := 1 // Height per item in rows
    viewportWidth := 80
    viewportHeight := 24

    return &VirtualListModel{
        itemCount:  itemCount,
        itemHeight:  itemHeight,
        viewport: render.NewViewport(
            itemCount * itemHeight,
            itemCount,
            viewportWidth,
            viewportHeight,
        ),
        virtualState: render.NewVirtualListState(render.VirtualListConfig{
            ItemCount:     itemCount,
            ItemHeight:    itemHeight,
            ViewportWidth:  viewportWidth,
            ViewportHeight: viewportHeight,
        }),
    }
}

func (m *VirtualListModel) View() string {
    // Get only visible item indices
    visibleIndices := m.virtualState.GetVisibleRows(m.itemHeight)

    // Render only visible items
    var result string
    for _, idx := range visibleIndices {
        if idx < len(m.items) {
            result += m.items[idx] + "\n"
        }
    }

    return result
}

func (m *VirtualListModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "up", "k":
            // Scroll up one line
            m.viewport.ScrollBy(0, -1)
        case "down", "j":
            // Scroll down one line
            m.viewport.ScrollBy(0, 1)
        case "pgup":
            m.viewport.ScrollPageUp()
        case "pgdown":
            m.viewport.ScrollPageDown()
        }
    }
    return m, nil
}
```

### Using the Cache for Performance

```go
import "github.com/yaoapp/yao/tui/runtime/render"

// Set up cache with custom configuration
cache := render.NewCache(render.CacheConfig{
    MaxSize:     2000,
    TTL:         10 * time.Minute,
    EnableStats: true,
})

// Use cached functions for better performance
func renderText(text string, style lipgloss.Style) string {
    // Check cache first
    if rendered, ok := cache.GetRenderedText(text, style); ok {
        return rendered
    }

    // Not in cache, compute and store
    rendered := style.Render(text)
    cache.SetRenderedText(text, style, rendered)

    return rendered
}
```

### Frame Diffing for Incremental Updates

```go
import "github.com/yaoapp/yao/tui/runtime/render"

type AppModel struct {
    oldFrame render.Frame
    buffer   *runtime.CellBuffer
}

func (m *AppModel) renderNewContent() {
    // Create new frame
    newFrame := render.Frame{
        Buffer: m.buffer,
        Width:  m.buffer.Width(),
        Height: m.buffer.Height(),
    }

    // Only update changed cells
    diff := render.ComputeDiff(m.oldFrame, newFrame)

    if diff.HasChanges {
        render.RenderWithDiff(m.oldFrame, newFrame, diff)
    }

    m.oldFrame = newFrame
}

func (m *AppModel) shouldRerender() bool {
    newFrame := m.getCurrentFrame()

    // Only rerender if more than 50% changed
    return render.ShouldRerender(m.oldFrame, newFrame, 0.5)
}
```

### Custom Component with Styling

```go
import (
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/runtime"
    "github.com/yaoapp/yao/tui/runtime/render"
)

type StyledBox struct {
    content string
    style   lipgloss.Style
    border  bool
}

func NewStyledBox(content string) *StyledBox {
    return &StyledBox{
        content: content,
        style: lipgloss.NewStyle().
            Padding(1, 2).
            Foreground(lipgloss.Color("white")),
        border: true,
    }
}

func (s *StyledBox) Measure(constraints runtime.BoxConstraints) runtime.Size {
    lines := strings.Split(s.content, "\n")
    maxWidth := 0
    for _, line := range lines {
        w := lipgloss.Width(line)
        if w > maxWidth {
            maxWidth = w
        }
    }

    width, height := constraints.Constrain(
        maxWidth+4, // +4 for padding
        len(lines)+2, // +2 for padding
    )

    return runtime.Size{Width: width, Height: height}
}

func (s *StyledBox) View() string {
    result := s.style.Render(s.content)

    if s.border {
        border := lipgloss.NewStyle().
            Border(lipgloss.RoundedBorder()).
            BorderForeground(lipgloss.Color("cyan"))

        result = border.Render(result)
    }

    return result
}

func (s *StyledBox) RenderToBuffer(buffer *runtime.CellBuffer, x, y, width, height int) {
    // Render using cached style conversion
    cellStyle := render.LipglossToCellStyleCached(s.style)

    // Render background
    for row := 0; row < height; row++ {
        for col := 0; col < width; col++ {
            if x+col < buffer.Width() && y+row < buffer.Height() {
                buffer.SetContent(x+col, y+row, 0, ' ', cellStyle, "")
            }
        }
    }

    // Render content
    lines := strings.Split(s.content, "\n")
    for i, line := range lines {
        if y+i < buffer.Height() {
            for j, r := range line {
                if x+j+2 < buffer.Width() && y+i < buffer.Height() { // +2 for left padding
                    buffer.SetContent(x+j+2, y+i, 0, r, cellStyle, "")
                }
            }
        }
    }
}
```

### Using the Calendar Component

```go
import "github.com/yaoapp/yao/tui/ui/components"
import "time"

type CalendarModel struct {
    calendar *components.CalendarComponent
    selectedDate time.Time
}

func (m *CalendarModel) Init() tea.Cmd {
    m.calendar = components.NewCalendar().
        WithDate(2024, time.January, 15).
        WithOnDateSelect(func(year int, month time.Month, day int) {
            m.selectedDate = time.Date(year, month, day, 0, 0, 0, time.Local)
        })

    return nil
}

func (m CalendarModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    var cmd tea.Cmd

    // Update calendar
    m.calendar, cmd = m.calendar.UpdateMsg(msg)

    // Handle calendar navigation
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "pgup":
            m.calendar.PrevMonth()
        case "pgdown":
            m.calendar.NextMonth()
        case "home":
            m.calendar.GoToToday()
        }
    }

    return m, cmd
}

func (m CalendarModel) View() string {
    return m.calendar.View()
}
```

### Checkbox Group

```go
import "github.com/yaoapp/yao/tui/ui/components"

type SettingsModel struct {
    notificationsEnabled *components.CheckboxComponent
    autoSave              *components.CheckboxComponent
    darkMode              *components.CheckboxComponent
}

func (m *SettingsModel) Init() tea.Cmd {
    m.notificationsEnabled = components.NewCheckbox("Enable Notifications").
        WithChecked(true).
        WithOnChange(func(checked bool) {
            // Enable/disable notifications
        })

    m.autoSave = components.NewCheckbox("Auto Save").
        WithChecked(false).
        WithOnChange(func(checked bool) {
            // Enable/disable auto save
        })

    m.darkMode = components.NewCheckbox("Dark Mode").
        WithChecked(false).
        WithOnChange(func(checked bool) {
            // Toggle dark mode
        })

    return nil
}

func (m SettingsModel) View() string {
    return "\n" +
        m.notificationsEnabled.View() + "\n" +
        m.autoSave.View() + "\n" +
        m.darkMode.View() + "\n"
}
```

### Radio Button Group

```go
type ThemeModel struct {
    themeRadio *components.RadioComponent
}

func (m *ThemeModel) Init() tea.Cmd {
    options := []components.RadioOption{
        {Label: "Light", Value: "light"},
        {Label: "Dark", Value: "dark"},
        {Label: "Auto", Value: "auto"},
    }

    m.themeRadio = components.NewRadio(options).
        WithSelected(2). // Auto selected by default
        WithLabel("Theme:").
        WithVertical(true).
        WithOnChange(func(value string) {
            // Change theme
        })

    return nil
}

func (m ThemeModel) View() string {
    return m.themeRadio.View()
}
```

---

## Complete Application Example

Here's a complete example combining all concepts:

```go
package main

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/core"
    "github.com/yaoapp/yao/tui/runtime"
    "github.com/yaoapp/yao/tui/runtime/event"
    "github.com/yaoapp/yao/tui/runtime/focus"
    "github.com/yaoapp/yao/tui/ui/components"
)

type model struct {
    focused    string
    focusMgr   *focus.Manager
    calendar   *components.CalendarComponent
    checkbox   *components.CheckboxComponent
    radio      *components.RadioComponent
    viewport   *render.Viewport
    items      []string
}

func (m model) Init() tea.Cmd {
    // Create focus manager
    root := runtime.NewLayoutNode("root", runtime.NodeTypeColumn, runtime.NewStyle())
    m.focusMgr = focus.NewFocusManager(root)

    // Create components
    m.calendar = components.NewCalendar().
        WithOnDateSelect(func(year int, month time.Month, day int) {
            // Handle date selection
        })

    m.checkbox = components.NewCheckbox("Enable Feature").
        WithChecked(true).
        WithOnChange(func(checked bool) {
            // Handle checkbox change
        })

    options := []components.RadioOption{
        {Label: "Option A", Value: "a"},
        {Label: "Option B", Value: "b"},
        {Label: "Option C", Value: "c"},
    }
    m.radio = components.NewRadio(options).
        WithVertical(true)

    // Create viewport for large list
    m.items = make([]string, 1000)
    for i := range m.items {
        m.items[i] = fmt.Sprintf("Item %d", i+1)
    }
    m.viewport = render.NewViewport(
        80,
        len(m.items),
        80,
        24,
    )

    // Register focusable components
    m.focusMgr.Register("calendar")
    m.focusMgr.Register("checkbox")
    m.focusMgr.Register("radio")

    return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "q", "ctrl+c":
            return m, tea.Quit
        case "tab":
            m.focusMgr.FocusNext()
        case "shift+tab":
            m.focusMgr.FocusPrevious()
        case "up", "k":
            m.viewport.ScrollBy(0, -1)
        case "down", "j":
            m.viewport.ScrollBy(0, 1)
        }

    // Update components
    m.calendar, _ = m.calendar.UpdateMsg(msg)
    m.checkbox, _ = m.checkbox.UpdateMsg(msg)
    m.radio, _ = m.radio.UpdateMsg(msg)

    return m, nil
}

func (m model) View() string {
    title := lipgloss.NewStyle().
        Foreground(lipgloss.Color("cyan")).
        Bold(true).
        Render("My TUI Application")

    calendarSection := lipgloss.NewStyle().
        Foreground(lipgloss.Color("white")).
        Render("\n" + m.calendar.View())

    checkboxSection := lipgloss.NewStyle().
        MarginTop(1).
        Render(m.checkbox.View())

    radioSection := lipgloss.NewStyle().
        MarginTop(1).
        Render(m.radio.View())

    listSection := m.renderList()

    return "\n" + title + "\n\n" +
        calendarSection + "\n" +
        checkboxSection + "\n" +
        radioSection + "\n\n" +
        listSection
}

func (m model) renderList() string {
    visibleRows := m.viewport.GetVisibleRows(1)

    var result string
    for _, idx := visibleRows {
        if idx < len(m.items) {
            focused := ""
            if m.focused == "list" {
                focused = "> "
            }
            result += focused + m.items[idx] + "\n"
        }
    }

    // Show scroll indicator
    scrollPercent := m.viewport.GetScrollPercent()
    if scrollPercent > 0 {
        result += fmt.Sprintf("\n[%.0f%%]", scrollPercent*100)
    }

    return result
}

func main() {
    p := tea.NewProgram(model{})
    if err := p.Start(); err != nil {
        panic(err)
    }
}
```

---

## Running Your Application

```bash
# Run the application
yao start

# Run in debug mode
yao start --debug

# Run a specific script
yao run scripts.my.Script
```

---

## Next Steps

- Explore the [API Documentation](API.md)
- Check out [Component Examples](../examples/)
- Read the [Runtime Design](tui/runtime/README.md)

---

## Troubleshooting

### Common Issues

**Issue**: Components not appearing

- Ensure `Measure()` returns proper size
- Check that `ToLayoutNode()` is called

**Issue**: Events not firing

- Verify component is registered in event dispatcher
- Check event phases and propagation

**Issue**: Focus not working

- Register components with focus manager
- Ensure `IsFocusable()` returns `true`
- Call `SetFocus(true)` on the component

### Getting Help

- [Documentation](https://yaoapps.com/docs)
- [GitHub Issues](https://github.com/yaoapp/yao/issues)
- [Community Forum](https://yaoapps.com/community)

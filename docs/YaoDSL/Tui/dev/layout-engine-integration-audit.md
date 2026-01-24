# TUI Layout Engine Integration Audit

## Executive Summary

This document analyzes how to integrate the new flexible layout engine (`tui/layout`) with the existing TUI rendering system to replace the current simple layout mechanism.

**Status:** 🔍 Analysis Complete
**Recommendation:** ✅ Recommended to proceed with phased integration

---

## Current TUI Rendering Architecture

### Core Components

```
Model.Update(msg) → Model.View() → RenderLayout() → renderLayoutNode()
                                    ↓
                              InitializeComponents()
                                    ↓
                        ComponentInstanceRegistry
                                    ↓
                          Component.Render()
```

### Key Files

| File                       | Lines | Purpose                       |
| -------------------------- | ----- | ----------------------------- |
| `render_engine.go`         | 224   | Main rendering logic          |
| `model.go`                 | 150+  | Bubble Tea model, View/Update |
| `component_initializer.go` | 147   | Component initialization      |
| `message_handlers.go`      | 100+  | Message routing               |

### Current Layout System

**Strengths:**

- ✅ Simple, easy to understand
- ✅ Works with Bubble Tea
- ✅ Recursive depth protection (max 50 levels)
- ✅ Component lifecycle management

**Limitations:**

- ❌ Only horizontal/vertical direction
- ❌ No flex grow/shrink
- ❌ No grid layout
- ❌ No absolute positioning
- ❌ Limited padding support
- ❌ No responsive design
- ❌ Simple lipgloss.Join (no custom calculation)

### Current API

```go
func (m *Model) RenderLayout() string
func (m *Model) renderLayoutNode(layout *Layout, width, height int, depth int) string
func (m *Model) RenderComponent(comp *Component) string
```

---

## New Layout Engine Architecture

### Core Components

```
LayoutConfig → Engine.Layout() → LayoutResult
                    ↓
           layoutFlex(), layoutGrid(), layoutAbsolute()
                    ↓
             Calculate bounds for each node
                    ↓
              Renderer.RenderNode()
```

### Key Files

| File                 | Lines | Purpose                   |
| -------------------- | ----- | ------------------------- |
| `layout/types.go`    | 186   | Type definitions          |
| `layout/engine.go`   | 551   | Layout calculation engine |
| `layout/builder.go`  | 288   | Layout tree builder       |
| `layout/renderer.go` | 195   | Rendering interface       |

### New Layout Engine Features

**Strengths:**

- ✅ Flexbox with grow/shrink
- ✅ Grid layout (2D)
- ✅ Absolute positioning
- ✅ Responsive design
- ✅ Full box model (padding/margin/gap)
- ✅ Min/max constraints
- ✅ Dirty flagging for optimization

### New Engine API

```go
func NewEngine(config *LayoutConfig) *Engine
func (e *Engine) Layout() *LayoutResult
func (e *Engine) UpdateWindowSize(width, height int)
func NewFlexContainer(id, direction) *LayoutNode
func ApplyStyle(node, ...modifiers)
```

---

## Integration Strategy: Three Phased Approach

### Phase 1: Config-to-LayoutTree Translation (Compatibility Layer)

**Objective:** Convert existing `Config.Layout` to new `LayoutNode` tree without changing behavior.

**Implementation:**

```go
// In tui/layout_adapter.go
package tui

import "github.com/yaoapp/yao/tui/layout"

type LayoutAdapter struct {
    model *Model
    engine *layout.Engine
}

func NewLayoutAdapter(model *Model) *LayoutAdapter {
    return &LayoutAdapter{model: model}
}

// Convert existing Config.Layout to new LayoutNode tree
func (a *LayoutAdapter) ConvertConfigToLayoutTree() *layout.LayoutNode {
    if a.model.Config == nil {
        return nil
    }

    root := a.convertLayoutNode(&a.model.Config.Layout, 0)

    // Create layout engine with converted tree
    engine := layout.NewEngine(&layout.LayoutConfig{
        Root: root,
        WindowSize: &layout.WindowSize{
            Width:  a.model.Width,
            Height: a.model.Height,
        },
    })

    a.engine = engine
    return root
}

func (a *LayoutAdapter) convertLayoutNode(l *Layout, depth int) *layout.LayoutNode {
    if l == nil || depth > maxLayoutDepth {
        return nil
    }

    builder := layout.NewBuilder()
    builder.PushContainer(&layout.ContainerConfig{
        Type: layout.LayoutFlex, // Default to flex
    })

    // Convert direction
    direction := layout.DirectionColumn
    if l.Direction == "horizontal" {
        direction = layout.DirectionRow
    }

    layout.ApplyStyle(builder.Current(),
        layout.WithFlexDirection(direction),
    )

    // Convert padding if present
    if len(l.Padding) > 0 {
        padding := l.Padding
        for len(padding) < 4 {
            padding = append(padding, padding[len(padding)-1])
        }
        layout.ApplyStyle(builder.Current(),
            layout.WithPadding(padding[0], padding[1], padding[2], padding[3]),
        )
    }

    // Recursively convert children
    for _, child := range l.Children {
        if child.Type == "layout" {
            if nestedLayout, ok := child.Props["layout"].(*Layout); ok {
                nestedNode := a.convertLayoutNode(nestedLayout, depth+1)
                if nestedNode != nil {
                    builder.AddNode(nestedNode)
                }
            }
        } else {
            // Create component node
            builder.AddComponent(nil, &layout.ComponentConfig{
                ID: child.ID,
            })
        }
        builder.Pop()
    }

    return builder.Root()
}

// Render using new layout engine
func (a *LayoutAdapter) Render() string {
    if a.engine == nil {
        return ""
    }

    result := a.engine.Layout()
    renderer := layout.NewRenderer(a.engine)

    // For now, delegate to existing component rendering
    var finalLines []string

    for _, node := range result.Nodes {
        if node.Component != nil {
            // Use existing RenderComponent logic
            content := a.model.renderComponentUsingNode(node)
            finalLines = append(finalLines, content)
        }
    }

    // Join lines based on layout
    return strings.Join(finalLines, "\n")
}
```

**Integration Point:**

```go
// In model.go
type Model struct {
    // ... existing fields ...

    // NEW: Layout adapter for new engine
    layoutAdapter *LayoutAdapter
    useNewLayoutEngine bool // Feature flag
}

func (m *Model) renderLayout() string {
    if m.useNewLayoutEngine {
        return m.renderLayoutWithNewEngine()
    }
    return m.RenderLayout() // OLD: Existing implementation
}

func (m *Model) renderLayoutWithNewEngine() string {
    if m.layoutAdapter == nil {
        m.layoutAdapter = NewLayoutAdapter(m)
    }

    // Trigger layout calculation on window size changes
    if !m.Ready {
        return "Initializing..."
    }

    return m.layoutAdapter.Render()
}
```

**Migration:** Toggle via config flag or environment variable

---

### Phase 2: Deep Integration (Component-Level)

**Objective:** Modify `LayoutNode.Component` integration to use existing component system.

**Implementation:**

1. **Extend LayoutNode initialization:**

```go
// In component_initializer.go
func (m *Model) InitializeComponentsWithLayout() []tea.Cmd {
    // Create layout tree and bind components
    adapter := NewLayoutAdapter(m)
    root := adapter.ConvertConfigToLayoutTree()

    // Walk layout tree and initialize each component node
    var allCmds []tea.Cmd
    m.initializeLayoutComponents(root, &allCmds)

    return allCmds
}

func (m *Model) initializeLayoutComponents(node *layout.LayoutNode, cmds *[]tea.Cmd) {
    if node == nil {
        return
    }

    // Initialize component instance if present
    if node.Component == nil && node.ID != "" {
        // Find component config from original layout
        compConfig := m.findComponentConfig(node.ID)
        if compConfig != nil {
            // Create and register component instance
            registry := GetGlobalRegistry()
            if err := m.initializeComponent(compConfig, registry, cmds); err != nil {
                log.Error("Failed to initialize component %s: %v", node.ID, err)
            }

            // Bind to layout node
            if instance, exists := m.ComponentInstanceRegistry.Get(node.ID); exists {
                node.Component = instance
            }
        }
    }

    // Recursively initialize children
    for _, child := range node.Children {
        m.initializeLayoutComponents(child, cmds)
    }
}

func (m *Model) findComponentConfig(id string) *Component {
    return findComponentInLayout(&m.Config.Layout, id)
}

func findComponentInLayout(l *Layout, id string) *Component {
    if l == nil {
        return nil
    }

    for _, child := range l.Children {
        if child.ID == id {
            return &child
        }

        if child.Type == "layout" {
            if nestedLayout, ok := child.Props["layout"].(*Layout); ok {
                if found := findComponentInLayout(nestedLayout, id); found != nil {
                    return found
                }
            }
        }
    }

    return nil
}
```

2. **Update Layout Renderer:**

```go
// In layout/renderer.go
func (r *Renderer) RenderNode(node *layout.Node) string {
    if node.Component != nil && node.Component.Instance != nil {
        config := core.RenderConfig{
            Width:  node.Bound.Width,
            Height: node.Bound.Height,
        }

        content, err := node.Component.Instance.Render(config)
        if err != nil {
            return r.renderError(node.ID, err)
        }

        return r.applyBounds(config, node.Bound, content)
    }

    return r.renderContainer(node)
}

func (r *Renderer) applyBounds(config core.RenderConfig, bound layout.Rect, content string) string {
    // Apply lipgloss styling to respect bounds
    style := lipgloss.NewStyle().
        Width(bound.Width).
        Height(bound.Height)

    return style.Render(content)
}
```

3. **Handle Window Size Updates:**

```go
// In message_handlers.go
handlers["tea.WindowSizeMsg"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    model, ok := m.(*Model)
    if !ok {
        return m.(tea.Model), nil
    }
    sizeMsg := msg.(tea.WindowSizeMsg)
    model.Width = sizeMsg.Width
    model.Height = sizeMsg.Height
    model.Ready = true

    // NEW: Notify layout engine of size change
    if model.useNewLayoutEngine && model.layoutAdapter != nil && model.layoutAdapter.engine != nil {
        model.layoutAdapter.engine.UpdateWindowSize(sizeMsg.Width, sizeMsg.Height)
    }

    // Broadcast window size to all components
    return model, m.dispatchMessageToAllComponents(msg)
}
```

---

### Phase 3: Full New Layout Format Support

**Objective:** Support new layout configuration format directly in `.tui.yao` files.

**New Configuration Format:**

```yaml
name: 'Modern TUI'
version: '1.0.0'

# New layout format
layout:
  type: flex
  direction: column
  gap: 1
  padding: [1, 2, 1, 2]
  align: center

  children:
    - id: header
      type: header
      props:
        text: '{{ title }}'
      layout:
        flex: 1

    - id: main-row
      type: flex
      direction: row
      justify: space-between
      children:
        - id: sidebar
          type: flex
          direction: column
          width: '30%'
          children:
            - id: nav-menu
              type: menu
              bind: 'menuItems'

        - id: content
          type: flex
          flex: 1
          children:
            - id: table
              type: table
              bind: 'data'
```

**Implementation:**

1. **Extend Config type:**

```go
// In types.go
type Config struct {
    // ... existing fields ...

    // NEW: Modern layout format
    ModernLayout *layout.LayoutNode `json:"modernLayout,omitempty"`

    // Backwards compatibility: Use new engine?
    UseModernLayout bool `json:"useModernLayout,omitempty"`
}

// Backwards compatible field
func (c *Config) GetLayout() *Layout {
    if c.ModernLayout != nil {
        return c.modernLayoutToLayoutType(c.ModernLayout)
    }
    return &c.Layout
}
```

2. **Direct layout tree loading:**

```go
// In loader.go
func convertModernLayoutToTree(node *layout.LayoutNode) *Layout {
    if node == nil {
        return &Layout{}
    }

    var children []Component

    for _, child := range node.Children {
        if child.Component != nil {
            comp := Component{
                ID:   child.ID,
                Type: child.Component.Type,
                Props: child.Props,
            }
            children = append(children, comp)
        } else {
            nested := convertModernLayoutToTree(child)
            comp := Component{
                Type: "layout",
                Props: map[string]interface{}{
                    "layout": nested,
                },
            }
            children = append(children, comp)
        }
    }

    direction := "column"
    if node.Style != nil && node.Style.Direction == layout.DirectionRow {
        direction = "horizontal"
    }

    return &Layout{
        Direction: direction,
        Children:  children,
        Style:     "",
        Padding:   []int{},
    }
}
```

---

## Integration Comparison

| Aspect                  | Current System     | New Layout Engine     | Integration Approach    |
| ----------------------- | ------------------ | --------------------- | ----------------------- |
| **Layout Calculation**  | lipgloss.Join      | Custom algorithm      | Phase 1: Adapter        |
| **Component Rendering** | Component.Render() | Same                  | Phase 2: Direct binding |
| **Configuration**       | Config.Layout      | LayoutNode            | Phase 3: New format     |
| **Responsive**          | Manual             | Automatic             | All phases              |
| **Nested Layouts**      | Supported (max 50) | Supported (unlimited) | All phases              |
| **Performance**         | O(n) per render    | O(n) + dirty check    | Phase 1+ optimization   |

---

## Risks and Mitigations

### Risk 1: Breaking Existing TUIs

**Mitigation:**

- Feature flag (`useNewLayoutEngine`)
- Backwards compatibility adapter
- Gradual rollout (Phase 1 → 2 → 3)

**Testing Strategy:**

```bash
# Test with old format
go test ./tui/... -tags="old_layout"

# Test with new format
go test ./tui/... -tags="new_layout"
```

### Risk 2: Performance Regression

**Mitigation:**

- Benchmark before/after
- Dirty flagging system
- Lazy layout calculation (only on size change)

**Benchmark:**

```go
func BenchmarkOldLayout(b *testing.B) {
    // Benchmark existing RenderLayout
}

func BenchmarkNewLayout(b *testing.B) {
    // Benchmark new Engine.Layout
}
```

### Risk 3: Complex Integration

**Mitigation:**

- Clean separation of concerns
- Clear adapter pattern
- Comprehensive unit tests (30 tests already passing)

---

## Recommended Implementation Order

### Step 1: Prepare (1 day)

- Create `layout_adapter.go` with adapter interface
- Add feature flag to `Config`
- Update `model.go` to support both engines

### Step 2: Phase 1 Implementation (2-3 days)

- Implement `ConvertConfigToLayoutTree()`
- Add `renderLayoutWithNewEngine()`
- Test with existing `.tui.yao` files
- Verify backwards compatibility

### Step 3: Phase 2 Implementation (3-4 days)

- Implement `InitializeComponentsWithLayout()`
- Improve `RenderNode()` to use bounds
- Update window size handler
- Test component interactions

### Step 4: Phase 3 Implementation (2-3 days)

- Extend `Config` with `ModernLayout`
- Implement new format loader
- Update documentation
- Migration guide for users

### Step 5: Validation (2 days)

- Benchmark comparison
- Compatibility testing
- Documentation review
- Final integration tests

**Total Estimated: 10-13 days**

---

## Success Criteria

✅ **Phase 1:**

- All existing TUIs work with feature flag enabled
- No performance regression (< 5% slower)
- Layout calculation matches expected output

✅ **Phase 2:**

- Components render within calculated bounds
- Interactive components work correctly
- Window size changes trigger re-layout

✅ **Phase 3:**

- New configuration format supported
- Demo TUIs use new format
- Migration guide complete

---

## Conclusion

The new layout engine is architecturally sound and ready for integration. The phased approach ensures:

1. ✅ No breaking changes
2. ✅ Gradual migration path
3. ✅ Thorough testing at each phase
4. ✅ Performance validation
5. ✅ Backwards compatibility

**Recommendation:** **Proceed with Phase 1 implementation immediately.**

The flexible layout engine provides significant improvements over the current system:

- Advanced layout capabilities (flexbox, grid, absolute)
- True responsive design
- Better control over component positioning
- Cleaner, more maintainable code
- Future-proof architecture

Integration complexity is manageable with adapter pattern and proper testing.

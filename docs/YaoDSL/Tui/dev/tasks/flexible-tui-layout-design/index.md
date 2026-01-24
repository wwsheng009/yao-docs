# Flexible TUI Layout Design Requirements

**Date**: 2026-01-21
**Status**: Design/Planning Phase
**Priority**: High

## Overview

This document outlines the requirements for implementing a flexible, configurable TUI (Terminal User Interface) layout rendering mechanism. The system aims to provide CSS-like layout capabilities for terminal applications, enabling responsive and adaptive user interfaces that can dynamically adjust to screen size changes and support complex nested layouts.

## Key Objectives

1. **Responsiveness**: Automatically adapt to screen size changes without manual intervention
2. **Flexibility**: Support nested layouts similar to CSS layout systems (Flexbox, Grid)
3. **Declarative Configuration**: JSON-based layout definitions for ease of use
4. **Component Integration**: Seamless integration with existing component system
5. **Performance**: Efficient rendering with minimal overhead

## Core Features

### 1. Responsive Layout System

**Requirements:**

- Automatic adaptation to terminal window size changes
- Dynamic reflow of components based on available space
- Support for minimum/maximum size constraints
- Intelligent content wrapping and truncation when necessary
- Configurable breakpoints for different screen sizes

**Use Cases:**

- Terminal window resize should trigger automatic layout recalculation
- Components should shrink/grow proportionally when space changes
- Ability to hide/show components on small screens
- Responsive behavior similar to CSS media queries

### 2. Layout Primitives

#### 2.1 Flexbox-like Behavior

- **Direction**: `row`, `column`, `row-reverse`, `column-reverse`
- **Alignment**:
  - `justifyContent`: `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly`
  - `alignItems`: `flex-start`, `flex-end`, `center`, `stretch`, `baseline`
  - `alignContent`: `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around`
- **Flex Properties**:
  - `flex`: shorthand for `flex-grow`, `flex-shrink`, `flex-basis`
  - `flex-grow`: ability to grow as needed (0 = won't grow)
  - `flex-shrink`: ability to shrink if needed (1 = can shrink)
  - `flex-basis`: initial size before flex calculations

#### 2.2 Nested Layout Containers

- Support for arbitrary nesting depth (with reasonable limits)
- Layout containers can contain other layouts
- Recursive rendering with proper size calculation
- Layout isolation for independent sizing

#### 2.3 Grid Layout Support

- Row and column definitions with flexible sizing
- Grid areas and named regions
- Template-based grid definitions
- Auto-placement and spanning capabilities

#### 2.4 Absolute Positioning

- Fixed positioning for overlays and popups
- Relative positioning with offsets
- Z-index layering for overlapping elements

### 3. Component Integration

**Requirements:**

- Components register with layout containers automatically
- Automatic size calculation based on component content
- Layout rules control component positioning and sizing
- Component lifecycle management within layouts
- State propagation through layout hierarchy

**Current Integration Points:**

- `Component` struct in `tui/types.go` already has `Width` and `Height` fields
- `Layout` struct supports `Direction` and `Children`
- `RenderComponent()` method handles component rendering
- `ComponentInterface` in `core/types.go` provides standard render interface

**Enhancements Needed:**

- Size constraints (min-width, max-width, min-height, max-height)
- Flex properties (flex-grow, flex-shrink, flex-basis)
- Alignment properties (align-self, justify-self)
- Layout-specific props for controlling behavior

### 4. Configuration Format

**JSON Structure:**

```json
{
  "type": "layout",
  "direction": "row",
  "justifyContent": "space-between",
  "alignItems": "center",
  "padding": [1, 2, 1, 2],
  "children": [
    {
      "type": "header",
      "id": "main-header",
      "width": "100%",
      "height": 3,
      "props": { ... }
    },
    {
      "type": "layout",
      "direction": "column",
      "flex": 1,
      "children": [
        {
          "type": "form",
          "flex": "none",
          "height": 10
        },
        {
          "type": "table",
          "flex": 1,
          "minHeight": 5
        }
      ]
    }
  ]
}
```

**Value Types:**

- Fixed values: `"10"`, `10` (in columns/rows)
- Percentage: `"100%"`, `"50%"` (relative to parent)
- Flex: `"none"`, `"1"`, `"auto"` (flex grow/shrink)
- Auto: `"auto"` (calculate from content)
- Constraints: `"min(10,20%)"`, `"max(flex, 50)"`

## Technical Specifications

### Integration with Bubble Tea

**Current Architecture:**

- Model implements `tea.Model` interface
- `View()` returns rendered string
- `Update()` handles `tea.WindowSizeMsg` messages
- `renderLayout()` handles current layout rendering

**Required Enhancements:**

1. **Layout Engine**: New `tui/layout` package with:
   - `LayoutEngine` struct for managing layout calculations
   - `FlexLayout` implementation for flexbox behavior
   - `GridLayout` implementation for grid layout
   - `LayoutNode` representation of layout hierarchy
   - `SizeConstraints` for min/max/flex properties

2. **Size Calculation**:
   - Recursive bottom-up size calculation
   - Cache computed sizes until invalidation
   - Handle terminal resize events efficiently
   - Support size queries and layout debugging

3. **Rendering Pipeline**:
   - `WindowSizeMsg` → Rebuild layout cache
   - Calculate optimal sizes for all nodes
   - Update component `RenderConfig` with calculated dimensions
   - Render with lipgloss for styling

### State Management

**Current State Structure:**

```go
type Model struct {
    State   map[string]interface{} `json:"-"`
    StateMu sync.RWMutex
    // ... other fields
}
```

**Layout State:**

- Maintain computed layout dimensions in cache
- Invalidate cache on state/size changes
- Support layout state queries for debugging
- Optionally expose layout state for inspection

### Error Handling

**Layout Validation:**

- Validate configuration structure during load
- Detect circular dependencies in layouts
- Warn about potential overflow situations
- Provide helpful error messages for configuration mistakes

**Runtime Errors:**

- Graceful degradation when layout fails
- Fallback to simple vertical layout
- Log detailed error information
- Display user-friendly error messages

## Implementation Approaches

### Approach 1: Pure Go Layout Engine

**Pros:**

- Full control over layout algorithm
- Tailored to terminal specific constraints
- No external dependencies
- Optimized for TUI use case

**Cons:**

- Higher initial development effort
- Need to implement complex layout math
- Testing burden for edge cases

### Approach 2: Use Existing Layout Library

**Pros:**

- Faster to implement
- Well-tested algorithms
- Community support

**Cons:**

- May not be terminal-optimized
- Potential licensing issues
- May require adaptations

**Recommended**: Approach 1 - Build custom layout engine optimized for terminal constraints

## Phase Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Create `tui/layout` package structure
- [ ] Implement `LayoutNode` and `SizeConstraints` types
- [ ] Basic size calculation utilities
- [ ] Unit tests for size math
- [ ] Configuration parsing for new layout properties

### Phase 2: Flex Layout (Week 3-4)

- [ ] Implement `FlexLayout` engine
- [ ] Support direction, justification, alignment
- [ ] Implement grow/shrink/basis calculations
- [ ] Integrate with existing render pipeline
- [ ] Add comprehensive tests

### Phase 3: Grid Layout (Week 5-6)

- [ ] Design grid specification format
- [ ] Implement `GridLayout` engine
- [ ] Support template-based grid areas
- [ ] Handle spanning and auto-placement
- [ ] Add grid examples and tests

### Phase 4: Advanced Features (Week 7-8)

- [ ] Implement absolute positioning layer
- [ ] Add responsive breakpoints system
- [ ] Support layout transitions/animations
- [ ] Layout debugging tools
- [ ] Performance optimization

### Phase 5: Integration & Documentation (Week 9-10)

- [ ] Update all components to support new layout props
- [ ] Create migration guide for existing layouts
- [ ] Write comprehensive documentation
- [ ] Add examples and tutorials
- [ ] Performance benchmarking

## Existing Code References

### Relevant Files

1. **tui/types.go**
   - `Layout` struct: Current layout definition (lines 69-83)
   - `Component` struct: Component properties (lines 85-107)
   - Contains `Direction`, `Children`, `Width`, `Height` fields

2. **tui/model.go**
   - `Update()`: Message handling (lines 90-133)
   - Includes `WindowSizeMsg` handling
   - State management via `StateMu`

3. **tui/render_engine.go**
   - `renderLayoutNode()`: Recursive layout rendering (lines 45-99)
   - `RenderComponent()`: Component rendering (lines 104-161)
   - Uses `lipgloss.JoinHorizontal/Vertical` for joining

4. **tui/core/types.go**
   - `ComponentInterface` (lines 33-59)
   - `RenderConfig` struct (lines 25-29)
   - `Render()` method interface

5. **tui/components/styles.go**
   - Lipgloss style parsing and application
   - Alignment and positioning utilities

### Current Limitations

1. **Simple Layout Only**: Current implementation only supports basic `vertical`/`horizontal` direction
2. **Fixed Sizing**: Components have fixed width/height or no size constraints
3. **No Flex**: No grow/shrink behavior or flexible sizing
4. **Limited Nesting**: Limited support for deep nesting (max depth check at 50)
5. **Manual Resizing**: No automatic responsive behavior

## Design Decisions

### Decision 1: Layout Algorithm Choice

**Options:**

- Flexbox (CSS-like)
- Grid (CSS-like)
- Box Model (CSS-like)

**Decision**: Implement Flexbox first, then Grid. Flexbox is more intuitive for terminal UI and covers most use cases.

**Rationale**:

- Flexbox maps well to row/column layouts
- Simpler to implement and understand
- sufficient for most TUI applications
- Grid can be added later for complex cases

### Decision 2: Size Units

**Options:**

- Characters/columns (terminal-absolute)
- Points (CSS-style)
- Both with conversions

**Decision**: Use character/columns as primary unit, support percentages for relative sizing.

**Rationale**:

- Terminal operates on grid of characters
- No need for pixel-based calculations
- Simple and intuitive for terminal applications
- Percentage-based flexible sizing covers most needs

### Decision 3: State Management

**Options:**

- Inline layout state in Model
- Separate layout state object
- No explicit layout state (compute on demand)

**Decision**: Compute on demand with caching, invalidate on changes.

**Rationale**:

- Avoids state synchronization issues
- Cache provides performance
- Simpler state management
- Eager recomputation on resize is acceptable

### Decision 4: Performance Optimization

**Strategies:**

1. **Lazy Layout Calculation**: Only recalculate when needed
2. **Size Caching**: Cache computed sizes until invalidation
3. **Incremental Updates**: Only recalculate changed subtrees
4. **Memoization**: Cache size calculations for props
5. **Debounced Resize**: Wait for resize to stabilize before recalculating

## Testing Strategy

### Unit Tests

1. **Size Calculations**
   - Fixed size computations
   - Percentage-based size computations
   - Flex grow/shrink calculations
   - Min/max constraint enforcement

2. **Layout Engines**
   - Flex layout behavior
   - Grid layout behavior
   - Nested layout calculations
   - Edge cases (overflow, underflow)

3. **Integration Tests**
   - Full layout rendering with real components
   - Window resize response
   - Component state propagation
   - Error handling

### Performance Tests

- Large layout trees (100+ nodes)
- Deep nesting (50+ levels)
- Frequent window resize events
- Memory usage over time
- Rendering time benchmarks

### Visual Tests

- Screen capture comparisons
- Manual verification of layout behavior
- Accessibility testing (screen readers)
- Cross-terminal compatibility

## Migration Guide

### For Existing Layouts

**Current Format:**

```json
{
  "layout": {
    "direction": "vertical",
    "children": [...]
  }
}
```

**Enhanced Format (Backward Compatible):**

```json
{
  "layout": {
    "direction": "row",
    "justifyContent": "flex-start",
    "alignItems": "center",
    "children": [
      {
        "type": "header",
        "width": "100%",
        "height": 3
      },
      {
        "type": "form",
        "flex": 1
      }
    ]
  }
}
```

**Migration Steps:**

1. Existing layouts continue to work without changes
2. New layout properties are optional with sensible defaults
3. Gradually add flex properties as needed
4. Test on different screen sizes after migration

## Success Criteria

The implementation is considered successful when:

1. ✅ All existing layout configurations continue to work
2. ✅ Responsive behavior works correctly on window resize
3. ✅ Nested layouts calculate sizes correctly
4. ✅ Performance is acceptable (rendering < 16ms for typical layouts)
5. ✅ Components can specify flex constraints
6. ✅ Grid layout is functional (Phase 3)
7. ✅ Comprehensive test coverage (>90%)
8. ✅ Documentation is complete and clear
9. ✅ Examples demonstrate all major features
10. ✅ No regressions in existing functionality

## Risks and Mitigations

### Risk 1: Performance Degradation

**Impact**: High
**Probability**: Medium

**Mitigation**:

- Implement caching early
- Profile and optimize hot paths
- Set performance targets and benchmark
- Defer unnecessary calculations

### Risk 2: Complexity Explosion

**Impact**: Medium
**Probability**: High

**Mitigation**:

- Start with minimal feature set
- Iterate incrementally
- Keep algorithms simple where possible
- Refactor when complexity becomes unmanageable

### Risk 3: Breaking Existing Components

**Impact**: High
**Probability**: Low

**Mitigation**:

- Maintain backward compatibility
- Comprehensive testing before merge
- Deprecation warnings for old APIs
- Migration guide and examples

### Risk 4: Unintuitive Configuration

**Impact**: Medium
**Probability**: Medium

**Mitigation**:

- Use familiar CSS terminology
- Provide clear examples
- Validation with helpful error messages
- Interactive playground/debugging tools

## Related Tasks

- [Message-Driven Focus Optimization](tasks/message-driven-focus-optimization/) - Focus management improvements
- [Architecture Design](tasks/Architecture_Design/) - Overall TUI architecture
- [Component Refactoring Guidelines](tasks/Component_Refactoring_Guidelines/) - Component design patterns

## References

- [CSS Flexbox Specification](https://www.w3.org/TR/css-flexbox-1/)
- [CSS Grid Layout Specification](https://www.w3.org/TR/css-grid-1/)
- [Bubble Tea Documentation](https://github.com/charmbracelet/bubbletea)
- [Lipgloss Styling](https://github.com/charmbracelet/lipgloss)
- [Existing TUI Architecture](tasks/Architecture_Design/)

## Appendix A: Example Layouts

### Example 1: Simple Vertical Layout

```json
{
  "layout": {
    "direction": "column",
    "padding": [1, 0, 1, 0],
    "children": [
      {
        "type": "header",
        "height": 3,
        "props": {
          "title": "Application Name"
        }
      },
      {
        "type": "form",
        "flex": 1,
        "props": {
          "fields": [...]
        }
      },
      {
        "type": "footer",
        "height": 2
      }
    ]
  }
}
```

### Example 2: Responsive Dashboard

```json
{
  "layout": {
    "direction": "row",
    "children": [
      {
        "type": "layout",
        "direction": "column",
        "width": "20%",
        "children": [
          { "type": "menu", "flex": 1 },
          { "type": "status", "height": 3 }
        ]
      },
      {
        "type": "layout",
        "direction": "column",
        "flex": 1,
        "children": [
          { "type": "header", "height": 3 },
          { "type": "table", "flex": 1, "minHeight": 5 },
          { "type": "paginator", "height": 2 }
        ]
      }
    ]
  }
}
```

### Example 3: Complex Nested Flex

```json
{
  "layout": {
    "direction": "column",
    "justifyContent": "space-between",
    "children": [
      {
        "type": "layout",
        "direction": "row",
        "height": 10,
        "alignItems": "center",
        "children": [
          { "type": "logo", "width": "none" },
          { "type": "search", "flex": 1 },
          { "type": "actions", "width": "none" }
        ]
      },
      {
        "type": "table",
        "flex": 1
      }
    ]
  }
}
```

## Appendix B: Configuration Schema

### Layout Properties

```typescript
interface Layout {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around';
  padding?: [number, number, number, number];
  children?: (Layout | Component)[];
}
```

### Component Size Properties

```typescript
interface Component {
  width?: number | string; // Fixed number, percentage, "flex", "auto"
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  flex?: number | string; // Shorthand for flex-grow
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch';
  order?: number;
}
```

---

**Document Owner**: TUI Team
**Review Status**: Pending Review
**Last Updated**: 2026-01-21
**Version**: 1.0

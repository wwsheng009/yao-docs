# TUI Runtime Roadmap

This document outlines the remaining work and future priorities for the Yao TUI Runtime system.

## Completed Work

### Phase 1: Core Runtime

- Three-phase rendering model (Measure → Layout → Render)
- Core runtime engine with LayoutNode and LayoutEngine
- Flexbox layout algorithm
- CellBuffer virtual canvas
- BoxConstraints system

### Phase 2: Event System

- Event dispatcher with capturing/at-target/bubbling phases
- Hit testing for mouse event routing
- Event delegation system

### Phase 3: Focus Management

- Focus manager with Tab navigation
- Focus traps for modals/dialogs

### Phase 4: Enhanced Rendering

- Lipgloss adapter for terminal styling
- Frame diffing with dirty region tracking
- Style caching for performance

### Phase 5: Performance

- LRU cache with TTL expiration (6.5x speedup)
- Viewport-based virtual scrolling

### Phase 6: Components

- Calendar component with date selection
- Checkbox component
- Radio component with single selection

---

## Remaining Work

### 1. More UI Components

**Priority: High**

| Component       | Description                                           | Status      |
| --------------- | ----------------------------------------------------- | ----------- |
| Input/TextField | Text input with validation, masking, completion       | Not Started |
| Button          | Clickable button with styles and states               | Not Started |
| List/Select     | Scrollable list with selection (partial)              | Partial     |
| Table           | Data table with sorting, pagination                   | Partial     |
| Progress Bar    | Visual progress indicator (determinate/indeterminate) | Not Started |
| Tabs            | Tab navigation component                              | Partial     |
| Modal/Dialog    | Popup overlay component with backdrop                 | Not Started |
| Form            | Form container with validation and submission         | Not Started |
| TreeView        | Hierarchical data display with expand/collapse        | Not Started |
| SplitView       | Resizable pane separator                              | Not Started |
| RichText        | Formatted text with markdown support                  | Not Started |
| Slider          | Numeric value slider control                          | Not Started |
| Spinner         | Loading/activity indicator                            | Not Started |

---

### 2. Integration Layer

**Priority: High**

#### TUI App Runner

Helper utilities to run full TUI applications with minimal boilerplate:

```go
// Example API design
func RunApp(app *AppConfig) error {
    // Initialize runtime
    // Setup focus management
    // Run Bubble Tea program
}
```

#### Bubble Tea Adapter

Clean integration layer between Runtime and Bubble Tea lifecycle:

- Model wrapper for Runtime components
- Message translation layer
- Command bridging

#### Complete Example Application

Demonstrate all features together:

- Multi-panel layout
- Component interaction
- Event handling
- Focus navigation

---

### 3. Component Migration

**Priority: Medium**

Migrate any remaining legacy components to new runtime:

- Audit existing components in `tui/components/`
- Ensure all implement `Measurable` interface
- Update to use new layout system
- Remove deprecated APIs

---

### 4. Advanced Features

**Priority: Medium**

#### Drag and Drop

- Mouse-based drag operations
- Drop target detection
- Visual feedback during drag
- Data transfer between components

#### Animations

- Smooth transitions between states
- Keyframe animation system
- Easing functions
- Performance optimization

#### Theme System

- Configurable color schemes
- Light/dark mode switching
- Per-component theme overrides
- Theme inheritance

#### Accessibility

- Screen reader support hints
- High contrast mode
- Keyboard navigation optimization
- Focus indicators

---

### 5. Testing & Quality

**Priority: Medium**

#### E2E Tests

- Full application flow tests
- Component interaction tests
- Event propagation tests

#### Performance Benchmarks

- Regression tracking
- Memory leak detection
- Render performance metrics

#### Visual Regression

- Screenshot-based UI testing
- Golden master comparison
- Cross-terminal compatibility

---

## Implementation Priority

### Sprint 1: Core Components (4-6 weeks)

1. Input/TextField component
2. Button component
3. Progress Bar component
4. Modal/Dialog component

### Sprint 2: Integration (2-3 weeks)

1. TUI App Runner
2. Bubble Tea Adapter
3. Complete Example Application

### Sprint 3: Advanced Components (4-6 weeks)

1. Complete Table component
2. Form component
3. TreeView component
4. SplitView component

### Sprint 4: Advanced Features (6-8 weeks)

1. Drag and Drop system
2. Animation framework
3. Theme system
4. Accessibility features

### Sprint 5: Quality & Polish (2-4 weeks)

1. E2E test suite
2. Performance benchmarks
3. Visual regression tests
4. Documentation completion

---

## How to Contribute

1. Pick an item from the roadmap
2. Create a feature branch
3. Implement with tests
4. Update documentation
5. Submit PR

## Questions?

Refer to:

- [API Documentation](API.md)
- [Getting Started Guide](GETTING_STARTED.md)
- [Component Examples](../examples/)

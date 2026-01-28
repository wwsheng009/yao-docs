// Package demo provides a demo application using the new TUI runtime.
package demo

import (
	"fmt"
	"os"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/yaoapp/kun/log"
	"github.com/yaoapp/yao/tui/tui/core"
	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
)

// RuntimeDemo is a demo application using the new runtime engine.
type RuntimeDemo struct {
	// DSL configuration
	config *dsl.Config

	// Runtime engine
	runtime runtime.Runtime

	// Layout tree
	layoutRoot *runtime.LayoutNode

	// Current frame
	currentFrame *runtime.Frame

	// Terminal dimensions
	width  int
	height int

	// Component registry
	registry *ComponentRegistry

	// Ready flag
	ready bool

	// Quit flag
	quit bool
}

// NewRuntimeDemo creates a new runtime demo from DSL configuration.
func NewRuntimeDemo(dslCfg *dsl.Config) *RuntimeDemo {
	return &RuntimeDemo{
		config:  dslCfg,
		width:   80,
		height:  24,
		registry: NewComponentRegistry(),
	}
}

// Init initializes the demo.
func (m *RuntimeDemo) Init() tea.Cmd {
	return nil
}

// Update handles messages.
func (m *RuntimeDemo) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			m.quit = true
			return m, tea.Quit
		}
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true
		m.layout()
	}

	return m, nil
}

// View renders the demo.
func (m *RuntimeDemo) View() string {
	if !m.ready {
		return "Loading..."
	}

	if m.currentFrame == nil || m.currentFrame.Buffer == nil {
		return "No frame rendered"
	}

	// Render the frame using lipgloss for proper styling
	return m.renderFrame()
}

// layout performs the layout calculation.
func (m *RuntimeDemo) layout() {
	// Create layout tree with components on first run
	if m.layoutRoot == nil {
		var err error
		m.layoutRoot, err = m.registry.CreateLayoutTreeWithComponents(m.config)
		if err != nil {
			log.Error("Failed to create layout tree: %v", err)
			return
		}
	}

	// Create runtime if not exists
	if m.runtime == nil {
		m.runtime = runtime.NewRuntime(m.width, m.height)
	}

	// Perform layout
	constraints := runtime.NewBoxConstraints(0, m.width, 0, m.height)
	result := m.runtime.Layout(m.layoutRoot, constraints)

	// Render to frame
	frame := m.runtime.Render(result)
	m.currentFrame = &frame
}

// renderFrame renders the current frame to a string.
func (m *RuntimeDemo) renderFrame() string {
	if m.currentFrame == nil || m.currentFrame.Buffer == nil {
		return ""
	}

	// For MVP, use the buffer's String method
	// In future, this will use lipgloss for better styling
	return m.currentFrame.String()
}

// renderFrameWithComponents renders using the legacy component rendering.
// This is a bridge method until full runtime rendering is complete.
func (m *RuntimeDemo) renderFrameWithComponents() string {
	if m.layoutRoot == nil {
		return "No layout"
	}

	var builder strings.Builder

	// Render each node using legacy component rendering
	m.renderNode(m.layoutRoot, 0, 0, &builder)

	return builder.String()
}

// renderNode recursively renders a layout node.
func (m *RuntimeDemo) renderNode(node *runtime.LayoutNode, x, y int, builder *strings.Builder) {
	if node == nil {
		return
	}

	// If node has a component, render it
	if node.Component != nil && node.Component.Instance != nil {
		renderConfig := core.RenderConfig{
			Data:   node.Props,
			Width:  node.MeasuredWidth,
			Height: node.MeasuredHeight,
		}

		rendered, err := node.Component.Instance.Render(renderConfig)
		if err != nil {
			log.Error("Render error for %s: %v", node.ID, err)
			builder.WriteString(fmt.Sprintf("[Error: %s]", node.ID))
		} else {
			// Apply positioning
			style := lipgloss.NewStyle().
				Width(node.MeasuredWidth).
				Height(node.MeasuredHeight).
				MaxWidth(node.MeasuredWidth).
				MaxHeight(node.MeasuredHeight)

			builder.WriteString(style.Render(rendered))
		}
	}

	// Render children
	for _, child := range node.Children {
		m.renderNode(child, child.X, child.Y, builder)
	}
}

// ShouldQuit returns true if the demo should quit.
func (m *RuntimeDemo) ShouldQuit() bool {
	return m.quit
}

// Run starts the demo.
func Run(dslCfg *dsl.Config) error {
	model := NewRuntimeDemo(dslCfg)
	program := tea.NewProgram(
		model,
		tea.WithAltScreen(),       // Use alternate screen buffer
		tea.WithMouseCellMotion(), // Enable mouse cell motion
	)

	_, err := program.Run()
	return err
}

// RunFromFile loads a DSL configuration from a file and runs the demo.
func RunFromFile(filename string) error {
	data, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	dslCfg, layoutRoot, err := dsl.ValidateAndConvert(data, filename)
	if err != nil {
		return fmt.Errorf("failed to parse configuration: %w", err)
	}

	log.Trace("Loaded DSL config: %s", dslCfg.Name)
	log.Trace("Layout tree: %d nodes", countNodes(layoutRoot))

	return Run(dslCfg)
}

// countNodes counts the total number of nodes in the layout tree.
func countNodes(root *runtime.LayoutNode) int {
	if root == nil {
		return 0
	}
	count := 1
	for _, child := range root.Children {
		count += countNodes(child)
	}
	return count
}

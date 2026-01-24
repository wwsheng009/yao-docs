package demo

import (
	"os"
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
	runtimepkg "github.com/yaoapp/yao/tui/runtime"
)

// TestLayoutRendering tests the layout calculation and rendering.
func TestLayoutRendering(t *testing.T) {
	// Read the nested layout file
	data, err := os.ReadFile("../demo/tuis/layouts/nested.tui.yao")
	if err != nil {
		t.Skip("Nested layout file not found:", err)
		return
	}

	// Parse and validate
	cfg, layoutRoot, err := dsl.ValidateAndConvert(data, "nested.tui.yao")
	if err != nil {
		t.Fatalf("ValidateAndConvert failed: %v", err)
	}

	// Bind components
	registry := NewComponentRegistry()
	layoutRoot, err = registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	// Create runtime
	rt := runtimepkg.NewRuntime(80, 24)

	// Perform layout
	constraints := runtimepkg.NewBoxConstraints(0, 80, 0, 24)
	result := rt.Layout(layoutRoot, constraints)

	// Verify layout result - width should be constrained to max, height is content-based
	if result.RootWidth != 80 {
		t.Errorf("Expected RootWidth=80, got %d", result.RootWidth)
	}
	// Height is content-based (sum of all components), should be reasonable
	if result.RootHeight <= 0 || result.RootHeight > 24 {
		t.Errorf("RootHeight should be between 1 and 24, got %d", result.RootHeight)
	}

	// Render to frame
	frame := rt.Render(result)

	// Verify frame
	if frame.Buffer == nil {
		t.Fatal("Frame buffer is nil")
	}

	if frame.Buffer.Width() != 80 {
		t.Errorf("Expected buffer width 80, got %d", frame.Buffer.Width())
	}
	if frame.Buffer.Height() != 24 {
		t.Errorf("Expected buffer height 24, got %d", frame.Buffer.Height())
	}

	// Get frame string to verify rendering
	frameStr := frame.String()
	if frameStr == "" {
		t.Error("Frame string is empty")
	}

	t.Logf("Layout and rendering successful!")
	t.Logf("Frame output length: %d characters", len(frameStr))
	t.Logf("Number of layout boxes: %d", len(result.Boxes))
}

// TestSimpleLayout tests a simple layout.
func TestSimpleLayout(t *testing.T) {
	// Create a simple DSL config
	jsonConfig := `{
		"name": "Simple Test",
		"layout": {
			"type": "row",
			"direction": "row",
			"children": [
				{
					"type": "text",
					"props": {"content": "Left"}
				},
				{
					"type": "text",
					"props": {"content": "Right"}
				}
			]
		}
	}`

	cfg, err := dsl.Parse([]byte(jsonConfig))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	if err := cfg.Validate(); err != nil {
		t.Fatalf("Validate failed: %v", err)
	}

	// Convert to layout tree
	layoutRoot := cfg.ToLayoutTree()
	if layoutRoot == nil {
		t.Fatal("LayoutRoot is nil")
	}

	// Verify layout node
	if layoutRoot.Type != runtimepkg.NodeTypeRow {
		t.Errorf("Expected NodeTypeRow, got %v", layoutRoot.Type)
	}

	if len(layoutRoot.Children) != 2 {
		t.Errorf("Expected 2 children, got %d", len(layoutRoot.Children))
	}
}

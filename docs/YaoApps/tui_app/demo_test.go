package demo

import (
	"os"
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
)

// TestRuntimeDemoBasic tests the basic runtime demo setup.
func TestRuntimeDemoBasic(t *testing.T) {
	// Read the nested layout file
	data, err := os.ReadFile("../demo/tuis/layouts/nested.tui.yao")
	if err != nil {
		t.Skip("Nested layout file not found:", err)
		return
	}

	// Parse the DSL configuration
	cfg, root, err := dsl.ValidateAndConvert(data, "nested.tui.yao")
	if err != nil {
		t.Fatalf("ValidateAndConvert failed: %v", err)
	}

	if cfg.Name != "Nested Layouts Test" {
		t.Errorf("Expected name 'Nested Layouts Test', got '%s'", cfg.Name)
	}

	if root == nil {
		t.Fatal("LayoutRoot is nil")
	}

	// Create demo model
	demo := NewRuntimeDemo(cfg)
	if demo == nil {
		t.Fatal("NewRuntimeDemo returned nil")
	}

	// Check registry is created
	if demo.registry == nil {
		t.Error("Component registry not created")
	}

	t.Log("Successfully created runtime demo with config:", cfg.Name)
}

// TestComponentRegistry tests the component registry.
func TestComponentRegistry(t *testing.T) {
	registry := NewComponentRegistry()
	if registry == nil {
		t.Fatal("NewComponentRegistry returned nil")
	}

	// Create a simple DSL node
	node := &dsl.Node{
		ID:   "test",
		Type: "text",
		Props: map[string]interface{}{
			"content": "Hello, World!",
		},
	}

	// Create component
	component := registry.Create(node)
	if component == nil {
		t.Fatal("Registry.Create returned nil")
	}

	if component.GetComponentType() != "text" {
		t.Errorf("Expected type 'text', got '%s'", component.GetComponentType())
	}
}

// TestLoadAndBindComponents tests loading config and binding component.
func TestLoadAndBindComponents(t *testing.T) {
	data, err := os.ReadFile("../demo/tuis/layouts/nested.tui.yao")
	if err != nil {
		t.Skip("Nested layout file not found:", err)
		return
	}

	cfg, err := dsl.ParseFile(data, "nested.tui.yao")
	if err != nil {
		t.Fatalf("ParseFile failed: %v", err)
	}

	registry := NewComponentRegistry()
	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	if layoutRoot == nil {
		t.Fatal("LayoutRoot is nil")
	}

	// Count nodes with components
	count := countNodesWithComponents(layoutRoot)
	totalCount := countAllNodes(layoutRoot)
	t.Logf("Created layout tree with %d components out of %d total nodes", count, totalCount)

	if count < 5 {
		t.Errorf("Expected at least 5 components, got %d (root probably not being processed correctly)", count)
	}
}

// countAllNodes counts all nodes in the layout tree.
func countAllNodes(root *runtime.LayoutNode) int {
	if root == nil {
		return 0
	}
	count := 1
	for _, child := range root.Children {
		count += countAllNodes(child)
	}
	return count
}

// countNodesWithComponents counts nodes that have component instances.
func countNodesWithComponents(root *runtime.LayoutNode) int {
	if root == nil {
		return 0
	}
	count := 0
	if root.Component != nil {
		count = 1
	}
	for _, child := range root.Children {
		count += countNodesWithComponents(child)
	}
	return count
}

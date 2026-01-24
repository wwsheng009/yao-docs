package demo

import (
	"os"
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
)

// TestMenuTemplateSubstitution tests menu template substitution.
func TestMenuTemplateSubstitution(t *testing.T) {
	// Read the nested layout file
	data, err := os.ReadFile("../demo/tuis/layouts/nested.tui.yao")
	if err != nil {
		t.Skip("Nested layout file not found:", err)
		return
	}

	// Parse and validate
	cfg, _, err := dsl.ValidateAndConvert(data, "nested.tui.yao")
	if err != nil {
		t.Fatalf("ValidateAndConvert failed: %v", err)
	}

	t.Logf("Config data: %+v", cfg.Data)

	// Create registry with data
	registry := NewComponentRegistryWithData(cfg.Data)

	// Apply templates to the DSL layout
	if cfg.Layout != nil {
		applyTemplatesToNode(cfg.Layout, registry, t)
	}

	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	// Create runtime and render
	rt := runtime.NewRuntime(80, 24)
	constraints := runtime.NewBoxConstraints(0, 80, 0, 24)
	result := rt.Layout(layoutRoot, constraints)
	frame := rt.Render(result)
	debug := runtime.DebugFrame(&frame, &result)

	t.Log("\n=== Render Output ===")
	lines := debug.PlainOutput()
	for i, line := range splitLines(lines) {
		if line != "" {
			t.Logf("Line %d: %q", i+1, line)
		}
	}
}

// applyTemplatesToNode recursively applies templates to a node.
func applyTemplatesToNode(node *dsl.Node, registry *ComponentRegistry, t *testing.T) {
	if node == nil {
		return
	}

	// Log props before template
	if node.Props != nil && len(node.Props) > 0 {
		t.Logf("Node %s props before: %+v", node.ID, node.Props)
	}

	// Apply templates to props
	if registry.resolver != nil && node.Props != nil {
		for key, value := range node.Props {
			resolved := registry.resolver.ResolveValue(value)
			t.Logf("Node %s prop %s: %v -> %v", node.ID, key, value, resolved)
			node.Props[key] = resolved
		}
	}

	// Log props after template
	if node.Props != nil && len(node.Props) > 0 {
		t.Logf("Node %s props after: %+v", node.ID, node.Props)
	}

	// Recurse into children
	for _, child := range node.Children {
		applyTemplatesToNode(child, registry, t)
	}
}

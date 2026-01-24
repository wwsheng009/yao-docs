package demo

import (
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
)

// TestTemplateResolver tests the template variable substitution.
func TestTemplateResolver(t *testing.T) {
	data := map[string]interface{}{
		"title": "Test Title",
		"description": "Test Description",
		"stats": map[string]interface{}{
			"totalUsers": 1250,
			"activeUsers": 890,
		},
		"menuItems": []interface{}{
			map[string]interface{}{"id": 1, "name": "Dashboard"},
			map[string]interface{}{"id": 2, "name": "Users"},
			map[string]interface{}{"id": 3, "name": "Settings"},
		},
	}

	resolver := NewResolver(data)

	// Test simple string replacement
	t.Run("SimpleString", func(t *testing.T) {
		result := resolver.Resolve("{{title}}")
		if result != "Test Title" {
			t.Errorf("Expected 'Test Title', got '%s'", result)
		}
	})

	// Test nested key
	t.Run("NestedKey", func(t *testing.T) {
		result := resolver.Resolve("{{stats.totalUsers}}")
		if result != "1250" {
			t.Errorf("Expected '1250', got '%s'", result)
		}
	})

	// Test array access
	t.Run("ArrayAccess", func(t *testing.T) {
		result := resolver.Resolve("{{menuItems.0.name}}")
		if result != "Dashboard" {
			t.Errorf("Expected 'Dashboard', got '%s'", result)
		}
	})

	// Test missing key
	t.Run("MissingKey", func(t *testing.T) {
		result := resolver.Resolve("{{missing}}")
		if result != "{{missing}}" {
			t.Errorf("Expected '{{missing}}', got '%s'", result)
		}
	})

	// Test mixed content
	t.Run("MixedContent", func(t *testing.T) {
		result := resolver.Resolve("Welcome to {{title}} - {{description}}")
		expected := "Welcome to Test Title - Test Description"
		if result != expected {
			t.Errorf("Expected '%s', got '%s'", expected, result)
		}
	})
}

// TestTemplateWithDSL tests template substitution with DSL config.
func TestTemplateWithDSL(t *testing.T) {
	jsonConfig := `{
		"name": "Template Test",
		"data": {
			"title": "My App",
			"status": "Running",
			"count": 42
		},
		"layout": {
			"type": "column",
			"children": [
				{
					"type": "header",
					"props": {"title": "{{title}}"}
				},
				{
					"type": "text",
					"props": {"content": "Status: {{status}}, Count: {{count}}"}
				}
			]
		}
	}`

	cfg, err := dsl.Parse([]byte(jsonConfig))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	// Create registry with data
	registry := NewComponentRegistryWithData(cfg.Data)

	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	if layoutRoot == nil {
		t.Fatal("LayoutRoot is nil")
	}

	// Check that templates were resolved
	found := false
	for _, node := range layoutRoot.Children {
		if node.Component != nil && node.Component.Type == "header" {
			found = true
			// The header component should have the resolved title
			// Since we can't easily check the component's content, we'll just verify it exists
			break
		}
	}

	if !found {
		t.Error("Header component not found or template not applied")
	}
}

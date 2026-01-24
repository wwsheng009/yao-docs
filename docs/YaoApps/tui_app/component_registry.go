// Package demo provides a demo application using the new TUI runtime.
//
// This package demonstrates the integration of:
// - DSL Parser (JSON/YAML configuration)
// - Runtime Layout Engine
// - Component Registry
// - Bubble Tea integration
package demo

import (
	"fmt"
	"strings"

	"github.com/yaoapp/kun/log"
	"github.com/yaoapp/yao/tui/core"
	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
	"github.com/yaoapp/yao/tui/ui/components"
)

// ComponentFactory creates a component instance from DSL node configuration.
type ComponentFactory func(dslNode *dsl.Node) core.ComponentInterface

// ComponentRegistry maps component types to their factories.
type ComponentRegistry struct {
	factories map[string]ComponentFactory
	// Template data for variable substitution
	templateData map[string]interface{}
	resolver    *Resolver
}

// NewComponentRegistry creates a new component registry.
func NewComponentRegistry() *ComponentRegistry {
	registry := &ComponentRegistry{
		factories:   make(map[string]ComponentFactory),
		templateData: nil,
		resolver:     nil,
	}
	registry.registerDefaultComponents()
	return registry
}

// NewComponentRegistryWithData creates a new component registry with template data.
func NewComponentRegistryWithData(data map[string]interface{}) *ComponentRegistry {
	registry := &ComponentRegistry{
		factories:   make(map[string]ComponentFactory),
		templateData: data,
		resolver:     NewResolver(data),
	}
	registry.registerDefaultComponents()
	return registry
}

// SetTemplateData sets the template data for variable substitution.
func (r *ComponentRegistry) SetTemplateData(data map[string]interface{}) {
	r.templateData = data
	r.resolver = NewResolver(data)
}

// ApplyTemplates applies template variable substitution to a node's props.
func (r *ComponentRegistry) ApplyTemplates(node *dsl.Node) *dsl.Node {
	if r.resolver == nil || node.Props == nil {
		return node
	}

	// Create a copy of the node with resolved props
	resolvedNode := *node
	resolvedProps := make(map[string]interface{})

	for key, value := range node.Props {
		resolvedProps[key] = r.resolver.ResolveValue(value)
	}

	resolvedNode.Props = resolvedProps
	return &resolvedNode
}

// registerDefaultComponents registers built-in components.
func (r *ComponentRegistry) registerDefaultComponents() {
	// Text component
	r.Register("text", func(node *dsl.Node) core.ComponentInterface {
		content := " "
		if node.Props != nil {
			if c, ok := node.Props["content"].(string); ok {
				content = c
			}
		}
		return components.NewTextComponent(content)
	})

	// Header component (styled text)
	r.Register("header", func(node *dsl.Node) core.ComponentInterface {
		title := "Header"
		if node.Props != nil {
			if t, ok := node.Props["title"].(string); ok {
				title = t
			}
		}
		return components.NewTextComponent(title)
	})

	// Footer component (styled text)
	r.Register("footer", func(node *dsl.Node) core.ComponentInterface {
		text := "Footer"
		if node.Props != nil {
			if t, ok := node.Props["text"].(string); ok {
				text = t
			}
		}
		return components.NewTextComponent(text)
	})

	// Menu component (simple list for now)
	r.Register("menu", func(node *dsl.Node) core.ComponentInterface {
		items := "Menu Items"
		if node.Props != nil {
			if i, ok := node.Props["items"].(string); ok {
				items = i
			} else if arr, ok := node.Props["items"].([]interface{}); ok {
				// Convert array to display string
				if len(arr) > 0 {
					lines := make([]string, 0, len(arr))
					for _, item := range arr {
						if itemMap, ok := item.(map[string]interface{}); ok {
							// Handle map with name field
							if name, ok := itemMap["name"].(string); ok {
								lines = append(lines, name)
							} else if idVal, idOk := itemMap["id"]; idOk {
								lines = append(lines, fmt.Sprintf("%v", idVal))
							}
						} else {
							lines = append(lines, fmt.Sprintf("%v", item))
						}
					}
					if len(lines) > 0 {
						items = strings.Join(lines, "\n")
					} else {
						items = fmt.Sprintf("%v items", len(arr))
					}
				} else {
					items = "Empty menu"
				}
			}
		}
		return components.NewTextComponent(items)
	})

	// Progress component
	r.Register("progress", func(node *dsl.Node) core.ComponentInterface {
		percent := 0
		if node.Props != nil {
			switch p := node.Props["percent"].(type) {
			case float64:
				percent = int(p)
			case int:
				percent = p
			}
		}
		// Create a simple progress bar visualization
		bar := ""
		if percent > 0 {
			filled := percent / 5
			for i := 0; i < 20; i++ {
				if i < filled {
					bar += "█"
				} else {
					bar += "░"
				}
			}
		}
		return components.NewTextComponent(fmt.Sprintf("[%s] %d%%", bar, percent))
	})

	// Layout container (no visual output, just container)
	r.Register("layout", func(node *dsl.Node) core.ComponentInterface {
		return components.NewTextComponent("") // Empty container
	})
}

// Register registers a component factory for a type.
func (r *ComponentRegistry) Register(componentType string, factory ComponentFactory) {
	r.factories[componentType] = factory
}

// Create creates a component instance from a DSL node.
// Applies template variable substitution before creating the component.
func (r *ComponentRegistry) Create(node *dsl.Node) core.ComponentInterface {
	// Apply template substitutions
	resolvedNode := r.ApplyTemplates(node)

	factory, ok := r.factories[resolvedNode.Type]
	if !ok {
		log.Warn("No factory registered for component type: %s, using text as fallback", resolvedNode.Type)
		// Fallback to text component
		content := fmt.Sprintf("[%s]", resolvedNode.Type)
		if resolvedNode.Props != nil {
			if c, ok := resolvedNode.Props["content"].(string); ok {
				content = c
			}
		}
		return components.NewTextComponent(content)
	}
	return factory(resolvedNode)
}

// BindComponents binds component instances to layout nodes.
// This creates the actual component instances for each node in the DSL tree.
func (r *ComponentRegistry) BindComponents(dslCfg *dsl.Config, layoutRoot *runtime.LayoutNode) {
	if dslCfg.Layout == nil {
		return
	}

	// Create component instances for all leaf nodes
	r.bindNodeComponentsRecursive(dslCfg.Layout, layoutRoot)
}

// bindNodeComponentsRecursive recursively binds components to all nodes.
// This ensures all leaf nodes get components, even in deeply nested structures.
func (r *ComponentRegistry) bindNodeComponentsRecursive(dslNode *dsl.Node, layoutNode *runtime.LayoutNode) {
	if layoutNode == nil || dslNode == nil {
		return
	}

	// Process current node: if it's a leaf (not a layout container), create a component
	if !isLayoutType(dslNode.Type) {
		component := r.Create(dslNode)
		layoutNode.Component = &core.ComponentInstance{
			ID:   dslNode.ID,
			Type: dslNode.Type,
			Instance: component,
		}
	}

	// Always recurse into children to handle nested structures
	// This ensures we process all leaf nodes in the tree
	for i := 0; i < len(dslNode.Children) && i < len(layoutNode.Children); i++ {
		r.bindNodeComponentsRecursive(dslNode.Children[i], layoutNode.Children[i])
	}
}

// CreateLayoutTreeWithComponents creates a layout tree with bound components.
// Applies template variable substitution using the config's data section.
func (r *ComponentRegistry) CreateLayoutTreeWithComponents(dslCfg *dsl.Config) (*runtime.LayoutNode, error) {
	// Set template data from config
	if dslCfg.Data != nil {
		r.SetTemplateData(dslCfg.Data)
	}

	// Convert DSL to layout tree
	layoutRoot := dslCfg.ToLayoutTree()
	if layoutRoot == nil {
		return nil, fmt.Errorf("failed to create layout tree from DSL config")
	}

	// Bind component instances (with template substitution applied)
	r.BindComponents(dslCfg, layoutRoot)

	return layoutRoot, nil
}

// isLayoutType checks if a type is a layout container.
func isLayoutType(typ string) bool {
	switch typ {
	case "layout", "row", "column", "vertical", "horizontal":
		return true
	default:
		return false
	}
}

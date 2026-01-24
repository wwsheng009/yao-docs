// Package demo provides template variable substitution for TUI layouts.
package demo

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/yaoapp/kun/log"
)

// Regex for matching template expressions {{ }}
var templateRe = regexp.MustCompile(`\{\{([\s\S]*?)\}\}`)

// containsExpression checks if a string contains {{}} expressions
func containsExpression(s string) bool {
	return strings.Contains(s, "{{") && strings.Contains(s, "}}")
}

// Resolver resolves template variables in strings.
type Resolver struct {
	data map[string]interface{}
}

// NewResolver creates a new template resolver with the given data.
func NewResolver(data map[string]interface{}) *Resolver {
	// Flatten the data for easier access
	flattened := make(map[string]interface{})
	flattenData(data, "", flattened)
	return &Resolver{data: flattened}
}

// Resolve replaces {{key}} patterns in a string with values from the data.
// Supports nested keys like {{stats.totalUsers}} and array access like {{menuItems.0.name}}.
// If the entire string is a single expression like {{menuItems}}, returns the value directly.
func (r *Resolver) Resolve(text string) string {
	if text == "" {
		return text
	}

	// Find all {{ expression }} patterns
	matches := templateRe.FindAllStringSubmatchIndex(text, -1)
	if len(matches) == 0 {
		return text
	}

	// If there's only one match and it's the entire string, return the value directly
	if len(matches) == 1 && matches[0][0] == 0 && matches[0][1] == len(text) {
		// This is a single expression like {{variable}}, return the evaluated value directly
		expression := strings.TrimSpace(text[matches[0][2]:matches[0][3]])
		// Skip empty expressions
		if expression == "" {
			return text
		}
		// Evaluate the expression
		if val, ok := r.getValue(expression); ok {
			return r.valueToString(val)
		}
		// Not found, return original
		return text
	}

	// Multiple expressions or partial match, do string replacement
	result := text
	for _, match := range matches {
		fullMatchStart, fullMatchEnd := match[0], match[1]
		exprStart, exprEnd := match[2], match[3]
		expression := strings.TrimSpace(text[exprStart:exprEnd])

		// Skip empty expressions
		if expression == "" {
			continue
		}

		// Evaluate the expression and get replacement
		replacement := r.evaluateExpression(expression)

		// Replace in result
		original := text[fullMatchStart:fullMatchEnd]
		result = strings.Replace(result, original, replacement, 1)
	}

	return result
}

// ResolveInMap recursively resolves template expressions in a map.
func (r *Resolver) ResolveInMap(m map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range m {
		result[k] = r.ResolveValue(v)
	}
	return result
}

// ResolveValue resolves template expressions in any value.
// If a string is a single expression like {{variable}}, returns the evaluated value directly.
func (r *Resolver) ResolveValue(value interface{}) interface{} {
	switch v := value.(type) {
	case string:
		// Check if the string contains {{}} expressions
		if !containsExpression(v) {
			return v
		}
		// Find all {{ expression }} patterns
		matches := templateRe.FindAllStringSubmatchIndex(v, -1)
		if len(matches) == 0 {
			return v
		}
		// If there's only one match and it's the entire string, return the evaluated value directly
		if len(matches) == 1 && matches[0][0] == 0 && matches[0][1] == len(v) {
			// This is a single expression like {{variable}}, return the evaluated value directly
			expression := strings.TrimSpace(v[matches[0][2]:matches[0][3]])
			// Skip empty expressions
			if expression == "" {
				return v
			}
			// Evaluate the expression and return the value directly (preserving type)
			if val, ok := r.getValue(expression); ok {
				return val
			}
			// Not found, return original
			return v
		}
		// Multiple expressions or partial match, do string replacement
		return r.Resolve(v)
	case map[string]interface{}:
		return r.ResolveInMap(v)
	case []interface{}:
		result := make([]interface{}, len(v))
		for i, item := range v {
			result[i] = r.ResolveValue(item)
		}
		return result
	default:
		return value
	}
}

// evaluateExpression evaluates a simple expression and returns its string value.
// Supports:
//   - Simple keys: {{title}}
//   - Nested keys: {{stats.totalUsers}}
//   - Array access: {{menuItems.0.name}}
//   - JSON literals: {"key": "value"}
func (r *Resolver) evaluateExpression(expr string) string {
	// First, try to get value from data
	if val, ok := r.getValue(expr); ok {
		return r.valueToString(val)
	}

	// Check if it's a JSON literal (starts with { or [)
	trimmed := strings.TrimSpace(expr)
	if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
		// It's a JSON literal, return as-is
		return trimmed
	}

	// Expression not found, return original
	log.Trace("Template: Expression not found: %s", expr)
	return "{{" + expr + "}}"
}

// getValue gets a value from data using a key path.
// Supports nested access like "stats.totalUsers" and array access like "menuItems.0.name" or "menuItems[0].name".
func (r *Resolver) getValue(key string) (interface{}, bool) {
	// Try direct key access first
	if val, ok := r.data[key]; ok {
		return val, true
	}

	// Normalize bracket notation to dot notation
	// Convert "tasks[0].text" to "tasks.0.text"
	normalizedKey := normalizeBracketNotation(key)

	// Try nested access
	parts := strings.Split(normalizedKey, ".")
	current := interface{}(r.data)

	for i, part := range parts {
		switch v := current.(type) {
		case map[string]interface{}:
			var exists bool
			current, exists = v[part]
			if !exists {
				return nil, false
			}

		case []interface{}:
			// Array access - part should be a number
			index, err := strconv.Atoi(part)
			if err != nil || index < 0 || index >= len(v) {
				return nil, false
			}
			current = v[index]

		default:
			return nil, false
		}

		// If this is the last part, return the value
		if i == len(parts)-1 {
			return current, true
		}
	}

	return nil, false
}

// valueToString converts a value to its string representation.
func (r *Resolver) valueToString(val interface{}) string {
	if val == nil {
		return ""
	}

	switch v := val.(type) {
	case string:
		return v
	case int, int8, int16, int32, int64:
		return fmt.Sprintf("%d", v)
	case uint, uint8, uint16, uint32, uint64:
		return fmt.Sprintf("%d", v)
	case float32, float64:
		return fmt.Sprintf("%.0f", v)
	case bool:
		return strconv.FormatBool(v)
	case []interface{}:
		// Convert array to comma-separated values
		parts := make([]string, len(v))
		for i, item := range v {
			parts[i] = r.valueToString(item)
		}
		return strings.Join(parts, ", ")
	case map[string]interface{}:
		// Convert map to JSON string
		b, _ := json.Marshal(v)
		return string(b)
	default:
		return fmt.Sprintf("%v", v)
	}
}

// flattenData flattens nested data structures for easier key access.
// Converts {"stats": {"totalUsers": 100}} to {"stats.totalUsers": 100}.
func flattenData(data map[string]interface{}, prefix string, result map[string]interface{}) {
	for key, value := range data {
		fullKey := key
		if prefix != "" {
			fullKey = prefix + "." + key
		}

		switch v := value.(type) {
		case map[string]interface{}:
			flattenData(v, fullKey, result)
		case []interface{}:
			// Save the original array reference first
			result[fullKey] = v
			// Also flatten arrays with index notation
			for i, item := range v {
				itemKey := fmt.Sprintf("%s.%d", fullKey, i)
				if itemMap, ok := item.(map[string]interface{}); ok {
					flattenData(itemMap, itemKey, result)
				} else {
					result[itemKey] = item
				}
			}
		default:
			result[fullKey] = value
		}
	}
}

// normalizeBracketNotation converts bracket notation to dot notation.
// Converts "tasks[0].text" to "tasks.0.text"
// Also handles "tasks[0][1]" to "tasks.0.1"
func normalizeBracketNotation(key string) string {
	// Regular expression to match [number] patterns
	// This finds patterns like [0], [1], [42], etc.
	re := regexp.MustCompile(`\[(\d+)\]`)

	// Replace [0] with .0, [1] with .1, etc.
	result := re.ReplaceAllString(key, ".$1")

	// Clean up any leading dot if the key started with brackets
	// e.g., "[0].key" -> ".0.key" -> "0.key"
	result = strings.TrimPrefix(result, ".")

	// Handle case where we had something like "arr[0].prop[1]" -> "arr.0.prop.1"
	// The regex already handles consecutive replacements correctly

	return result
}

// ApplyTemplateData applies template data to a DSL config.
// This replaces {{key}} expressions in the config with actual values from the data section.
func ApplyTemplateData(data map[string]interface{}, dslNode interface{}) interface{} {
	if data == nil || len(data) == 0 {
		return dslNode
	}

	resolver := NewResolver(data)
	return resolver.ResolveValue(dslNode)
}

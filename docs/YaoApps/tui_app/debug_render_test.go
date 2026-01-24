package demo

import (
	"fmt"
	"os"
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
)

// TestDebugNestedLayoutOutput uses debug tools to inspect the nested layout rendering.
func TestDebugNestedLayoutOutput(t *testing.T) {
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

	// Bind components
	registry := NewComponentRegistry()
	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	// Create runtime
	rt := runtime.NewRuntime(80, 24)

	// Perform layout
	constraints := runtime.NewBoxConstraints(0, 80, 0, 24)
	result := rt.Layout(layoutRoot, constraints)

	// Render to frame
	frame := rt.Render(result)

	// Use debug tools to inspect the output
	debug := runtime.DebugFrame(&frame, &result)

	// Print summary
	t.Log("=== Render Summary ===")
	t.Log(debug.Summary)
	t.Log(fmt.Sprintf("Root dimensions: %dx%d", result.RootWidth, result.RootHeight))
	t.Log(fmt.Sprintf("Number of boxes: %d", len(result.Boxes)))

	// Print buffer info
	if debug.BufferInfo != nil {
		t.Log("=== Buffer Info ===")
		t.Log(fmt.Sprintf("Buffer: %dx%d, %d/%d cells non-empty (%.1f%%)",
			debug.BufferInfo.Width,
			debug.BufferInfo.Height,
			debug.BufferInfo.NonEmpty,
			debug.BufferInfo.TotalCells,
			float64(debug.BufferInfo.NonEmpty)*100/float64(debug.BufferInfo.TotalCells)))
	}

	// Print box information
	t.Log("=== Boxes ===")
	for i, box := range debug.Boxes {
		contentPreview := ""
		if len(box.Content) > 30 {
			contentPreview = box.Content[:27] + "..."
		} else if box.Content != "" {
			contentPreview = box.Content
		}
		if contentPreview != "" {
			contentPreview = fmt.Sprintf(" content: %q", contentPreview)
		}
		t.Log(fmt.Sprintf("  [%d] %-20s at (%2d,%2d) size %2dx%2d%s",
			i, box.ID, box.X, box.Y, box.Width, box.Height, contentPreview))
	}

	// Print diff output (with line numbers and visible markers)
	t.Log("\n=== Diff Output (with line numbers) ===")
	diffOutput := debug.DiffOutput()
	for _, line := range splitLines(diffOutput) {
		t.Log(line)
	}

	// Print plain output
	t.Log("\n=== Plain Output ===")
	plainOutput := debug.PlainOutput()
	for _, line := range splitLines(plainOutput) {
		t.Log(line)
	}

	// Print JSON output for automated comparison
	jsonOutput := debug.ToJSON()
	t.Log("\n=== JSON Output ===")
	t.Log(fmt.Sprintf("Lines: %d", len(jsonOutput.Lines)))
	for i, line := range jsonOutput.Lines {
		if line != "" {
			t.Log(fmt.Sprintf("  %3d: %q", i+1, line))
		}
	}
}

// splitLines splits a string into lines.
func splitLines(s string) []string {
	if s == "" {
		return nil
	}
	lines := make([]string, 0)
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

// TestCompareLayoutOutput compares the output with expected content.
func TestCompareLayoutOutput(t *testing.T) {
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

	// Bind components
	registry := NewComponentRegistry()
	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		t.Fatalf("CreateLayoutTreeWithComponents failed: %v", err)
	}

	// Create runtime with different sizes
	testCases := []struct {
		name   string
		width  int
		height int
	}{
		{"Small", 40, 10},
		{"Medium", 80, 24},
		{"Wide", 120, 30},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			rt := runtime.NewRuntime(tc.width, tc.height)
			constraints := runtime.NewBoxConstraints(0, tc.width, 0, tc.height)
			result := rt.Layout(layoutRoot, constraints)
			frame := rt.Render(result)
			debug := runtime.DebugFrame(&frame, &result)
			jsonOutput := debug.ToJSON()

			t.Logf("%s: %dx%d -> %dx%d output, %d lines",
				tc.name,
				tc.width, tc.height,
				jsonOutput.Width, jsonOutput.Height,
				len(jsonOutput.Lines))

			// Verify buffer dimensions match constraints
			if jsonOutput.Width != tc.width {
				t.Errorf("Expected width %d, got %d", tc.width, jsonOutput.Width)
			}
		})
	}
}

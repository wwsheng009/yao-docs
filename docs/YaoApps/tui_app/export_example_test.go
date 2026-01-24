package demo

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/yaoapp/yao/tui/dsl"
	"github.com/yaoapp/yao/tui/runtime"
)

// ExportDemo demonstrates exporting TUI layouts to various formats.
// This can be called from tests or a main package.
func ExportDemo() error {
	// Read the Gemini chat layout
	data, err := os.ReadFile("tuis/layouts/gemini-chat.tui.yao")
	if err != nil {
		return fmt.Errorf("failed to read layout file: %w", err)
	}

	// Parse and validate
	cfg, _, err := dsl.ValidateAndConvert(data, "gemini-chat.tui.yao")
	if err != nil {
		return fmt.Errorf("failed to parse layout: %w", err)
	}

	// Create component registry with template data
	registry := NewComponentRegistryWithData(cfg.Data)

	// Create layout tree with components bound
	layoutRoot, err := registry.CreateLayoutTreeWithComponents(cfg)
	if err != nil {
		return fmt.Errorf("failed to create layout tree: %w", err)
	}
	if layoutRoot == nil {
		return fmt.Errorf("failed to create layout tree from DSL config")
	}

	// Create runtime and render
	rt := runtime.NewRuntime(80, 24)
	constraints := runtime.NewBoxConstraints(0, 80, 0, 24)
	result := rt.Layout(layoutRoot, constraints)
	frame := rt.Render(result)

	// Create output directory
	outputDir := "tuis/exports"
	os.MkdirAll(outputDir, 0755)

	// Create exporter
	exporter := runtime.NewExporter(&frame, &result)

	// Export to TXT
	txtPath := filepath.Join(outputDir, "gemini-chat.txt")
	if err := exporter.SaveToTXT(txtPath); err != nil {
		fmt.Printf("✗ Failed to export TXT: %v\n", err)
	} else {
		fmt.Printf("✓ Exported to TXT: %s\n", txtPath)
	}

	// Export to SVG
	svgPath := filepath.Join(outputDir, "gemini-chat.svg")
	if err := exporter.SaveToSVG(svgPath); err != nil {
		fmt.Printf("✗ Failed to export SVG: %v\n", err)
	} else {
		fmt.Printf("✓ Exported to SVG: %s\n", svgPath)
	}

	// Export to PNG
	pngPath := filepath.Join(outputDir, "gemini-chat.png")
	if err := exporter.SaveToPNG(pngPath); err != nil {
		fmt.Printf("✗ Failed to export PNG: %v\n", err)
	} else {
		fmt.Printf("✓ Exported to PNG: %s\n", pngPath)
	}

	// Export to HTML
	htmlPath := filepath.Join(outputDir, "gemini-chat.html")
	html, err := exporter.ToHTML()
	if err != nil {
		fmt.Printf("✗ Failed to generate HTML: %v\n", err)
	} else {
		if err := os.WriteFile(htmlPath, []byte(html), 0644); err != nil {
			fmt.Printf("✗ Failed to write HTML: %v\n", err)
		} else {
			fmt.Printf("✓ Exported to HTML: %s\n", htmlPath)
		}
	}

	// Export to light theme PNG
	lightExporter := runtime.NewExporter(&frame, &result)
	lightExporter.SetColorScheme(runtime.LightColorScheme())

	pngLightPath := filepath.Join(outputDir, "gemini-chat-light.png")
	if err := lightExporter.SaveToPNG(pngLightPath); err != nil {
		fmt.Printf("✗ Failed to export light PNG: %v\n", err)
	} else {
		fmt.Printf("✓ Exported to PNG (light theme): %s\n", pngLightPath)
	}

	// Print summary
	debug := runtime.DebugFrame(&frame, &result)
	fmt.Printf("\n=== Export Summary ===\n")
	fmt.Printf("%s\n", debug.Summary)
	if debug.BufferInfo != nil {
		fmt.Printf("Buffer: %dx%d, %d/%d cells non-empty (%.1f%%)\n",
			debug.BufferInfo.Width,
			debug.BufferInfo.Height,
			debug.BufferInfo.NonEmpty,
			debug.BufferInfo.TotalCells,
			float64(debug.BufferInfo.NonEmpty)*100/float64(debug.BufferInfo.TotalCells))
	}

	fmt.Println("\nOpen the files to view the exported layout:")
	fmt.Println("  - TXT: Text version (view in any text editor)")
	fmt.Println("  - SVG: View in browser (scalable)")
	fmt.Println("  - PNG: Image with bitmap font")
	fmt.Println("  - HTML: Embedded SVG in HTML (view in browser)")

	return nil
}

// TestExportDemo runs the export demonstration.
func TestExportDemo(t *testing.T) {
	if err := ExportDemo(); err != nil {
		t.Fatalf("ExportDemo failed: %v", err)
	}
}

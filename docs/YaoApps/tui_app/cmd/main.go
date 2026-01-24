// Command-line demo application using the new TUI runtime.
package main

import (
	"fmt"
	"os"

	"github.com/yaoapp/kun/log"
	"github.com/yaoapp/yao/tui/demo"
)

func main() {
	// Check if file argument is provided
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <tui-file>")
		fmt.Println("")
		fmt.Println("Example:")
		fmt.Println("  go run main.go ../demo/tuis/layouts/nested.tui.yao")
		fmt.Println("")
		fmt.Println("Controls:")
		fmt.Println("  q / Ctrl+C - Quit")
		os.Exit(1)
	}

	filename := os.Args[1]

	// Set log level
	log.SetLevel(log.WarnLevel)

	// Run the demo
	if err := demo.RunFromFile(filename); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}

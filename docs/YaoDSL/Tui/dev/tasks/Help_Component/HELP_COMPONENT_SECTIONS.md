# Help Component - Sections Format Support

## Overview

The Help component now supports a structured `sections` format for displaying keyboard shortcuts and help information in grouped categories.

## Usage Example

```json
{
  "name": "Help Component Test",
  "data": {
    "title": "Help Component",
    "description": "Tests for Help component - keyboard shortcuts",
    "helpSections": [
      {
        "title": "Navigation",
        "items": [
          { "key": "Tab", "description": "Focus next input" },
          { "key": "Shift+Tab", "description": "Focus previous input" },
          { "key": "↑ / ↓", "description": "Navigate up/down" },
          { "key": "← / →", "description": "Navigate left/right" }
        ]
      },
      {
        "title": "Actions",
        "items": [
          { "key": "Enter", "description": "Submit/Confirm" },
          { "key": "Esc", "description": "Cancel/Back" },
          { "key": "q", "description": "Quit application" }
        ]
      },
      {
        "title": "General",
        "items": [
          { "key": "Ctrl+C", "description": "Force quit" },
          { "key": "Ctrl+R", "description": "Refresh UI" },
          { "key": "Ctrl+Z", "description": "Suspend application" }
        ]
      }
    ]
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "{{title}}",
          "align": "center"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "{{description}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "Keyboard Shortcuts:"
        }
      },
      {
        "type": "help",
        "id": "helpMenu",
        "props": {
          "sections": "{{helpSections}}",
          "style": "sections",
          "height": 15,
          "width": 80,
          "border": true,
          "sectionTitleColor": "cyan",
          "color": "white"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "Press 'h' to toggle help, 'q' to quit"
        }
      }
    ]
  },
  "bindings": {
    "h": {
      "script": "scripts/tui/help.ts",
      "method": "toggle"
    },
    "q": { "process": "tui.quit" }
  }
}
```

## Available Properties

### Section-Specific Properties

- `sections` (array): Array of help section objects
- `sectionTitleColor` (string): Color for section titles (e.g., "cyan", "yellow")
- `sectionSeparator` (string): Separator between sections (default: "\n")
- `itemSeparator` (string): Separator between items (default: "\n")

### Section Object Structure

```json
{
  "title": "Section Title",
  "items": [
    {
      "key": "Key",
      "description": "Description"
    }
  ]
}
```

### Standard Properties (Still Supported)

- `width` (int): Width of the help component (0 for auto)
- `height` (int): Height of the help component (0 for auto)
- `color` (string): Text color
- `background` (string): Background color
- `border` (bool): Add a border around the help
- `borderColor` (string): Border color
- `padding` (array): Padding values
- `style` (string): Display style - "sections", "full", "compact", or "minimal"
- `keyMap` (map): Traditional key map format (backward compatibility)

## Display Styles

### Sections Style (New)

```json
{
  "style": "sections",
  "sections": [...]
}
```

Displays help in categorized sections with bold titles and aligned key descriptions.

### Full Style

```json
{
  "style": "full"
}
```

Navigation: ↑↓←→ • Select: Enter • Quit: Ctrl+C or Esc

### Compact Style (Default)

```json
{
  "style": "compact"
}
```

↑↓: Navigate • Enter: Select • Esc: Back

### Minimal Style

```json
{
  "style": "minimal"
}
```

↑↓ Enter Esc

## Example Output (Sections Style)

```
Navigation
  Tab                  Focus next input
  Shift+Tab            Focus previous input
  ↑ / ↓                Navigate up/down
  ← / →                Navigate left/right

Actions
  Enter                Submit/Confirm
  Esc                  Cancel/Back
  q                    Quit application

General
  Ctrl+C               Force quit
  Ctrl+R               Refresh UI
  Ctrl+Z               Suspend application
```

## Backward Compatibility

The component maintains full backward compatibility with the original `keyMap` format:

```json
{
  "type": "help",
  "props": {
    "keyMap": {
      "h": "Toggle help",
      "q": "Quit"
    },
    "style": "compact"
  }
}
```

## Tips

1. Use the `sections` format for complex help menus with many keyboard shortcuts
2. Use `sectionTitleColor` to make section titles stand out
3. Adjust `sectionSeparator` and `itemSeparator` to control spacing
4. Combine with `border: true` for a polished look
5. The `style: "sections"` is automatically selected when `sections` property is provided

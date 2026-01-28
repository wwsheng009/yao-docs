# TUI Demo Examples

This directory contains example TUI configuration files demonstrating various component usage.

## Available Examples

### doc-table.tui.yao

A table component displaying document statistics with:

- 3 columns: 提交, 文档类型, 文件数
- 11 rows of document data
- Bordered table with keyboard navigation

## Running a Demo

```bash
# Run the document table demo
yao run tui.demo.tuis.doc-table

# Or using the TUI command
yao tui tui/demo/tuis/doc-table.tui.yao
```

## Keyboard Shortcuts

| Key    | Action                 |
| ------ | ---------------------- |
| ↑/↓    | Move selection up/down |
| Enter  | Confirm selection      |
| q      | Quit                   |
| Esc    | Quit                   |
| Ctrl+C | Quit                   |

## Creating Your Own Demo

1. Create a new `.tui.yao` file in the `tuis/` directory
2. Follow the JSON structure:
   - `name`: Display name
   - `data`: Data bindings for the UI
   - `layout`: Component tree structure
   - `bindings`: Key bindings

### Component Types

- `header`: Application header
- `text`: Static text display
- `list`: Scrollable list
- `table`: Data table
- `form`: Input form
- `input`: Single-line input
- `textarea`: Multi-line text input
- `button`: Clickable button
- `checkbox`: Toggle checkbox
- `radio`: Radio button group
- `progress`: Progress bar
- `spinner`: Loading indicator
- `modal`: Modal dialog

# TUI 命令命名冲突分析

## 问题确认

### Cobra 的优先级规则

Cobra 框架的子命令优先级：

1. Subcommands (子命令) - 最高优先级
2. Positional arguments (位置参数) - 较低优先级

### 冲突场景

| 场景 | TUI 配置        | 命令               | 结果                | 是否冲突            |
| ---- | --------------- | ------------------ | ------------------- | ------------------- |
| 1    | 无              | `yao tui list`     | 执行 ListCmd        | 否                  |
| 2    | `list.tui.yao`  | `yao tui list`     | 执行 ListCmd 子命令 | 是，TUI 被忽略      |
| 3    | `list.tui.yao`  | `yao tui validate` | 执行 ValidateCmd    | 是，list TUI 被隐藏 |
| 4    | `myapp.tui.yao` | `yao tui myapp`    | 执行 myapp TUI      | 否                  |

### 保留字名称

与子命令冲突的 TUI 名称：

- `list` - `yao tui list`
- `validate` - `yao tui validate`
- `inspect` - `yao tui inspect`
- `check` - `yao tui check`
- `dump` - `yao tui dump`
- `help` - `yao tui help`

## 解决方案

### 方案 1：保留字检查（推荐）⭐

在 `tui/loader.go` 中添加检查：

```go
var reservedTUINames = map[string]bool{
	"list":     true,
	"validate": true,
	"inspect":  true,
	"check":    true,
	"dump":     true,
	"help":     true,
}

func checkConfigurationConflicts() {
	conflicts := []string{}

	cache.Range(func(key, value interface{}) bool {
		tuiID, ok := key.(string)
		if !ok {
			return true
		}

		if isReservedTUIName(tuiID) {
			conflicts = append(conflicts, tuiID)
		}
		return true
	})

	if len(conflicts) > 0 {
		for _, name := range conflicts {
			log.Warn("TUI configuration '%s' conflicts with a subcommand. " +
				"Use: yao run tui.%s", name, name)
		}
	}
}

func isReservedTUIName(tuiID string) bool {
	if strings.HasPrefix(tuiID, "__") {
		return false // 系统 TUI
	}
	return reservedTUINames[tuiID]
}
```

## 建议

### 最佳实践

1. **使用描述性名称**：
   - ✅ `user-dashboard`, `data-editor`, `file-browser`
   - ❌ `list`, `edit`, `view`

2. **使用前缀避免冲突**：
   - ✅ `my-list`, `app-validate`, `tools/inspect`
   - ❌ `list`, `validate`, `inspect`

3. **如果存在冲突**：
   - 重命名：`list.tui.yao` → `my-list.tui.yao`
   - 或者使用 `yao run tui.list` 访问

### 访问方式

如果 TUI 使用了保留字名称：

```bash
# 方法 1：使用 run 命令
yao run tui.list

# 方法 2：重命名配置文件
mv tuis/list.tui.yao tuis/my-list.tui.yao
yao tui my-list
```

## 总结

- **确认存在冲突**：子命令优先级高于 TUI 位置参数
- **系统 TUI 使用 `__` 前缀**：避免了冲突
- **推荐方案**：添加保留字检查和警告
- **用户指导**：提供命名指南和替代访问方式

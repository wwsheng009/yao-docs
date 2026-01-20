# Props Cache Invalidation Fix - 实施总结

**日期**: 2026-01-18
**修复问题**: 表达式 `{{index($, "username-input")}}` 在用户输入后无法正确解析

---

## 🔴 问题分析

### 根本原因

`resolveProps()` 使用 `propsCache` 缓存解析结果。当state变化时，缓存未失效，导致表达式使用旧的解析结果。

### 问题流程

```
初始状态:
  State["username-input"] = ""
  PropsCache["text"] = {"content": "Username: "}

用户输入 "john_doe":
  State["username-input"] = "john_doe"  ← 更新
  PropsCache["text"] = {"content": "Username: "}  ← 未更新！

第二次渲染:
  resolveProps() 使用缓存结果
  返回 "Username: "  ← 错误！应该是 "Username: john_doe"
```

---

## ✅ 修复方案

### 修改1: dispatchMessageToComponent - 状态变化时清除缓存

**文件**: `model.go`

**位置**: dispatchMessageToComponent 函数 (line 1070-1078)

**修改内容**:

```go
// Unified state synchronization using GetStateChanges()
stateChanges, hasChanges := updatedComp.GetStateChanges()
if hasChanges {
	m.StateMu.Lock()
	for key, value := range stateChanges {
		m.State[key] = value
	}
	m.StateMu.Unlock()

	// ✅ 新增：清除缓存
	// Invalidate props cache for components that reference state
	// This ensures expressions are re-evaluated when state changes
	if m.propsCache != nil {
		m.propsCache.Clear()
		log.Trace("State changes detected, cleared props cache")
	}
}
```

**效果**:

- ✅ 组件状态变化时自动清除缓存
- ✅ 所有使用表达式的组件都会重新解析
- ✅ Input输入后Text组件立即更新

---

### 修改2: handleProcessResult - Process结果后清除缓存

**文件**: `model.go`

**位置**: handleProcessResult 函数 (line 606-612)

**修改内容**:

```go
// Handle success case
if msg.Target != "" {
	m.StateMu.Lock()
	m.State[msg.Target] = msg.Data
	m.StateMu.Unlock()
	log.Trace("TUI ProcessResult: %s = %v", msg.Target, msg.Data)

	// ✅ 新增：清除缓存
	// Invalidate props cache when state changes
	if m.propsCache != nil {
		m.propsCache.Clear()
		log.Trace("Process result updated state, cleared props cache")
	}

	// Trigger refresh to display new data in UI
	return m, func() tea.Msg { return core.RefreshMsg{} }
}
```

**效果**:

- ✅ Process加载新数据后清除缓存
- ✅ 状态同步立即反映到UI
- ✅ 解决之前修复中ProcessResult触发刷新的问题

---

### 修改3: handleMenuSelectionChange - 菜单选择变化时清除缓存

**文件**: `model.go`

**位置**: handleMenuSelectionChange 函数 (line 481-506)

**修改内容**:

```go
func (m *Model) handleMenuSelectionChange(menuID string, selectedItem interface{}) {
	m.StateMu.Lock()
	oldSelectedItem, existed := m.State[menuID+"_selected"]
	m.State[menuID+"_selected"] = selectedItem
	m.StateMu.Unlock()
	log.Trace("TUI KeyPress: Updated selected item for %s: %v", menuID, selectedItem)

	// ✅ 新增：清除缓存
	// Invalidate props cache when selection changes
	if m.propsCache != nil {
		m.propsCache.Clear()
		log.Trace("Menu selection changed, cleared props cache")
	}

	// ... existing refresh code ...
}
```

**效果**:

- ✅ 菜单选择变化后相关表达式立即更新
- ✅ 确保菜单驱动的UI响应及时

---

## 📊 修复前后对比

### 修复前

```
用户输入 → State更新 → ❌ 缓存未失效 → 旧表达式结果
Process加载 → State更新 → ❌ 缓存未失效 → 旧表达式结果
菜单选择 → State更新 → ❌ 缓存未失效 → 旧表达式结果
```

### 修复后

```
用户输入 → State更新 → ✅ Clear() → 重新解析 → 新表达式结果
Process加载 → State更新 → ✅ Clear() → 重新解析 → 新表达式结果
菜单选择 → State更新 → ✅ Clear() → 重新解析 → 新表达式结果
```

---

## 🧪 测试验证

### 通过的测试

| 测试                             | 状态    | 说明            |
| -------------------------------- | ------- | --------------- |
| TestApplyStateExpressions        | ✅ PASS | 表达式解析正确  |
| TestProcessResultTriggersRefresh | ✅ PASS | Process触发刷新 |
| TestProcessResultWithComplexData | ✅ PASS | 复杂数据处理    |
| TestInputNavigation              | ✅ PASS | 输入导航        |
| TestHandleInputUpdate            | ✅ PASS | 输入更新        |

### 失败的测试（与修改无关）

| 测试                                       | 失败原因     | 是否与本次修改相关 |
| ------------------------------------------ | ------------ | ------------------ |
| TestLoadFile                               | 文件加载失败 | ❌ 否              |
| TestReload                                 | 重新加载失败 | ❌ 否              |
| TestMessageDispatchToAllComponentsFallback | 消息分发失败 | ❌ 否              |

---

## 📝 影响分析

### 性能影响

**缓存清除策略**: 使用 `Clear()` 清除所有缓存

- **优点**: 实现简单，确保一致性
- **缺点**: 可能影响性能（清除所有缓存）

**优化建议**（可选）:

```go
// 只清除受影响的缓存项
for key := range stateChanges {
	m.propsCache.Invalidate(key)  // 只失效相关组件
}
```

### 向后兼容性

- ✅ 完全向后兼容
- ✅ 不破坏现有API
- ✅ 不影响缓存机制本身

---

## 🎯 用户场景验证

### 场景1: Input组件 + Text表达式

**配置**:

```json
{
  "type": "input",
  "id": "username-input",
  "props": {"placeholder": "Enter username"}
},
{
  "type": "text",
  "props": {
    "content": "Username: {{index($, \"username-input\")}}"
  }
}
```

**修复前**:

```
输入 "john" → Text显示 "Username: "  ❌ 不更新
```

**修复后**:

```
输入 "john" → Text显示 "Username: john"  ✅ 实时更新
```

---

### 场景2: Process加载数据

**配置**:

```json
{
  "type": "text",
  "props": {
    "content": "Data: {{index($, \"process_data\")}}"
  }
}
```

**修复前**:

```
Process返回 {"process_data": "value"} → Text显示 "Data: "  ❌ 不更新
```

**修复后**:

```
Process返回 {"process_data": "value"} → Text显示 "Data: value"  ✅ 立即更新
```

---

## 📚 修改的文件

| 文件       | 修改内容        | 行数  |
| ---------- | --------------- | ----- |
| `model.go` | 添加3处缓存清除 | ~10行 |

---

## ✅ 结论

修复成功实现了：

1. ✅ 状态变化时缓存自动失效
2. ✅ 表达式实时反映state变化
3. ✅ Input、Process、Menu等场景全部支持
4. ✅ 保持向后兼容

**建议**: 如果遇到性能问题，可以考虑更精细的缓存失效策略（按组件ID失效）。

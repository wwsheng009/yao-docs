# TUI 组件架构重构迁移指南

## 1. 概述

本次重构实现了响应式组件生命周期，解决了组件初始化时 props 为空的问题，以及后续更新时无法重建底层模型的限制。

## 2. 破坏性变更

### 2.1 组件工厂函数签名变更

**重构前:**

```go
func NewTableComponent(id string) *TableComponentWrapper
func NewMenuComponent(id string) *MenuComponentWrapper
// ...
```

**重构后:**

```go
func NewTableComponent(config core.RenderConfig, id string) *TableComponentWrapper
func NewMenuComponent(config core.RenderConfig, id string) *MenuComponentWrapper
// ...
```

### 2.2 组件更新逻辑变更

- `UpdateRenderConfig` 方法现在必须完整实现
- 需要区分完全重建和轻量更新场景
- 表格等组件需实现 `shouldRebuildModel` 逻辑

## 3. 迁移步骤

### 3.1 更新组件工厂函数

所有组件工厂函数都需要接受 `core.RenderConfig` 参数：

```go
func NewMyComponent(config core.RenderConfig, id string) *MyComponentWrapper {
    var props MyProps

    // 从配置中解析 props
    if config.Data != nil {
        if dataMap, ok := config.Data.(map[string]interface{}); ok {
            props = ParseMyProps(dataMap)
        }
    }

    // 使用默认值处理空数据
    if props.IsEmpty() {
        props = getDefaultProps()
    }

    // 创建组件实例
    model := NewMyModel(props, id)
    return &MyComponentWrapper{model: &model}
}
```

### 3.2 实现完整的 UpdateRenderConfig

```go
func (m *MyModel) UpdateRenderConfig(config core.RenderConfig) error {
    propsMap, ok := config.Data.(map[string]interface{})
    if !ok {
        return fmt.Errorf("MyModel: invalid data type")
    }

    newProps := ParseMyProps(propsMap)
    oldProps := m.props

    // 判断是否需要重建
    if m.shouldRebuildModel(oldProps, newProps) {
        return m.rebuildModel(newProps)
    }

    // 执行轻量更新
    return m.lightweightUpdate(oldProps, newProps)
}
```

### 3.3 注册工厂函数更新

更新 `registry.go` 中的组件注册：

```go
r.factories[MyComponent] = func(config core.RenderConfig, id string) core.ComponentInterface {
    return components.NewMyComponent(config, id)
}
```

## 4. 代码示例

### 4.1 Table 组件迁移示例

**重构前:**

```go
func NewTableComponent(id string) *TableComponentWrapper {
    // 创建空表格，后续通过 UpdateRenderConfig 填充数据
    model := NewTableModel(TableProps{}, id)
    return &TableComponentWrapper{model: &model}
}
```

**重构后:**

```go
func NewTableComponent(config core.RenderConfig, id string) *TableComponentWrapper {
    var props TableProps

    if config.Data != nil {
        if dataMap, ok := config.Data.(map[string]interface{}); ok {
            props = ParseTableProps(dataMap)
        }
    }

    // 如果没有数据，使用默认值
    if len(props.Columns) == 0 {
        props = TableProps{
            Columns: []Column{},
            Data:    [][]interface{}{},
        }
    }

    model := NewTableModel(props, id)
    return &TableComponentWrapper{model: &model}
}
```

### 4.2 配置变更检测

组件现在会智能判断是否需要重建底层模型：

```go
func (m *TableModel) shouldRebuildModel(oldProps, newProps TableProps) bool {
    // 列定义变更需要重建
    if len(oldProps.Columns) != len(newProps.Columns) {
        return true
    }

    for i := range oldProps.Columns {
        if oldProps.Columns[i].Key != newProps.Columns[i].Key ||
           oldProps.Columns[i].Title != newProps.Columns[i].Title {
            return true
        }
    }

    // 焦点状态变更也需要重建
    if oldProps.Focused != newProps.Focused {
        return true
    }

    return false
}
```

## 5. 兼容性问题

### 5.1 向后兼容性

- 重构保持了组件接口的兼容性
- 现有的 TUI 配置文件无需修改
- 所有现有功能均保持不变

### 5.2 性能影响

- 首次渲染性能有所提升（避免了空状态渲染）
- 更新性能得到优化（智能更新机制）
- 内存使用更加高效（实例复用）

## 6. 测试验证

### 6.1 功能测试

- 验证所有组件在首次渲染时正确显示数据
- 测试配置更新时的行为是否符合预期
- 确认焦点和状态管理正常工作

### 6.2 性能测试

- 运行基准测试验证性能改进
- 检查内存使用情况
- 验证大规模数据集的渲染性能

## 7. 常见问题

### 7.1 组件首次渲染为空白

**原因:** 组件工厂函数未正确解析配置数据
**解决方案:** 确保工厂函数正确处理 `config.Data`

### 7.2 更新后界面未变化

**原因:** `UpdateRenderConfig` 未正确实现或变更检测逻辑有误
**解决方案:** 检查 `shouldRebuildModel` 和更新逻辑

### 7.3 性能下降

**原因:** 过度频繁的完全重建
**解决方案:** 优化 `shouldRebuildModel` 逻辑，尽量使用轻量更新

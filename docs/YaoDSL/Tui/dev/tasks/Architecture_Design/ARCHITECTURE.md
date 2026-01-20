# TUI 组件架构文档

## 1. 组件生命周期

TUI 组件遵循响应式生命周期模式，确保组件实例与配置数据始终保持同步：

### 1.1 创建阶段

- 组件工厂函数接收 `core.RenderConfig` 和组件 ID
- 从配置中解析 props 并初始化组件状态
- 返回完全初始化的组件实例

### 1.2 更新阶段

- 检测配置变更（深度比较）
- 根据变更类型决定是否重建底层模型
- 执行轻量更新以最小化性能影响

### 1.3 销毁阶段

- 调用 `Cleanup()` 方法释放资源
- 从注册表中移除实例

## 2. 配置传递机制

### 2.1 RenderConfig 结构

```go
type RenderConfig struct {
    Data   interface{} // 组件数据
    Width  int         // 渲染宽度
    Height int         // 渲染高度
}
```

### 2.2 配置传递流程

1. `RenderComponent` 函数从组件定义中提取 props
2. 应用状态绑定和表达式解析
3. 调用组件工厂函数创建实例
4. 将解析后的配置传递给组件

### 2.3 工厂函数签名

```go
type ComponentFactory func(config core.RenderConfig, id string) core.ComponentInterface
```

## 3. 状态同步机制

### 3.1 双向状态同步

- 全局状态 → 组件 props
- 组件内部状态 → 全局状态

### 3.2 GetStateChanges 方法

组件通过实现 `GetStateChanges()` 方法向全局状态推送变更：

```go
func (c *MyComponent) GetStateChanges() (map[string]interface{}, bool) {
    // 返回需要同步到全局状态的数据
    return map[string]interface{}{
        "component_value": c.currentValue,
    }, true
}
```

## 4. 组件实例管理

### 4.1 ComponentInstanceRegistry

负责管理组件实例的完整生命周期：

- 实例创建与缓存
- 配置变更检测
- 资源清理

### 4.2 配置变更检测

```go
func isRenderConfigChanged(old, new core.RenderConfig) bool {
    return !reflect.DeepEqual(old.Data, new.Data) ||
           old.Width != new.Width ||
           old.Height != new.Height
}
```

## 5. 性能优化策略

### 5.1 表达式缓存

- 编译后的表达式程序被缓存
- TTL 机制防止内存泄漏
- 线程安全的并发访问

### 5.2 Props 缓存

- 解析后的 props 被缓存
- 基于组件 ID 和状态快照的缓存键
- 避免重复的表达式求值

### 5.3 智能更新

- 仅在配置真正变更时更新组件
- 区分完全重建和轻量更新
- 最小化不必要的重渲染

## 6. 最佳实践

### 6.1 组件开发

- 实现 `UpdateRenderConfig` 方法处理配置变更
- 在适当的时候重建底层模型
- 保持组件状态与 props 同步

### 6.2 配置使用

- 确保配置数据的一致性和有效性
- 避免频繁的配置变更
- 合理使用表达式绑定

### 6.3 性能考虑

- 优先使用轻量更新而非完全重建
- 合理设置组件尺寸以避免过度计算
- 监控大型数据集的渲染性能

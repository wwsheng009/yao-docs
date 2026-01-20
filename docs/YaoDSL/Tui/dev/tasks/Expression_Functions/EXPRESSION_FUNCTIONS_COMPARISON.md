# evaluateExpression vs resolveExpressionValue 对比分析

## 函数签名对比

### evaluateExpression (render.go:282-314)

```go
func (m *Model) evaluateExpression(expression string) (interface{}, error) {
    // 实现代码...
    return res, nil  // 或 return nil, err
}
```

### resolveExpressionValue (render.go:243-275)

```go
func (m *Model) resolveExpressionValue(expression string) (interface{}, bool) {
    // 实现代码...
    return res, true   // 或 return nil, false
}
```

---

## 核心差异

| 特性         | evaluateExpression      | resolveExpressionValue |
| ------------ | ----------------------- | ---------------------- |
| **返回类型** | `(interface{}, error)`  | `(interface{}, bool)`  |
| **错误传递** | 直接返回 error 给调用者 | 记录日志，返回 `false` |
| **错误处理** | 调用者必须处理错误      | 内部静默处理           |
| **使用场景** | `applyState()`          | `resolveProps()`       |

---

## 实现对比

### 共同部分 (完全相同)

```go
// 1. 预处理表达式
processedExpression := preprocessExpression(expression, m.State)

// 2. 构建环境变量
m.StateMu.RLock()
env := make(map[string]interface{})
for k, v := range m.State {
    env[k] = v
}
env["$"] = m.State  // 添加 $ 变量引用整个 state
m.StateMu.RUnlock()

// 3. 缓存编译
program, err := m.exprCache.GetOrCompile(processedExpression, func(exprStr string) (*vm.Program, error) {
    return expr.Compile(exprStr, append([]expr.Option{expr.Env(env)}, exprOptions...)...)
})

// 4. 运行表达式
res, err := vm.Run(program, env)
```

### 差异部分 - 错误处理

#### evaluateExpression

```go
if err != nil {
    return nil, err  // ← 返回错误，让调用者处理
}
return res, nil
```

**特点**:

- 错误向上传播
- 调用者可以决定如何处理（记录、显示、忽略等）
- 更符合 Go 错误处理惯例

#### resolveExpressionValue

```go
if err != nil {
    log.Warn("Expression compilation failed: %v, expression: %s", err, processedExpression)
    return nil, false  // ← 记录警告，返回失败标志
}

if err != nil {
    log.Warn("Expression evaluation failed: %v, expression: %s", err, processedExpression)
    return nil, false  // ← 记录警告，返回失败标志
}

return res, true
```

**特点**:

- 错误在内部处理
- 只返回成功/失败标志
- 调用者不需要处理错误
- 适合批量处理场景

---

## 使用场景分析

### evaluateExpression 的使用

**位置**: `render.go:441, 516, 538`

**调用者**: `applyState()` - 处理字符串中的表达式

```go
func (m *Model) applyState(text string) string {
    // ...
    for _, match := range matches {
        // ...
        // Evaluate the expression
        res, err := m.evaluateExpression(expression)  // ← 使用 evaluateExpression
        if err != nil {
            log.Warn("Expression evaluation failed: %v, expression: %s", err, expression)
            continue  // ← 跳过失败的表达式
        }
        // Convert result to string
        replacement = fmt.Sprintf("%v", res)
    }
    // ...
}
```

**为什么使用它**:

- 需要**批量处理**多个表达式
- 某个表达式失败不应影响其他表达式
- 调用者需要**错误信息**来决定是否跳过

---

### resolveExpressionValue 的使用

**位置**: `render.go:348, 391`

**调用者**: `resolveProps()` - 解析组件属性

```go
func (m *Model) resolveProps(comp *Component) map[string]interface{} {
    // ...
    for key, value := range comp.Props {
        if str, ok := value.(string); ok {
            if containsExpression(str) {
                // Extract expression
                trimmed := strings.TrimSpace(...)
                // Resolve expression
                resolvedValue, success := m.resolveExpressionValue(trimmed)  // ← 使用 resolveExpressionValue
                if success {
                    result[key] = resolvedValue
                } else {
                    result[key] = value  // ← 失败时保持原值
                }
            }
        }
    }
    // ...
}
```

**为什么使用它**:

- 需要**失败时回退到原值**
- 静默失败更适合属性解析
- 组件渲染不应因单个属性解析失败而中断

---

## 调用栈对比

### evaluateExpression 调用路径

```
Model.View()
  → renderLayout()
    → renderLayoutNode()
      → RenderComponent()
        → resolveProps()  // ← 不调 evaluateExpression
```

```
Model.applyState()  // ← 这里调用
  → evaluateExpression()
```

### resolveExpressionValue 调用路径

```
Model.View()
  → renderLayout()
    → renderLayoutNode()
      → RenderComponent()
        → resolveProps()  // ← 这里调用
          → resolveExpressionValue()
```

---

## 问题分析：为什么表达式无法解析？

根据你的问题 `{{index($, "username-input")}}` 无法解析，让我分析：

### 可能的原因

1. **表达式语法问题**:
   - JSON中: `"content": "{{index($, \"username-input\")}}"`
   - 解析后: `index($, "username-input")`
   - ✅ 如果state中`username-input`键存在，应该能解析

2. **State中键不存在**:

   ```json
   "data": {
     "username": "",      // ← 存在
     "username-input": "" // ← 也存在
   }
   ```

   - ✅ 键存在

3. **Input组件的值没有同步到State**:
   - 这是**最可能的问题**！
   - Input组件需要用户输入后才能更新state
   - 初始渲染时，state中`username-input`可能是空字符串`""`

### 调用流程问题

```
1. 初始化:
   cfg.Data = {"username-input": ""}  // ← 空字符串

2. 第一次渲染 (View()):
   resolveProps() 检测到表达式
   resolveExpressionValue("index($, \"username-input\")")
     → 返回 "" (空字符串)
   结果: "Username: "  ← 看起来像没解析

3. 用户输入 "john_doe":
   dispatchMessageToComponent("username-input", keyMsg)
     → Input组件更新
     → syncInputComponentState()
       → State["username-input"] = "john_doe"

4. 第二次渲染:
   resolveProps() 重新解析
   resolveExpressionValue("index($, \"username-input\")")
     → 返回 "john_doe"
   结果: "Username: john_doe"  ← 正确！
```

---

## 关键发现

### `resolveProps` 的缓存机制

```go
// render.go:332-378
if m.propsCache != nil && comp.ID != "" {
    resolvedProps, err := m.propsCache.GetOrResolve(
        comp.ID,
        comp.Props,
        currentState,  // ← 使用当前state快照
        func() (map[string]interface{}, error) {
            // 解析逻辑
        },
    )
    if err == nil {
        return resolvedProps
    }
}
```

**问题**: `propsCache` 可能缓存了旧的解析结果！

如果：

1. 第一次渲染时 `username-input` = ""
2. 缓存存储了解析结果 `"Username: "`
3. 用户输入后 `username-input` = "john_doe"
4. 但缓存可能没有失效！

### 解决方案

**方案1**: 确保props缓存正确处理state变化

检查 `propsCache.GetOrResolve` 的实现，它应该基于 `currentState` 来决定是否重新解析。

**方案2**: 在用户输入后强制刷新

```go
// 在dispatchMessageToComponent中
if inputWrapper, ok := updatedComp.(*components.InputComponentWrapper); ok {
    m.syncInputComponentState(componentID, inputWrapper)

    // ✅ 清除相关组件的props缓存
    if m.propsCache != nil {
        m.propsCache.Invalidate(componentID)
    }
}
```

---

## 总结

| 方面     | evaluateExpression     | resolveExpressionValue |
| -------- | ---------------------- | ---------------------- |
| 返回类型 | `(interface{}, error)` | `(interface{}, bool)`  |
| 错误处理 | 返回错误               | 记录日志，返回false    |
| 失败行为 | 调用者决定             | 使用原值               |
| 使用场景 | 字符串表达式替换       | 组件属性解析           |
| 适合     | 需要错误信息的场景     | 批量处理、静默失败     |

**为什么表达式无法解析？**

最可能的原因是：

1. **初始渲染时state为空** → 表达式返回空字符串
2. **Props缓存没有失效** → 即使用户输入后，仍使用旧缓存
3. 需要在state变化时**清除缓存**或**强制重新解析**

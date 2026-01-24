# Yao TUI Framework

Yao TUI (Terminal User Interface) 是一个现代化的终端用户界面框架，基于 Bubble Tea 构建，提供了声明式的组件化布局系统。

## 🚀 特性

- **声明式布局**: 使用类似 CSS Flexbox 的语法定义界面布局
- **组件化架构**: 可复用的 UI 组件系统
- **双向尺寸协商**: 智能的组件尺寸测量与协商机制
- **响应式设计**: 自动适应不同终端尺寸
- **国际化支持**: 多语言和 Unicode 字符正确处理

## 📋 核心概念

### 双向尺寸协商机制

Yao TUI 实现了先进的双向尺寸协商机制，允许组件与布局引擎进行智能交互：

1. **Measurable 接口**: 组件可实现此接口，向布局引擎报告其理想尺寸
2. **约束传递**: 布局引擎向下传递可用空间约束
3. **响应反馈**: 组件根据约束返回其实际需要的尺寸
4. **尺寸通知**: 布局完成后通知组件其最终分配的尺寸

```go
// Measurable 接口允许组件报告其理想大小
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    // maxWidth 和 maxHeight 是父容器可提供的最大空间（减去 padding 和 gap）
    // 返回的 width 和 height 是组件期望的理想尺寸
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

### 布局系统

支持多种布局方式：

- **Flexbox 布局**: 行/列方向的弹性布局
- **Grid 布局**: 网格布局系统
- **绝对定位**: 精确控制元素位置

## 🏗️ 架构概览

```
┌─────────────────┐
│   TUI Model     │ ←─ 主控制器
├─────────────────┤
│  Layout Engine  │ ←─ 布局计算
│  (双向协商)     │
├─────────────────┤
│  Render Engine  │ ←─ 渲染输出
├─────────────────┤
│   Components    │ ←─ UI 组件
│  (Table, Viewport│
│   Text, 等)     │
└─────────────────┘
```

## 📐 布局引擎

### 两阶段布局计算

1. **约束传递阶段**: 父节点向子节点传递可用空间约束
2. **响应计算阶段**: 子节点根据约束返回理想尺寸，父节点据此计算最终布局

### Flex 布局属性

- `direction`: `row` | `column`
- `alignItems`: `start` | `center` | `end` | `stretch`
- `justifyContent`: `start` | `center` | `end` | `space-between` | `space-around`
- `gap`: 间距
- `grow`: 弹性增长
- `shrink`: 弹性收缩
- `padding`: 内边距

## 💡 使用示例

```go
// 示例配置（伪代码）
{
  "layout": {
    "type": "flex",
    "direction": "column",
    "children": [
      {
        "type": "text",
        "props": {
          "content": "标题",
          "verticalAlign": "center",
          "horizontalAlign": "center"
        },
        "style": {
          "height": 3,
          "backgroundColor": "#2E8B57"
        }
      },
      {
        "type": "flex",
        "direction": "row",
        "children": [
          {
            "type": "table",
            "props": { /* 表格配置 */ },
            "style": {
              "width": "flex",
              "height": "flex",
              "grow": 1
            }
          },
          {
            "type": "viewport",
            "props": { /* 视口配置 */ },
            "style": {
              "width": 30,
              "height": "flex",
              "shrink": 0
            }
          }
        ]
      }
    ]
  }
}
```

## 🌐 Unicode 和 ANSI 支持

TUI 框架正确处理：

- **中文等宽字符**: 使用 `go-runewidth` 库正确计算字符宽度
- **ANSI 转义序列**: 使用 `charmbracelet/x/ansi` 库处理颜色和格式
- **多语言文本**: 支持各种 Unicode 字符集

## 🧪 测试

运行测试套件：

```bash
# 运行所有 TUI 测试
go test ./tui -v

# 运行特定测试
go test ./tui/layout -v

# 运行基准测试
go test ./tui -bench=.
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 Yao TUI！

## 📄 许可证

MIT License

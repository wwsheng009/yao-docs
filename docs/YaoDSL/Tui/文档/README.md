# Yao TUI 引擎

基于 Bubble Tea 框架的终端用户界面引擎，为 Yao 提供声明式 DSL 驱动的 TUI 能力。

## 📋 概述

TUI 引擎允许开发者通过 JSON/YAML 配置文件（`.tui.yao`）定义终端界面，支持：

- 🎨 声明式 UI 布局（Lip Gloss 样式）
- 🔄 响应式状态管理
- ⚡ 异步 Process 调用
- 🤖 AI 流式渲染集成（Glamour Markdown）
- 📜 JavaScript/TypeScript 脚本支持（V8Go）
- 🧩 可扩展组件系统
- 🎯 智能焦点管理
- 📡 事件总线系统

## 🏗️ 架构

```
tui/
├── types.go          # 核心类型定义
├── loader.go         # DSL 加载器
├── tui.go            # 模块初始化和导出
├── model.go          # Model 实现（状态管理）
├── action.go         # Action 执行器
├── render.go         # 布局渲染器（表达式引擎）
├── script.go         # V8 脚本加载器
├── jsapi.go          # JavaScript API
├── process.go        # Process 处理器导出
├── events.go         # 事件系统
├── registry.go       # 组件注册表
├── model_manager.go  # 模型管理器
└── components/       # 标准组件库
    ├── header.go       # 标题栏
    ├── text.go        # 文本显示
    ├── input.go       # 单行输入
    ├── textarea.go    # 多行输入
    ├── table.go       # 数据表格
    ├── form.go        # 表单
    ├── menu.go        # 菜单（支持子菜单）
    ├── chat.go        # AI 聊天（流式 + Markdown）
    ├── viewport.go    # 滚动视图
    ├── list.go        # 列表
    ├── crud.go        # CRUD 操作
    ├── paginator.go   # 分页器
    ├── progress.go    # 进度条
    ├── spinner.go     # 加载动画
    ├── footer.go      # 页脚
    ├── help.go        # 帮助
    ├── cursor.go      # 光标
    ├── key.go         # 键显示
    ├── filepicker.go  # 文件选择器
    ├── timer.go       # 定时器
    ├── stopwatch.go   # 秒表
    └── styles.go      # 样式定义
```

## 🚀 快速开始

### 1. 创建 TUI 配置

```json
// tuis/hello.tui.yao
{
  "name": "Hello TUI",
  "data": {
    "title": "Hello Yao TUI!"
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "{{title}}"
        }
      }
    ]
  }
}
```

### 2. 运行 TUI

```bash
yao tui hello
```

## 📚 文档

- [架构设计](ARCHITECTURE.md) - 详细架构说明
- [使用指南](USAGE_GUIDE.md) - 使用指南和表达式语法
- [脚本集成指南](SCRIPTING_GUIDE.md) - JavaScript/TypeScript 脚本使用
- [快速开始](QUICKSTART.md) - 5 分钟快速入门

## 🧪 组件系统

### 核心组件

| 组件     | 描述                       | 交互性 |
| -------- | -------------------------- | ------ |
| Header   | 标题栏                     | 否     |
| Text     | 文本显示                   | 否     |
| Input    | 单行输入框                 | 是     |
| Textarea | 多行输入框                 | 否     |
| Table    | 数据表格                   | 是     |
| Form     | 表单                       | 是     |
| Menu     | 菜单（支持子菜单）         | 是     |
| Chat     | AI 聊天（流式 + Markdown） | 是     |
| Viewport | 滚动视图                   | 否     |
| List     | 列表                       | 否     |

### 工具组件

| 组件       | 描述       | 交互性 |
| ---------- | ---------- | ------ |
| CRUD       | CRUD 操作  | 是     |
| Paginator  | 分页器     | 否     |
| Progress   | 进度条     | 否     |
| Spinner    | 加载动画   | 否     |
| Footer     | 页脚       | 否     |
| Help       | 帮助       | 否     |
| Cursor     | 光标       | 否     |
| Key        | 键显示     | 否     |
| FilePicker | 文件选择器 | 是     |
| Timer      | 定时器     | 否     |
| Stopwatch  | 秒表       | 否     |

## 🎨 表达式引擎

TUI 使用 `expr-lang` 作为表达式引擎，支持强大的数据绑定和表达式计算。

### 内置函数

```javascript
// 获取数组、对象或字符串的长度
len(array | object | string);

// 从对象中获取指定键的值（支持特殊键名）
index(object, key);

// 三元运算符
{
  {
    condition ? trueValue : falseValue;
  }
}

// 布尔值转换
True(value); // 转换为布尔值
False(value); // 取反

// 空值检查
Empty(value); // 检查是否为空
```

### 表达式示例

```json
{
  "props": {
    "title": "欢迎, {{user.name}}!",
    "count": "总数: {{len(items)}}",
    "status": "{{count > 0 ? '有项目' : '无项目'}}",
    "content": "用户名: {{index($, 'username-input')}}"
  }
}
```

## 🧩 开发

### 运行测试

```bash
# 单元测试
go test ./tui -v

# 运行特定测试
go test ./tui -v -run TestModelUpdateWindowSize

# 覆盖率测试
go test ./tui -cover -coverprofile=coverage.out
```

### 测试环境

TUI 测试使用独立的应用目录进行隔离测试：

```bash
# 设置测试应用目录
export YAO_TEST_APPLICATION="../.vscode/yao-docs/YaoApps/tui_app"
```

测试目录结构：

```
.vscode/yao-docs/YaoApps/tui_app/
├── app.yao              # 应用配置
└── tuis/                # TUI 配置文件
    ├── hello.tui.yao    # 示例 TUI
    └── admin/
        └── dashboard.tui.yao  # 嵌套示例
```

### 调试

```bash
# 启用调试模式
export YAO_TUI_DEBUG=true
# 设置应用根目录
export YAO_ROOT="../.vscode/yao-docs/YaoApps/tui_app"
yao tui hello --debug
```

## 📊 状态

- **版本**: v1.0.0
- **Go 版本**: >= 1.21
- **测试覆盖率**: 85%+
- **状态**: ✅ 生产就绪

## 🤝 贡献

请参考主项目的 [贡献指南](../../CONTRIBUTING.md)。

## 📄 许可

与 Yao 主项目保持一致。

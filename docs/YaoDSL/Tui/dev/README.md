# TUI Documentation

Yao TUI 框架文档中心。

## 目录结构

```
docs/
├── architecture/    # 架构设计文档
├── guides/          # 使用指南和迁移文档
├── runtime/         # Runtime 核心文档
├── meta/            # 工作记录和进度跟踪
└── README.md        # 本文件
```

---

## 架构设计 (`architecture/`)

架构文档定义了 TUI 框架的核心设计原则和模块边界。

| 文档                                                                                    | 说明                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [MODULE_BOUNDARIES.md](architecture/MODULE_BOUNDARIES.md)                               | 模块边界定义，规定各层之间的依赖关系和约束             |
| [ARCHITECTURE_CMD_PROPAGATION.md](architecture/ARCHITECTURE_CMD_PROPAGATION.md)         | 命令传播架构，解决 tea.Cmd 无法通过 Runtime 传播的问题 |
| [MESSAGE_PROCESSING_AND_RENDERING.md](architecture/MESSAGE_PROCESSING_AND_RENDERING.md) | 消息处理与渲染机制详解                                 |

---

## 使用指南 (`guides/`)

指南文档帮助开发者使用和迁移到 TUI 框架。

| 文档                                                              | 说明                       |
| ----------------------------------------------------------------- | -------------------------- |
| [MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md)                   | Legacy 到 Runtime 迁移指南 |
| [COMPONENT_MIGRATION_PLAN.md](guides/COMPONENT_MIGRATION_PLAN.md) | 组件迁移计划和状态         |
| [GETTING_STARTED.md](guides/GETTING_STARTED.md)                   | 快速入门指南               |

---

## Runtime 核心 (`runtime/`)

Runtime 是 TUI 框架的纯布局内核，提供核心渲染和布局能力。

| 文档                                       | 说明                        |
| ------------------------------------------ | --------------------------- |
| [README.md](runtime/README.md)             | Runtime v1 规范（API 冻结） |
| [API.md](runtime/API.md)                   | Runtime API 参考            |
| [BEHAVIOR.md](runtime/BEHAVIOR.md)         | 行为规范说明                |
| [ROADMAP.md](runtime/ROADMAP.md)           | 发展路线图                  |
| [CONTRIBUTING.md](runtime/CONTRIBUTING.md) | 贡献指南                    |

---

## 工作记录 (`meta/`)

工作记录文档用于跟踪开发进度和会议总结。

| 文档                                                                        | 说明           |
| --------------------------------------------------------------------------- | -------------- |
| [WORK_SUMMARY.md](meta/WORK_SUMMARY.md)                                     | 实现工作总结   |
| [PRIOTIES_1-7_PROGRESS.md](meta/PRIOTIES_1-7_PROGRESS.md)                   | 优先级进度报告 |
| [SESSION_SUMMARY_PRIORITIES_1-7.md](meta/SESSION_SUMMARY_PRIORITIES_1-7.md) | 会话总结       |
| [RENDERING_TODO.md](meta/RENDERING_TODO.md)                                 | 渲染待办事项   |

---

## 示例文档 (`examples/`)

示例文档位于 `tui/examples/` 目录，包含示例应用的说明。

| 文档                                                                    | 说明           |
| ----------------------------------------------------------------------- | -------------- |
| [examples/README.md](../examples/README.md)                             | 示例应用总览   |
| [examples/todo_app/README.md](../examples/todo_app/README.md)           | Todo 应用示例  |
| [examples/dashboard_app/README.md](../examples/dashboard_app/README.md) | 仪表板应用示例 |

---

## 快速导航

### 新手入门

1. 阅读 [GETTING_STARTED.md](guides/GETTING_STARTED.md) 了解基本概念
2. 查看 [examples/](../examples/) 目录下的示例应用
3. 参考 [runtime/README.md](runtime/README.md) 了解核心 API

### 架构理解

1. 从 [MODULE_BOUNDARIES.md](architecture/MODULE_BOUNDARIES.md) 开始理解模块划分
2. 阅读 [ARCHITECTURE_CMD_PROPAGATION.md](architecture/ARCHITECTURE_CMD_PROPAGATION.md) 理解命令传播机制
3. 深入 [MESSAGE_PROCESSING_AND_RENDERING.md](architecture/MESSAGE_PROCESSING_AND_RENDERING.md) 了解消息处理

### 组件开发

1. 参考 [runtime/API.md](runtime/API.md) 了解组件接口
2. 查看 [MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md) 了解组件实现模式
3. 检查 [COMPONENT_MIGRATION_PLAN.md](guides/COMPONENT_MIGRATION_PLAN.md) 了解现有组件状态

### 贡献代码

1. 阅读 [runtime/CONTRIBUTING.md](runtime/CONTRIBUTING.md) 了解贡献指南
2. 查看 [ROADMAP.md](runtime/ROADMAP.md) 了解发展方向
3. 检查 [meta/](meta/) 目录下的工作记录

---

_最后更新: 2026-01-24_

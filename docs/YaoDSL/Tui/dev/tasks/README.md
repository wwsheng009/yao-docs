# TUI 重构任务目录

本目录用于存放 TUI 项目相关的重构任务和实施计划。

## 目录结构

```
tasks/
└── refactor-unified-key-handling/
    ├── TASK_LIST.md          # 主要任务清单
    └── README.md            # 本文件
```

## 任务列表

### refactor-unified-key-handling

**状态**: 规划中
**目标**: 统一 ESC 和特殊键处理，消除代码重复

详见: [TASK_LIST.md](./refactor-unified-key-handling/TASK_LIST.md)

## 任务模板

如果需要创建新的重构任务，可以参考以下模板：

1. 创建新目录: `tasks/<task-name>/`
2. 创建 `TASK_LIST.md` 文件，包含:
   - 概述
   - 目标
   - 问题现状
   - 重构方案
   - 实施步骤（带验收标准）
   - 风险和注意事项
   - 预期收益
   - 时间估算

## 命名规范

任务目录名称应使用 kebab-case，清晰描述任务内容，例如：

- `refactor-unified-key-handling`
- `optimize-render-performance`
- `implement-component-lifecycle`
- `refactor-focus-management`

## 任务状态跟踪

每个任务应在 `TASK_LIST.md` 中明确标记任务状态：

- 规划中
- 实施中
- 审查中
- 已完成
- 已暂停

每个步骤应使用复选框标记完成状态：

- [ ] 未完成
- [x] 已完成

## 注意事项

1. **原子性**: 每个步骤应该是可独立完成和验证的
2. **可回滚**: 每个步骤都应该能够独立回滚
3. **测试驱动**: 每个步骤完成后都要运行相关测试
4. **文档同步**: 代码修改和文档更新应同步进行

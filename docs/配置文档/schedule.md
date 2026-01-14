---
name: schedule
description: Guide to configuring periodic tasks in Yao using Schedule DSL, supporting both synchronous processes and asynchronous tasks.
license: Complete terms in LICENSE.txt
---

# Schedules 配置指南

Yao 框架中的 Schedule 模块基于 `github.com/robfig/cron` 实现，允许开发者通过配置 DSL (`.sch.yao`) 来定义周期性执行的任务。Schedule 既可以直接执行一个 **Process (处理器)**，也可以将任务分发给 **Task (异步任务队列)**。

## 1\. 目录结构

所有定时任务配置文件应存放在应用的 `schedules` 目录中：

```bash
/path/to/your/project/
├── schedules/
│   ├── mail.sch.yao       # 示例：调用脚本
│   └── sendmail.sch.yao   # 示例：调用 Task
└── app.yao
```

## 2\. DSL 结构定义

`.sch.yao` 文件采用 JSON 格式 (支持注释)。

| 字段         | 类型     | 必填 | 说明                                                                    |
| :----------- | :------- | :--- | :---------------------------------------------------------------------- |
| **name**     | `String` | 是   | 调度任务的名称，用于日志和标识。                                        |
| **schedule** | `String` | 是   | 标准的 Cron 表达式 (支持秒级)。例如 `*/1 * * * *`。                     |
| **process**  | `String` | 否   | 指定要执行的处理器名称 (如 `scripts.mail.Send`)。**与 `task` 二选一**。 |
| **task**     | `String` | 否   | 指定要触发的 Task 名称。**与 `process` 二选一**。                       |
| **args**     | `Array`  | 否   | 传递给 Process 或 Task 的参数列表。支持环境变量引用。                   |

###

## 3\. 配置示例

根据 `process.go` 的逻辑，调度器主要支持两种模式：**同步执行 Process** 和 **异步投递 Task**。

### 场景 A: 周期性执行处理器 (Process)

适用于直接执行某个逻辑脚本或内置处理器。

**文件:** `schedules/mail.sch.yao`

```json
{
  "name": "每分钟发送一封邮件",
  "schedule": "*/1 * * * *",
  "process": "scripts.mail.Send",
  "args": [null, "$ENV.SEND_MAIL_TEST_MAIL"]
}
```

- **逻辑分析**: 当 Cron 触发时，系统会调用 `process.Of("scripts.mail.Send", ...)` 并同步等待其执行完成 (`p.Execute()`)。

### 场景 B: 周期性投递任务 (Task)

适用于需要长时间运行的任务，调度器只负责将任务放入队列，不等待执行结果。

**文件:** `schedules/sendmail.sch.yao`

```json
{
  "name": "每分钟发送一封邮件",
  "schedule": "*/1 * * * *",
  "task": "mail",
  "args": ["$ENV.SEND_MAIL_TEST_MAIL"]
}
```

- **逻辑分析**: 当 Cron 触发时，系统查找名为 `mail` 的 Task，并调用 `Add` 方法将参数压入队列。具体的业务逻辑由 Task 的 worker 异步处理。

## 4\. 环境变量的使用

在 `args` 数组中，你可以使用 `$ENV.变量名` 的格式来引用环境变量。

**代码实现分析 (`schedule/process.go`):**

```go
// parse Args
func (sch *Schedule) parseArgs() {
    // ...
    if v, ok := arg.(string); ok {
        args = append(args, helper.EnvString(v)) // 自动解析 $ENV.
        continue
    }
    // ...
}
```

这意味着在配置中写入 `"$ENV.SEND_MAIL_TEST_MAIL"`，在运行时会被替换为实际的环境变量值。

## 5\. 运行时控制

Schedule 模块注册了 Process 用于在运行时动态管理调度任务。

| Process 名称           | 参数 | 说明               |
| :--------------------- | :--- | :----------------- |
| `schedules.<ID>.Start` | 无   | 启动指定的调度任务 |
| `schedules.<ID>.Stop`  | 无   | 停止指定的调度任务 |

**示例 (Go Test):**

```go
// 启动 mail 调度
process.New("schedules.mail.Start").Exec()

// 停止 mail 调度
process.New("schedules.mail.Stop").Exec()
```

_注意：`<ID>` 通常对应配置文件的文件名（不含扩展名）。_

---

**总结:**
Schedule 模块是连接 Cron 时间触发器与 Yao 业务逻辑（Scripts/Flows/Tasks）的桥梁。对于轻量级逻辑，推荐使用 `process`；对于耗时操作（如批量发送），强烈推荐使用 `task` 以避免阻塞调度器。

如果你需要关于 `Task` 模块的具体配置分析，或者需要 Cron 表达式的详细说明，请随时告诉我。

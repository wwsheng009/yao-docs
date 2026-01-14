---
name: task
description: Guide to configuring asynchronous Tasks in Yao, utilizing Worker Pools and Queues for background processing.
license: Complete terms in LICENSE.txt
---

# Tasks 异步任务配置指南

Yao 框架中的 Task 模块用于处理异步任务。它基于 Golang 的 `Channel` 和 `Goroutine` 实现了一个内存级别的 Worker Pool（工作池）。通过定义 Task，你可以将耗时的操作（如发送邮件、生成报表、AI 推理等）放入队列中异步执行，从而不阻塞主线程。

## 1\. 目录结构

所有异步任务配置文件应存放在应用的 `tasks` 目录中：

```bash
/path/to/your/project/
├── tasks/
│   ├── mail.task.yao       # 示例：邮件发送任务
│   └── report.task.yao     # 示例：报表生成任务
└── app.yao
```

## 2\. 工作原理

Task 模块的核心维护了一个任务队列和一个 Worker 池。

1.  **Add**: 当调用 `tasks.<ID>.Add` 时，任务被封装为 `Job` 并推入 `jobque` 通道。
2.  **Dispatch**: 内部调度器监听通道，一旦有空闲 Worker，立即分发任务。
3.  **Execute**: Worker 调用配置中指定的 `process` 执行具体的业务逻辑。

###

## 3\. DSL 结构定义

`.task.yao` 文件采用 JSON 格式。以下是字段的详细说明及默认值逻辑：

| 字段              | 类型         | 必填 | 默认值 | 说明                                                                                         |
| :---------------- | :----------- | :--- | :----- | :------------------------------------------------------------------------------------------- |
| **name**          | `String`     | 是   | -      | 任务名称，用于日志记录。                                                                     |
| **process**       | `String`     | 是   | -      | **核心逻辑**。Worker 获取任务后调用的处理器名称。注意：**Job ID 会作为第一个参数自动传入**。 |
| **worker_nums**   | `Int/String` | 否   | 1      | 并发 Worker 的数量。支持 `$ENV.变量名` 引用环境变量。                                        |
| **size**          | `Int`        | 否   | 1024   | 任务队列（Channel）的长度。超过此长度且无空闲 Worker 时，添加任务会报错。                    |
| **timeout**       | `Int`        | 否   | 300    | 任务执行的超时时间（秒）。超时后 Context 会被取消。                                          |
| **attempts**      | `Int`        | 否   | 0      | 失败重试次数。                                                                               |
| **attempt_after** | `Int`        | 否   | 200    | 重试间隔时间（毫秒）。                                                                       |
| **event**         | `Object`     | 否   | -      | 生命周期事件钩子（见下文）。                                                                 |

### Event 钩子

可以在任务的不同阶段触发回调 Process：

```json
"event": {
  "next": "scripts.task.NextID",      // 生成自定义 Job ID
  "add": "scripts.task.OnAdd",        // 任务添加到队列时触发
  "success": "scripts.task.OnSuccess",// 任务执行成功时触发
  "error": "scripts.task.OnError",    // 任务执行失败/Panic时触发
  "progress": "scripts.task.OnProgress" // 进度更新时触发
}
```

- **NextID**: 必须返回一个整数作为 Job ID。如果不配置，默认使用队列长度 + 1。
- **Success**: 接收参数 `(id, response)`。
- **Error**: 接收参数 `(id, error_message)`。

## 4\. 配置示例

**文件:** `tasks/mail.task.yao`

```json
{
  "name": "发送邮件",
  "worker_nums": "$ENV.SEND_MAIL_WORKER_NUMS",
  "attempts": 3,
  "attempt_after": 200,
  "timeout": 2,
  "size": 1000,
  "process": "scripts.tests.task.mail.Send",
  "event": {
    "next": "scripts.tests.task.mail.NextID",
    "add": "scripts.tests.task.mail.OnAdd",
    "success": "scripts.tests.task.mail.OnSuccess",
    "error": "scripts.tests.task.mail.OnError",
    "progress": "scripts.tests.task.mail.OnProgress"
  }
}
```

## 5\. 编写处理器 (Handler)

在配置 `process` (如 `scripts.tests.task.mail.Send`) 时，必须遵循特定的函数签名。

**Go 代码分析 (`task/process.go`):**

```go
// taskEventHandlers 函数中
Exec: func(id int, args ...interface{}) (interface{}, error) {
    args = append([]interface{}{id}, args...) // 系统强制将 ID 放在参数列表第一位
    return process.New(o.Process, args...).Exec()
},
```

这意味着你的脚本函数必须接收 `id` 作为第一个参数：

**Scripts 示例 (`scripts/tests/task/mail.js`):**

```javascript
/**
 * 执行发送任务
 * @param id 任务ID (系统自动注入)
 * @param email 接收者邮箱 (用户传入)
 * @param content 邮件内容 (用户传入)
 */
function Send(id, email, content) {
  console.log(`正在处理任务 #${id}: 发送给 ${email}`);

  // 模拟耗时操作
  Process('xiang.system.Sleep', 1000);

  // 在逻辑内部更新进度 (可选)
  // 参数: 任务名称, 任务ID, 当前进度, 总进度, 消息
  Process('tasks.mail.Progress', id, 50, 100, '发送中...');

  return '发送成功';
}
```

## 6\. 使用与调用

Task 定义加载后，会自动注册为一组 Process，可在 API、Flow 或 Script 中调用。假设 Task ID 为 `mail` (文件名 `mail.task.yao`):

| Process               | 参数                         | 返回值         | 说明                                           |
| :-------------------- | :--------------------------- | :------------- | :--------------------------------------------- |
| `tasks.mail.Add`      | `...args`                    | `int` (Job ID) | 添加任务到队列。参数将传递给配置的 `process`。 |
| `tasks.mail.Get`      | `job_id`                     | `Object`       | 获取指定 Job 的状态、进度和结果。              |
| `tasks.mail.Progress` | `id`, `curr`, `total`, `msg` | `null`         | 更新任务进度 (通常在任务内部调用)。            |

**调用示例:**

```javascript
// 添加任务
var jobId = Process('tasks.mail.Add', 'test@example.com', 'Hello World');

// 查询任务状态
var status = Process('tasks.mail.Get', jobId);
// status 输出:
// {
//   "id": 1,
//   "status": "RUNNING",  // WAITING, RUNNING, SUCCESS, FAILURE
//   "current": 0,
//   "total": 0,
//   "message": "",
//   "response": null
// }
```

---

**总结:**
Yao 的 Task 模块通过简单的 JSON 配置提供了强大的异步处理能力。关键点在于理解 **Worker Pool 的并发控制**以及 **Job ID 的自动注入机制**。对于高并发场景，建议合理配置 `worker_nums` 和 `size` 以避免内存溢出或任务积压。

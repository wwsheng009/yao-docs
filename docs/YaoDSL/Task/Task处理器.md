# Task处理器

Yao提供了以下的Task处理器，用于管理和操作异步任务：

## 核心处理器

### `Process('tasks.[task_name].add', ...args)`

添加新的异步任务到任务队列中。

**参数：**

- `...args` - 传递给任务处理器的参数，可以是任意数量和类型

**返回值：**

- `number` - 任务ID（添加成功）
- `0` - 添加失败（任务队列已满或其他错误）

**示例：**

```javascript
// 添加邮件发送任务
const taskId = Process('tasks.mail.add', 'user@example.com', 'Welcome Email');
if (taskId > 0) {
  console.log('任务添加成功，ID:', taskId);
} else {
  console.log('任务添加失败');
}
```

### `Process('tasks.[task_name].progress', id, current, total, message)`

更新指定任务的执行进度。

**参数：**

- `id` - 任务ID（number类型）
- `current` - 当前进度值（number类型）
- `total` - 总进度值（number类型）
- `message` - 进度描述信息（string类型）

**返回值：**

- `null` - 无返回值

**示例：**

```javascript
// 在任务处理器中更新进度
function SendEmail(taskId, email, subject) {
  const totalSteps = 3;

  // 步骤1: 验证邮箱
  Process('tasks.mail.progress', taskId, 1, totalSteps, '验证邮箱地址');

  // 步骤2: 发送邮件
  Process('tasks.mail.progress', taskId, 2, totalSteps, '发送邮件中');

  // 步骤3: 记录日志
  Process('tasks.mail.progress', taskId, 3, totalSteps, '完成发送');
}
```

### `Process('tasks.[task_name].get', id)`

获取指定任务的状态和详细信息。

**参数：**

- `id` - 任务ID（number类型）

**返回值：**
返回包含任务信息的对象：

```javascript
{
  id: number,           // 任务ID
  status: string,       // 任务状态: "WAITING" | "RUNNING" | "SUCCESS" | "FAILURE"
  current: number,      // 当前进度
  total: number,        // 总进度
  message: string,      // 进度信息
  response: any         // 任务执行结果（成功时）或错误信息（失败时）
}
```

**示例：**

```javascript
// 查询任务状态
const taskId = 123;
const taskInfo = Process('tasks.mail.get', taskId);

if (taskInfo) {
  console.log(`任务 #${taskId} 状态: ${taskInfo.status}`);
  console.log(`进度: ${taskInfo.current}/${taskInfo.total}`);
  console.log(`信息: ${taskInfo.message}`);

  if (taskInfo.status === 'SUCCESS') {
    console.log('执行结果:', taskInfo.response);
  } else if (taskInfo.status === 'FAILURE') {
    console.error('错误信息:', taskInfo.response);
  }
} else {
  console.log('任务不存在或已完成');
}
```

## 使用流程

1. **添加任务**：使用 `add` 处理器将任务加入队列
2. **监控进度**：使用 `progress` 处理器更新任务进度（通常在任务执行函数内部调用）
3. **查询状态**：使用 `get` 处理器查询任务当前状态

## 注意事项

- 任务ID是全局唯一的，通过 `add` 处理器返回
- 任务完成后，调用 `get` 处理器会返回错误，因为任务已从内存中清理
- `progress` 处理器通常在任务执行函数内部调用，用于向外部反馈执行进度
- 所有处理器名称中的 `[task_name]` 需要替换为具体的任务名称

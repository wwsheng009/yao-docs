# TUI 应用示例

这是一个演示如何在 TUI (Terminal User Interface) 中使用 JavaScript/TypeScript 脚本的示例项目。

## 项目结构

```
tui_app/
├── scripts/
│   └── tui/                 # TUI 脚本目录
│       ├── todo.ts          # Todo 应用脚本
│       └── calculator.ts    # 计算器应用脚本
├── tuis/                    # TUI 配置文件目录
│   ├── todo.tui.yao         # Todo 应用配置
│   └── calculator.tui.yao   # 计算器应用配置
├── app.yao                  # 应用配置
└── README.md               # 本文件
```

## 如何运行示例

### Todo 应用示例

1. 启动 Todo 应用:

   ```
   yao tui start todo
   ```

2. 控制说明:
   - `+`: 添加新的待办事项
   - `a`: 标记所有待办事项为完成
   - `c`: 清除所有已完成的待办事项
   - `t1`, `t2`: 切换特定待办事项的完成状态
   - `d1`, `d2`: 删除特定待办事项
   - `g`: 获取统计数据
   - `q`: 退出应用

### 计算器应用示例

1. 启动计算器应用:

   ```
   yao tui start calculator
   ```

2. 控制说明:
   - `0`-`9`: 输入数字
   - `+`, `-`, `*`, `/`: 选择运算符
   - `=`: 计算结果
   - `.`: 添加小数点
   - `c`: 清除所有内容
   - `M`: 内存加法
   - `s`: 内存减法
   - `r`: 内存读取
   - `C`: 内存清除
   - `q`: 退出应用

## 脚本功能说明

### Todo 应用脚本 (todo.ts)

这个脚本实现了完整的待办事项管理功能：

- **addItem**: 添加新的待办事项
- **toggleItem**: 切换待办事项的完成状态
- **deleteItem**: 删除待办事项
- **clearCompleted**: 清除所有已完成的待办事项
- **setInput**: 设置输入框值
- **markAllComplete**: 标记所有待办事项为完成
- **getStats**: 获取统计信息

### 计算器应用脚本 (calculator.ts)

这个脚本实现了基本的计算器功能：

- **addDigit**: 添加数字到输入
- **addOperator**: 添加运算符
- **calculateResult**: 执行计算
- **clearAll**: 清除所有内容
- **addDecimal**: 添加小数点
- **memoryAdd/Subtract/Recall/Clear**: 内存操作功能

## TUI 配置说明

TUI 配置文件定义了用户界面的布局和按键绑定：

- `name`: 应用名称
- `data`: 初始状态数据
- `layout`: 界面布局定义
- `bindings`: 按键与脚本方法的绑定关系

### 绑定语法

```json
"key": {
  "script": "scripts/tui/script-name",
  "method": "methodName"
}
```

这将把指定按键映射到对应的脚本方法。

## 开发自己的 TUI 应用

1. 在 `scripts/tui/` 目录下创建你的 TypeScript 脚本
2. 在 `tuis/` 目录下创建对应的 `.tui.yao` 配置文件
3. 将按键绑定到你的脚本方法
4. 使用 `yao tui start <config-name>` 启动应用

## 更多信息

详细的技术文档请参见主项目的 `SCRIPTING_GUIDE.md` 文件，其中包含了 TUI JavaScript API 的完整说明和最佳实践。

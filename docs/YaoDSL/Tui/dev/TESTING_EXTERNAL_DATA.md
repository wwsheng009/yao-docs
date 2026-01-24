# TUI 外部数据功能测试

## 编译 TUI 命令

```bash
# 编译命令
go build -o yao-tui ./cmd/tui
```

## 测试场景

### 1. 测试基本功能

```bash
# 使用默认数据启动（无外部数据）
./yao-tui external-data-example

# 覆盖标题
./yao-tui external-data-example :: '{"title":"Custom Title"}'

# 重写副标题
./yao-tui external-data-example :: '{"subtitle":"Custom subtitle from external data"}'

# 完全重写配置
./yao-tui external-data-example :: '{"title":"Fully Customized","subtitle":"All data from command line","items":["item1","item2","item3","item4","item5"]}'

# 修改嵌套配置
./yao-tui external-data-example :: '{"config":{"backgroundColor":"blue","textColor":"yellow"}}'
```

### 2. 测试多个 :: 参数

```bash
# 合并多个数据源
./yao-tui external-data-example :: '{"title":"First Override"}' :: '{"subtitle":"Second Override"}' :: '{"items":["merged1","merged2","merged3"]}'
```

### 3. 测试转义和普通参数

```bash
# 转义 ::
./yao-tui external-data-example \::test-string

# 普通字符串参数
./yao-tui external-data-example arg1 arg2 arg3
```

### 4. 使用 --verbose 查看详细信息

```bash
./yao-tui external-data-example :: '{"title":"Testing"}' --verbose
```

你会看到类似这样的输出：

```
TUI external data[1]: parsed 1 keys
  title: Testing
Merged 1 external data keys into TUI configuration
Starting TUI: external-data-example
Running TUI: external-data-example (External Data Example)
External data loaded with 1 keys
```

### 5. 使用 --debug 进行调试

```bash
./yao-tui external-data-example :: '{"title":"Debug Mode"}' --debug
```

## 预期行为

1. **外部数据覆盖静态数据**：传入的 JSON 会覆盖相应键的默认值
2. **保持未覆盖的数据**：没有在 JSON 中指定的键保持静态配置的值
3. **多参数合并**：多个 `::` 参数会合并，后面的参数覆盖前面的相同键
4. **错误处理**：无效的 JSON 会导致错误信息并退出

## 验证要点

### ✅ 成功的场景

- [x ] 简单的 JSON 对象解析
- [x ] 嵌套 JSON 对象解析
- [x ] 多个 `::` 参数合并
- [x ] 转义 `::` 前缀
- [x ] 普通字符串参数收集
- [x ] 外部数据覆盖静态数据
- [x ] 数据正确传递到 TUI 模型

### ❌ 失败的场景

- [x ] 无效的 JSON 格式（应该显示错误并退出）
- [x ] 未找到 TUI 配置（应该显示可用 TUI 列表）

## 集成到主 Yao 项目

在实现完成并测试通过后，可以将此功能集成到主 `yao` 项目：

```bash
# 编译整个项目
go build ./cmd/yao

# 测试 yao tui 命令
./yao tui external-data-example :: '{"title":"Via Yao CLI"}'
```

## 代码流程图

```
用户执行命令
    ↓
解析命令行参数
    ↓
遍历 args[1:]
    ↓
检测参数前缀
    ├─ :: JSON → 解析 JSON → 合并到 externalData
    ├─ \::     → 转义处理 → 存入 _args
    └─ 普通字符串      → 存入 _args
    ↓
获取 TUI 配置 (tui.Get)
    ↓
合并 externalData 到 cfg.Data（外部数据优先）
    ↓
创建 TUI Model (tui.NewModel)
    ↓
启动 TUI program (tea.NewProgram)
    ↓
TUI 显示（包含合并后的数据）
```

## 运行 TUI 测试

```bash
# 运行单元测试
go test ./cmd/tui -v -run TestParseTUIMetadataArgs
go test ./cmd/tui -v -run TestTUIExternalDataMerge

# 运行所有 TUI 相关测试
go test ./cmd/tui -v

# 运行 TUI 包的测试
go test ./tui -v
```

## 性能考虑

- JSON 解析：使用 `jsoniter`，比标准 `encoding/json` 快
- 数据合并：简单的映射合并，复杂应用可考虑深度合并
- 状态管理：TUI 已有高效的 StateMu 锁机制

## 未来扩展

1. **支持从文件读取数据**：添加 `--data` 参数支持 JSON 文件路径
2. **环境变量注入**：支持从环境变量读取数据
3. **深度合并**：支持嵌套对象的深度合并而非简单覆盖
4. **数据验证**：添加 JSON Schema 验证
5. **数据来源追踪**：记录每个键的数据来源（静态/外部）

## 问题反馈

如果遇到问题，请提供：

1. 执行的完整命令
2. `.tui.yao` 配置文件内容
3. 错误信息或异常行为
4. `--verbose` 或 `--debug` 模式的输出

## 相关文件

- **实现**：`cmd/tui/tui.go`
- **测试**：`cmd/tui/external_data_test.go`
- **文档**：`tui/docs/EXTERNAL_DATA.md`
- **示例**：`tuis/external-data-example.tui.yao`

---

**提示**：在 Windows Git Bash 中，单引号可能需要替换为双引号：

```bash
# Windows Git Bash
./yao-tui external-data-example :: "{\"title\":\"Windows Test\"}"
```

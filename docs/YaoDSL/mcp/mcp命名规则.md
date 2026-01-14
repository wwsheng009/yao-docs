MCP 工具名称转换逻辑：

### MCP 工具名称格式与转换规则（核心原则）

工具完整名称采用双下划线分隔格式：

```
{server_id 经过转换}__{tool_name}
```

### 关键约束与转换规则

| 项目                  | 规则                                                                                                 | 示例说明                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| server_id 允许字符    | 只能包含：字母、数字、连字符`-`、句点`.`<br>**严禁**出现下划线 `_`                                   | 合法：`github.enterprise`、`agent-v2`、`core`<br>非法：`github_enterprise` |
| 传输时的名称          | server*id 中的所有 `.` 都会被替换成 `*`<br>然后再拼接 `\_\_{tool_name}`                              | `github.enterprise` → `github_enterprise__search`                          |
| 最终呈现给 LLM 的名称 | `{server_id中.变_}__{tool_name}`                                                                     | `github_enterprise__search`<br>`agent_v2__execute`                         |
| LLM 回调回来时解析    | 1. 以最后一个 `__` 为分界，右边为 tool*name<br>2. 左边部分所有 `*`还原成`.`<br>3. 得到原始 server_id | `github_enterprise__search` → `github.enterprise` + `search`               |

### 完整转换流程示意图

```
开发者定义时（Yao/MCP配置）
    server_id: "github.enterprise"    ← 不能有下划线
           +  tool: "search"

         ↓  (发送给 LLM 前由框架自动转换)

给 LLM 看到的工具名
    "github_enterprise__search"

         ↓  (用户/LLM 调用该工具)

LLM 回调回来的工具名
    "github_enterprise__search"

         ↓  (Yao 引擎解析)

解析还原结果
    server_id: "github.enterprise"
       tool  : "search"
```

### 为什么 server_id 严禁出现下划线？（最容易出错的地方）

如果 server_id 包含下划线，例如错误地定义成：

```yaml
server_id: "github_enterprise"   ← 错误示范！含有下划线
tools: [search]
```

转换后会变成：

```
github_enterprise__search
```

解析时引擎会把所有 `_` 替换成 `.`，结果得到：

```
server_id: "github.enterprise"   ← 根本匹配不到你定义的 "github_enterprise"
```

→ **找不到对应的 server** → 调用失败

# 排除配置功能说明

## 概述

该功能允许用户在生成 VitePress 配置文件或创建 index.md 文件时，指定需要忽略的目录或文件路径。系统会检查当前处理的路径是否匹配排除规则，若匹配则跳过该目录或文件。

## ⚠️ 重要：路径基准说明

**ExcludeConfig 中的所有路径都是相对于 `BaseDocPath` 的相对路径。**

在 `scripts\generate_config.ts` 中定义：

```typescript
export const BaseDocPath = path.resolve('./docs');
```

这意味着：

- 所有排除规则的路径基准是项目的 `docs/` 目录
- 路径匹配时，系统会先计算相对于 `docs/` 的相对路径，然后再进行匹配
- 这样设计使得配置更加简洁和可移植，不依赖于绝对路径

### 路径计算原理

```typescript
// 实际的路径计算逻辑
static shouldExcludeDirectory(dirPath: string, config: ExcludeConfig, baseDir?: string): boolean {
  const targetPath = baseDir ? path.relative(baseDir, dirPath) : path.basename(dirPath);
  return this.matchesRules(targetPath, config.directories);
}

// 调用时传入的 baseDir 就是 BaseDocPath
CreateVitePressConfig(excludeConfig); // 内部使用 BaseDocPath 作为 baseDir
```

### 实际路径匹配示例

| 配置中的模式     | 实际匹配的完整路径                | 说明                         |
| ---------------- | --------------------------------- | ---------------------------- |
| `"node_modules"` | `docs/node_modules/`              | 精确匹配 node_modules 目录   |
| `"test_*"`       | `docs/test_api/`, `docs/test_ui/` | 通配符匹配 test\_ 开头的目录 |
| `"YaoDSL/neo"`   | `docs/YaoDSL/neo/`                | 支持多级路径                 |
| `"*.bak"`        | `docs/backup.bak`                 | 通配符匹配 .bak 文件         |
| `"README.md"`    | `docs/README.md`                  | 精确匹配文件                 |

## 支持的排除模式

### 1. 精确匹配 (exact)

- 完全匹配文件名或目录名
- 示例：`"node_modules"` 只匹配名为 node_modules 的目录

### 2. 通配符匹配 (wildcard)

- 支持 `*` 通配符，匹配任意字符（除路径分隔符）
- 示例：`"test_*"` 匹配以 test\_ 开头的所有目录
- 示例：`"*.bak"` 匹配所有 .bak 扩展名的文件

### 3. 正则表达式匹配 (regex)

- 支持完整的正则表达式语法
- 示例：`".*_backup"` 匹配以 \_backup 结尾的所有目录
- 示例：`".*\\.tmp$"` 匹配所有 .tmp 扩展名的文件

## 配置文件格式

创建 `exclude.config.json` 文件（可选），放置在以下任一位置：

- 项目根目录
- docs 目录下
- 与文档相同的目录

### 配置文件示例

```json
{
  "directories": [
    {
      "pattern": "node_modules",
      "type": "exact",
      "description": "Node.js 依赖目录",
      "enabled": true
    },
    {
      "pattern": "test_*",
      "type": "wildcard",
      "description": "测试目录",
      "enabled": true
    },
    {
      "pattern": ".*_backup",
      "type": "regex",
      "description": "备份目录",
      "enabled": false
    }
  ],
  "files": [
    {
      "pattern": "*.bak",
      "type": "wildcard",
      "description": "备份文件",
      "enabled": true
    },
    {
      "pattern": ".DS_Store",
      "type": "exact",
      "description": "macOS 系统文件",
      "enabled": true
    }
  ]
}
```

### 配置字段说明

- `pattern`: 匹配模式字符串（相对于 `docs/` 目录）
- `type`: 匹配类型，可选值：`"exact"`、`"wildcard"`、`"regex"`
- `description`: 规则描述（可选）
- `enabled`: 是否启用该规则，默认为 `true`

## 默认排除规则

如果没有提供配置文件，系统会使用以下默认排除规则：

### 目录排除

- `node_modules` - 匹配 `docs/node_modules` 目录
- `.git` - 匹配 `docs/.git` 目录
- `.vitepress` - 匹配 `docs/.vitepress` 目录
- `dist` - 匹配 `docs/dist` 目录
- `__pycache__` - 匹配 `docs/__pycache__` 目录
- `test_*` - 匹配 `docs/test_*` 目录（通配符）
- `.*_backup` - 匹配 `docs/*_backup` 目录（正则）

### 文件排除

- `*.bak` - 匹配 `docs/*.bak` 文件（通配符）
- `.DS_Store` - 匹配 `docs/.DS_Store` 文件
- `Thumbs.db` - 匹配 `docs/Thumbs.db` 文件
- `.*\.tmp$` - 匹配 `docs/*.tmp` 文件（正则）
- `*.log` - 匹配 `docs/*.log` 文件（通配符）

## 使用方法

### 1. 编程方式使用

```typescript
import {
  loadExcludeConfig,
  CreateVitePressConfig
} from './scripts/generate_config';

// 加载自定义配置
const excludeConfig = loadExcludeConfig('./my-exclude-config.json');

// 使用自定义配置生成 VitePress 配置
CreateVitePressConfig(excludeConfig);
```

### 2. 配置文件方式使用

1. 复制 `exclude.config.example.json` 为 `exclude.config.json`
2. 根据需要修改配置
3. 运行脚本时会自动加载该配置

### 3. 使用 node --import tsx 执行脚本

```bash
# 生成配置（会自动应用排除规则）
node --import tsx scripts/generate_config.ts

# 生成索引文件（会自动应用排除规则）
node --import tsx scripts/generate_index.ts

# 编译 Markdown（会自动应用排除规则）
node --import tsx scripts/compile_md.ts

# 清理文件（会自动应用排除规则）
node --import tsx scripts/cleanup.ts
```

## 高级用法示例

### 排除特定版本的文档目录

```json
{
  "directories": [
    {
      "pattern": "v1.*",
      "type": "regex",
      "description": "排除所有 v1.x 版本的文档目录",
      "enabled": true
    }
  ]
}
```

**实际匹配**：`docs/v1.0/`, `docs/v1.2/` 等

### 排除特定作者的文件

```json
{
  "files": [
    {
      "pattern": "*-author-*.md",
      "type": "wildcard",
      "description": "排除包含作者标识的文档",
      "enabled": true
    }
  ]
}
```

**实际匹配**：`docs/api-author-john.md`, `docs/guide-author-mary.md` 等

### 排除多级子目录

```json
{
  "directories": [
    {
      "pattern": "YaoDSL/neo/*",
      "type": "wildcard",
      "description": "排除 YaoDSL/neo 下的所有子目录",
      "enabled": true
    },
    {
      "pattern": "YaoDSL/neo/**",
      "type": "regex",
      "description": "排除 YaoDSL/neo 下的所有内容（支持多级）",
      "enabled": true
    }
  ]
}
```

**实际匹配**：`docs/YaoDSL/neo/AI助手/`, `docs/YaoDSL/neo/测试/` 等

## 调试技巧

### 1. 查看排除日志

运行脚本时会自动显示被排除的目录：

```bash
$ node --import tsx scripts/generate_index.ts
使用默认排除配置
目录已排除: e:\projects\yao\yao-projects\yao-docs\docs\.vitepress
目录已排除: e:\projects\yao\yao-projects\yao-docs\docs\node_modules
```

### 2. 临时启用/禁用规则

```json
{
  "directories": [
    {
      "pattern": "draft",
      "type": "exact",
      "description": "草稿目录",
      "enabled": false // 临时禁用，不删除规则
    }
  ]
}
```

### 3. 测试配置

创建测试脚本验证配置：

```typescript
import {
  loadExcludeConfig,
  ExcludeRuleMatcher
} from './scripts/generate_config';

const config = loadExcludeConfig();
console.log('测试路径匹配:');
console.log(
  'node_modules:',
  ExcludeRuleMatcher.shouldExcludeDirectory('docs/node_modules', config)
);
console.log(
  'test_api:',
  ExcludeRuleMatcher.shouldExcludeDirectory('docs/test_api', config)
);
```

## 注意事项

1. **路径基准**：所有路径都是相对于 `docs/` 目录，不是项目根目录
2. **通配符限制**：通配符 `*` 不匹配路径分隔符，`**` 支持多级路径匹配
3. **正则表达式**：需要有效的 JavaScript 正则语法
4. **规则优先级**：所有规则是"或"关系，匹配任一规则即被排除
5. **文件与目录**：目录规则只匹配目录，文件规则只匹配文件
6. **跨平台路径**：系统会自动处理 Windows 和 Unix 路径分隔符差异

## 故障排除

### 常见问题

**Q: 为什么我的排除规则不生效？**
A: 检查以下几点：

- 路径是否相对于 `docs/` 目录
- 规则的 `enabled` 字段是否为 `true`
- 通配符或正则表达式语法是否正确

**Q: 如何排除整个子目录树？**
A: 使用正则表达式或更具体的路径：

```json
{
  "directories": [
    {
      "pattern": "YaoDSL/.*",
      "type": "regex",
      "description": "排除 YaoDSL 下的所有子目录",
      "enabled": true
    }
  ]
}
```

**Q: 配置文件放在哪里？**
A: 系统会按以下顺序查找：

1. 项目根目录的 `exclude.config.json`
2. `docs/` 目录下的 `exclude.config.json`
3. 与文档同目录的 `exclude.config.json`
4. 如果都找不到，使用默认配置

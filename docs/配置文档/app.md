# 应用配置文件

应用配置文件是 Yao 应用程序的核心配置文件，用于定义应用的基本信息、存储设置、开发者信息等。支持多种格式：`app.yao`、`app.jsonc`、`app.json`。

> 说明：`app.*` 同时也会被 `widgets/app` 用来生成 Xgen 前端运行时配置（`yao.app.Xgen`），但其解析结构体与 `AppInfo` 不同（更偏前端与登录体验）。详见 `xgen_config.md`，登录页 DSL 详见 `login.md`。

## 配置文件位置

应用配置文件应放在应用根目录下，Yao 会按以下优先级顺序查找：

1. `app.yao` (推荐)
2. `app.jsonc`
3. `app.json`

## AppInfo 结构体说明

```go
type AppInfo struct {
    Name         string                 `json:"name,omitempty"`         // 应用名称
    L            map[string]string      `json:"-"`                      // 国际化语言映射(内部使用)
    Short        string                 `json:"short,omitempty"`        // 应用简称
    Version      string                 `json:"version,omitempty"`      // 应用版本
    Description  string                 `json:"description,omitempty"`  // 应用描述
    Icons        maps.MapStrSync        `json:"icons,omitempty"`        // 应用图标配置
    Storage      AppStorage             `json:"storage,omitempty"`       // 存储配置
    Option       map[string]interface{} `json:"option,omitempty"`       // 应用选项
    XGen         string                 `json:"xgen,omitempty"`         // XGen配置
    AdminRoot    string                 `json:"adminRoot,omitempty"`    // 管理后台根路径
    Prefix       string                 `json:"prefix,omitempty"`       // 系统表名前缀，默认为"yao_"
    Static       Static                 `json:"public,omitempty"`       // 静态资源配置(已重命名为public)
    Optional     map[string]interface{} `json:"optional,omitempty"`     // 可选配置项
    Moapi        Moapi                  `json:"moapi,omitempty"`         // AIGC应用商店API配置
    Developer    Developer              `json:"developer,omitempty"`    // 开发者信息
    AfterLoad    string                 `json:"afterLoad,omitempty"`    // 应用加载后执行的脚本
    AfterMigrate string                 `json:"afterMigrate,omitempty"` // 应用迁移后执行的脚本
}
```

## 详细配置说明

### 基本信息配置

| 字段          | 类型   | 必填 | 说明                        |
| ------------- | ------ | ---- | --------------------------- |
| `name`        | string | 否   | 应用名称                    |
| `short`       | string | 否   | 应用简称                    |
| `version`     | string | 否   | 应用版本号                  |
| `description` | string | 否   | 应用描述                    |
| `adminRoot`   | string | 否   | 管理后台根路径，默认为"yao" |

### 开发者信息 (Developer)

```go
type Developer struct {
    ID       string `json:"id,omitempty"`       // 开发者ID
    Name     string `json:"name,omitempty"`     // 开发者姓名
    Info     string `json:"info,omitempty"`     // 开发者信息
    Email    string `json:"email,omitempty"`    // 开发者邮箱
    Homepage string `json:"homepage,omitempty"` // 开发者主页
}
```

### 存储配置 (AppStorage)

```go
type AppStorage struct {
    Default string                 `json:"default"`        // 默认存储类型
    Buckets map[string]string      `json:"buckets,omitempty"` // 存储桶配置
    S3      map[string]interface{} `json:"s3,omitempty"`     // AWS S3配置
    OSS     *AppStorageOSS         `json:"oss,omitempty"`    // 阿里云OSS配置
    COS     map[string]interface{} `json:"cos,omitempty"`    // 腾讯云COS配置
}
```

#### 阿里云OSS配置 (AppStorageOSS)

```go
type AppStorageOSS struct {
    Endpoint    string `json:"endpoint,omitempty"`    // OSS端点
    ID          string `json:"id,omitempty"`          // AccessKey ID
    Secret      string `json:"secret,omitempty"`      // AccessKey Secret
    RoleArn     string `json:"roleArn,omitempty"`     // RAM角色ARN
    SessionName string `json:"sessionName,omitempty"` // 会话名称
}
```

### 静态资源配置 (Static)

```go
type Static struct {
    DisableGzip bool                `json:"disableGzip,omitempty"` // 是否禁用Gzip压缩
    Rewrite     []map[string]string `json:"rewrite,omitempty"`     // URL重写规则
    SourceRoots map[string]string   `json:"sourceRoots,omitempty"` // 源目录映射
}
```

### AIGC应用商店API配置 (Moapi)

```go
type Moapi struct {
    Channel      string   `json:"channel,omitempty"`      // API渠道
    Mirrors      []string `json:"mirrors,omitempty"`      // API镜像地址
    Secret       string   `json:"secret,omitempty"`       // API密钥
    Organization string   `json:"organization,omitempty"` // 组织信息
}
```

### 可选配置 (Optional)

`optional` 字段包含多个可选配置项：

#### 远程缓存

```json
{
  "optional": {
    "remoteCache": true // 启用远程缓存，减少浏览器查询请求
  }
}
```

#### 菜单配置

```json
{
  "optional": {
    "menu": {
      "layout": "2-columns", // 布局: "1-column" 或 "2-columns"
      "showName": true // 是否显示菜单名称
    }
  }
}
```

#### 管理后台配置

```json
{
  "optional": {
    "neo": {
      "api": "/neo", // API路径
      "studio": false // 是否为Studio模式
    }
  }
}
```

### 生命周期钩子

| 字段           | 类型   | 说明                           |
| -------------- | ------ | ------------------------------ |
| `afterLoad`    | string | 应用加载后执行的脚本（进程名） |
| `afterMigrate` | string | 应用迁移后执行的脚本（进程名） |

## 管理后台入口配置

### 说明

管理后台的入口配置主要通过 `widgets/app` 模块处理，用于设定管理后台的访问路径和相关配置。在 `engine/load.go` 中设置的环境变量 `XGEN_BASE` 主要用于内部处理，实际的路径配置通过以下机制实现。

### 设置逻辑

#### 1. 环境变量设置 (engine/load.go)

在应用启动时，会设置 `XGEN_BASE` 环境变量：

```go
// SET XGEN_BASE
adminRoot := "yao"
if share.App.Optional != nil {
    if root, has := share.App.Optional["adminRoot"]; has {
        adminRoot = fmt.Sprintf("%v", root)
    }
}
os.Setenv("XGEN_BASE", adminRoot)
```

#### 2. Widget App 处理 (widgets/app/app.go)

在 `widgets/app` 模块中，`AdminRoot` 字段被进一步处理：

```go
// replaceAdminRoot
func (dsl *DSL) replaceAdminRoot() error {
    if dsl.AdminRoot == "" {
        dsl.AdminRoot = "yao"
    }
    root := strings.TrimPrefix(dsl.AdminRoot, "/")
    root = strings.TrimSuffix(root, "/")
    return data.ReplaceCUI("__yao_admin_root", root)
}
```

在 `processSetup` 方法中用于生成管理后台地址：

```go
root := "yao"
if Setting.AdminRoot != "" {
    root = Setting.AdminRoot
}

// 返回给前端的配置
return map[string]interface{}{
    "home":  fmt.Sprintf("http://127.0.0.1:%d", config.Conf.Port),
    "admin": fmt.Sprintf("http://127.0.0.1:%d/%s/", config.Conf.Port, root),
    "setting": setting,
}
```

### 配置方式

#### 方式一：通过 optional.adminRoot 配置（推荐）

```json
{
  "name": "My App",
  "optional": {
    "adminRoot": "admin" // 设置管理后台根路径为 /admin
  }
}
```

#### 方式二：通过系统环境变量

```bash
# 在启动前设置环境变量
export XGEN_BASE="myadmin"

# 启动应用
yao run
```

### 默认值

如果没有配置 `optional.adminRoot`，则使用默认值 `"yao"`，此时管理后台访问路径为 `/yao`。

### 实际影响

管理后台入口配置主要影响：

1. **前端路由生成**：在 `processSetup` 中生成管理后台访问地址
2. **CUI 组件路径**：通过 `data.ReplaceCUI("__yao_admin_root", root)` 替换 CUI 组件中的路径
3. **环境变量设置**：设置 `XGEN_BASE` 环境变量（虽然当前未被直接使用）

### 配置示例

```json
{
  "name": "企业管理系统",
  "adminRoot": "admin", // 应用级配置
  "optional": {
    "adminRoot": "backend" // 会覆盖应用级配置，XGEN_BASE = "backend"
  }
}
```

### 注意事项

1. **配置生效**：`optional.adminRoot` 的优先级高于 `adminRoot`
2. **路径格式**：系统会自动处理路径前后的斜杠
3. **前端使用**：前端会通过 `processSetup` API 获取实际的管理后台地址
4. **XGEN_BASE 作用**：虽然设置了环境变量，但当前主要作用于 CUI 组件的路径替换

### 开发建议

- **统一配置**：建议只使用一种方式配置 `adminRoot`，避免混淆
- **路径规范**：使用简洁的路径名，如 `admin`、`backend`、`manage` 等
- **前端适配**：修改配置后，确保前端路由和API调用路径同步更新

### 实际应用场景

```json
{
  "name": "电商平台",
  "version": "1.0.0",

  // 应用管理后台配置
  "adminRoot": "shop-admin",

  "optional": {
    // 更改系统根路径
    "adminRoot": "backend",

    // 其他可选配置
    "menu": {
      "layout": "2-columns",
      "showName": true
    }
  }
}
```

配置后：

- 管理后台访问地址：`http://localhost:5099/backend`
- `XGEN_BASE` 环境变量值：`"backend"`
- 系统内部所有相关路径都会基于 `/backend`

## 配置示例

### 完整配置示例

```json
{
  "name": "Demo Application",
  "short": "Demo",
  "description": "Another yao application",
  "version": "0.10.4",
  "adminRoot": "admin",
  "prefix": "yao_",

  "developer": {
    "name": "开发团队",
    "email": "dev@example.com",
    "homepage": "https://example.com"
  },

  "storage": {
    "default": "local",
    "buckets": {
      "images": "uploads/images",
      "documents": "uploads/docs"
    },
    "oss": {
      "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
      "id": "${OSS_ACCESS_KEY_ID}",
      "secret": "${OSS_ACCESS_KEY_SECRET}"
    }
  },

  "public": {
    "disableGzip": false,
    "rewrite": [
      { "^\\/assets\\/(.*)$": "/assets/$1" },
      { "^\\/(.*)$": "/$1.sui" }
    ],
    "sourceRoots": {
      "/public": "/data/templates/default"
    }
  },

  "optional": {
    "remoteCache": true,
    "menu": {
      "layout": "2-columns",
      "showName": true
    },
    "neo": {
      "api": "/neo"
    }
  },

  "moapi": {
    "channel": "global",
    "secret": "$ENV.MOAPI_SECRET",
    "mirrors": ["api.openai.com"]
  },

  "afterLoad": "scripts.tests.AppAfterLoad",
  "afterMigrate": "scripts.tests.AppAfterMigrate"
}
```

### 最小配置示例

```json
{
  "name": "My App",
  "version": "1.0.0"
}
```

## 环境变量支持

配置文件支持环境变量替换，格式为 `$ENV.变量名`：

### 语法说明

- **基本格式**: `$ENV.变量名`
- **示例**: `$ENV.PATH`、`$ENV.MOAPI_SECRET`、`$ENV.OSS_ACCESS_KEY_ID`

### 使用示例

```json
{
  "name": "My App",
  "version": "$ENV.APP_VERSION",
  "adminRoot": "$ENV.ADMIN_ROOT",

  "moapi": {
    "channel": "global",
    "secret": "$ENV.MOAPI_SECRET",
    "mirrors": ["$ENV.MOAPI_MIRROR"]
  },

  "storage": {
    "default": "$ENV.STORAGE_TYPE",
    "oss": {
      "endpoint": "$ENV.OSS_ENDPOINT",
      "id": "$ENV.OSS_ACCESS_KEY_ID",
      "secret": "$ENV.OSS_ACCESS_KEY_SECRET",
      "roleArn": "$ENV.OSS_ROLE_ARN",
      "sessionName": "$ENV.OSS_SESSION_NAME"
    }
  },

  "optional": {
    "neo": {
      "api": "$ENV.NEO_API_PATH",
      "studio": "$ENV.NEO_STUDIO_MODE"
    }
  },

  "developer": {
    "name": "$ENV.DEV_NAME",
    "email": "$ENV.DEV_EMAIL"
  }
}
```

### 环境变量处理机制

在 `engine/load.go`（引擎启动期解析 `AppInfo`）以及 `widgets/app`（生成 `yao.app.Xgen` 配置）中都会执行相同的替换逻辑：

```go
// 替换 $ENV 为实际环境变量值
appData = envRe.ReplaceAllFunc(appData, func(s []byte) []byte {
    key := string(s[5:])  // 去掉 "$ENV." 前缀
    val := os.Getenv(key) // 获取环境变量值
    if val == "" {
        return s // 如果环境变量不存在，保持原样
    }
    return []byte(val)
})
```

### 使用建议

1. **敏感信息**: 密钥、密码等敏感信息建议使用环境变量
2. **环境差异**: 开发、测试、生产环境使用不同的环境变量值
3. **容器化部署**: 在 Docker/Kubernetes 中通过环境变量注入配置
4. **默认值**: 如果环境变量不存在，会保持原始 `$ENV.变量名` 字符串

### 常用环境变量

```bash
# 应用配置
export APP_VERSION="1.0.0"
export ADMIN_ROOT="admin"

# 存储配置
export STORAGE_TYPE="oss"
export OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
export OSS_ACCESS_KEY_ID="your_access_key_id"
export OSS_ACCESS_KEY_SECRET="your_access_key_secret"

# API 配置
export MOAPI_SECRET="your_moapi_secret"
export MOAPI_MIRROR="api.openai.com"

# 开发者信息
export DEV_NAME="开发团队"
export DEV_EMAIL="dev@example.com"

# 管理后台
export NEO_API_PATH="/neo"
export NEO_STUDIO_MODE="false"
```

## 系统表名前缀

- `prefix` 字段用于设置系统表名前缀，默认值为 `"yao_"`
- 系统会自动在此前缀后添加表名，如：`yao_user`、`yao_dsl`
- 可通过 `AppInfo.GetPrefix()` 方法获取前缀值

## 公共信息过滤

当需要对外暴露应用信息时，可使用 `AppInfo.Public()` 方法，该方法会过滤敏感信息：

- 清空 `Storage.COS`
- 清空 `Storage.OSS`
- 清空 `Storage.S3`

## 配置加载过程

1. Yao 启动时会查找配置文件（优先级：app.yao > app.jsonc > app.json）
2. 使用环境变量替换 `$ENV.*` 格式的内容
3. 解析 JSON 配置到 `AppInfo` 结构体
4. 设置默认值（如 prefix 默认为 "yao\_"）
5. 执行 `afterLoad` 脚本（如果配置了）

## 注意事项

1. 配置文件必须是有效的 JSON 格式
2. 环境变量在应用启动时被替换，确保环境变量已正确设置
3. 敏感信息（如密钥、密码）建议使用环境变量存储
4. `icons` 字段使用 `maps.MapStrSync` 类型，支持同步映射
5. 生命周期钩子脚本必须是有效的进程名，且对应的脚本文件存在

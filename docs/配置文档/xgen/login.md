# Login 配置文档

## 概述

Login配置用于定义应用的登录页面和认证行为。配置文件保存在 `logins` 目录下，支持多种格式：`.login.yao`、`.login.json`、`.login.jsonc`。

对于使用 Xgen 作为管理端的应用，需要在 `logins` 目录创建相应的登录配置文件。

## 配置文件位置

默认情况下，需要创建两个主要的登录配置文件：

- 管理员登录：`logins/admin.login.yao`
- 用户登录：`logins/user.login.yao`

## 配置结构

```json
{
  "name": "登录页面名称",
  "action": {
    "process": "处理器名称",
    "args": ["参数列表"]
  },
  "layout": {
    "entry": "登录后跳转的入口页面",
    "captcha": "验证码处理器",
    "cover": "封面图片路径",
    "slogan": "标语/口号",
    "site": "网站链接"
  },
  "thirdPartyLogin": [
    {
      "title": "第三方登录标题",
      "href": "登录链接",
      "icon": "图标",
      "blank": "是否在新窗口打开"
    }
  ]
}
```

## 字段说明

### 基本字段

| 字段              | 类型   | 必填 | 说明                                               |
| ----------------- | ------ | ---- | -------------------------------------------------- |
| `name`            | string | 是   | 登录页面显示名称，支持国际化（如 `::Admin Login`） |
| `action`          | object | 是   | 登录动作配置                                       |
| `layout`          | object | 是   | 登录页面布局配置                                   |
| `thirdPartyLogin` | array  | 否   | 第三方登录配置列表                                 |

### action 字段

| 字段      | 类型   | 必填 | 说明                         |
| --------- | ------ | ---- | ---------------------------- |
| `process` | string | 是   | 处理器名称，用于处理登录逻辑 |
| `args`    | array  | 是   | 传递给处理器的参数列表       |

### layout 字段

| 字段      | 类型   | 必填 | 说明                                     |
| --------- | ------ | ---- | ---------------------------------------- |
| `entry`   | string | 否   | 登录成功后跳转的页面路径                 |
| `captcha` | string | 否   | 验证码处理器，默认为 `yao.utils.Captcha` |
| `cover`   | string | 否   | 登录页面封面图片路径                     |
| `slogan`  | string | 否   | 登录页面显示的标语                       |
| `site`    | string | 否   | 相关网站链接                             |

### thirdPartyLogin 字段

| 字段    | 类型    | 必填 | 说明                         |
| ------- | ------- | ---- | ---------------------------- |
| `title` | string  | 是   | 第三方登录显示标题           |
| `href`  | string  | 是   | 第三方登录链接               |
| `icon`  | string  | 否   | 图标标识                     |
| `blank` | boolean | 否   | 是否在新窗口打开，默认 false |

## 内置处理器

### yao.login.admin

**注意：** 处理器名称为 `yao.login.admin`（小写），不是 `yao.login.Admin`

管理员登录处理器，用于系统管理员登录。

### 数据模型要求

**必需模型：** `admin.user`

使用 `yao.login.admin` 处理器必须在应用中定义 `admin.user` 模型，该模型必须包含以下字段：

| 字段名     | 类型   | 必填 | 说明                                  |
| ---------- | ------ | ---- | ------------------------------------- |
| `id`       | ID     | 是   | 主键标识符，用于生成JWT Token         |
| `password` | string | 是   | 登录密码，使用BCrypt加密              |
| `name`     | string | 是   | 用户姓名，显示在登录信息中            |
| `type`     | enum   | 是   | 用户类型，用于区分不同权限级别        |
| `email`    | string | 否   | 邮箱地址，用于邮箱登录                |
| `mobile`   | string | 否   | 手机号码，用于手机号登录              |
| `extra`    | json   | 否   | 扩展信息，存储额外的用户属性          |
| `status`   | enum   | 是   | 账户状态，只有 `enabled` 状态才能登录 |

**重要说明：**

- `email` 和 `mobile` 至少需要一个不为空，否则无法登录
- `status` 字段值必须为 `enabled`，其他状态（如 `disabled`）将无法登录
- `password` 字段必须使用 `crypt: "PASSWORD"` 进行加密存储
- `type` 字段推荐值：`super`（超级管理员）、`admin`（管理员）、`staff`（员工）、`user`（普通用户）

**最小化模型示例：**

```json
// models/user.mod.yao
{
  "name": "用户",
  "table": {
    "name": "admin_user",
    "comment": "管理员用户表"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "primary": true
    },
    {
      "label": "用户类型",
      "name": "type",
      "type": "enum",
      "option": ["super", "admin", "staff", "user"],
      "default": "user"
    },
    {
      "label": "邮箱",
      "name": "email",
      "type": "string",
      "length": 50,
      "nullable": true,
      "index": true
    },
    {
      "label": "手机号",
      "name": "mobile",
      "type": "string",
      "length": 20,
      "nullable": true,
      "index": true
    },
    {
      "label": "密码",
      "name": "password",
      "type": "string",
      "length": 256,
      "crypt": "PASSWORD"
    },
    {
      "label": "姓名",
      "name": "name",
      "type": "string",
      "length": 80
    },
    {
      "label": "扩展信息",
      "name": "extra",
      "type": "json",
      "nullable": true
    },
    {
      "label": "账户状态",
      "name": "status",
      "type": "enum",
      "option": ["enabled", "disabled"],
      "default": "enabled"
    }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```

**数据库迁移：**

```bash
# 创建或重置用户表
yao migrate -n admin.user
```

**查询条件：**
处理器查询用户时使用以下条件：

```sql
SELECT id, password, name, type, email, mobile, extra, status
FROM admin_user
WHERE (email = ? OR mobile = ?) AND status = 'enabled'
LIMIT 1
```

**核心特性：**

- **验证码必填：** 必须提供验证码ID和验证码值进行验证
- **登录方式：** 支持邮箱或手机号登录（二选一，不能同时使用）
- **数据模型：** 查询 `admin.user` 模型进行用户验证
- **密码加密：** 使用 BCrypt 进行密码验证
- **Token 生成：** 生成 JWT Token，有效期8小时
- **Session 管理：** 设置全局 Session，包含用户信息
- **用户数据：** 返回用户基本信息、菜单数据
- **开发模式：** 开发环境下返回 Studio 连接信息

**支持的登录字段：**

- `email`：邮箱地址
- `mobile`：手机号码
- `password`：登录密码
- `captcha.id`：验证码ID（必填）
- `captcha.code`：验证码内容（必填）
- `sid`：自定义Session ID（可选，默认自动生成）

**查询条件：**

- 登录字段值（email 或 mobile）
- 用户状态必须为 `enabled`

**请求数据格式：**

```json
{
  "email": "admin@example.com",
  "password": "password123",
  "captcha": {
    "id": "captcha_123456",
    "code": "ABCD"
  },
  "sid": "custom_session_id"
}
```

或使用手机号登录：

```json
{
  "mobile": "13800138000",
  "password": "password123",
  "captcha": {
    "id": "captcha_123456",
    "code": "ABCD"
  }
}
```

**验证流程：**

1. 验证验证码ID和验证码值是否为空
2. 调用 `helper.CaptchaValidate` 验证验证码
3. 检查邮箱或手机号参数
4. 查询 `admin.user` 表验证用户存在性和状态
5. 使用 BCrypt 验证密码
6. 生成有效期8小时的 JWT Token
7. 设置 Session 数据（user_id, user, issuer）
8. 获取用户菜单数据
9. 开发环境下生成 Studio 连接信息

**返回数据格式：**

```json
{
  "expires_at": 1234567890,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "管理员",
    "type": "admin",
    "email": "admin@example.com",
    "mobile": "13800138000",
    "extra": {},
    "status": "enabled"
  },
  "menus": [
    {
      "name": "Dashboard",
      "path": "/dashboard",
      "icon": "dashboard"
    }
  ],
  "studio": {
    "port": 5099,
    "token": "studio_jwt_token",
    "expires_at": 1234567890
  }
}
```

**错误处理：**

- `400` - 验证码ID为空：`Please enter the captcha ID`
- `400` - 验证码为空：`Please enter the captcha code`
- `401` - 验证码错误：`Captcha error`
- `400` - 参数错误（既无email也无mobile）：`Parameter error`
- `400` - 不支持的登录类型：`Login type (%s) not supported`
- `500` - 数据库查询错误：`Database query error`
- `404` - 用户不存在：`User not found (%s)`
- `403` - 密码错误：`Login password error (%v)`

**Session 存储：**

```go
session.Global().Expire(time.Duration(token.ExpiresAt)*time.Second).ID(sid).Set("user_id", id)
session.Global().Expire(time.Duration(token.ExpiresAt)*time.Second).ID(sid).Set("user", row)
session.Global().Expire(time.Duration(token.ExpiresAt)*time.Second).ID(sid).Set("issuer", "yao")
```

**JWT Token 配置：**

- 有效期：8小时（3600 \* 8 秒）
- 签发者：`yao`
- 包含用户ID、过期时间、Session ID

**开发模式特殊功能：**
仅在 `config.Conf.Mode == "development"` 时返回 Studio 连接信息，使用独立的 Studio Secret 进行 Token 签名。

## API 接口

系统会自动为每个登录配置生成以下 API 接口：

### 登录接口

- **路径：** `POST /api/__yao/login/{id}`
- **说明：** 执行登录操作
- **参数：** 根据配置的 `action.args` 传递参数

### 验证码接口

- **路径：** `GET /api/__yao/login/{id}/captcha`
- **说明：** 获取登录验证码
- **参数：** 根据配置的 `layout.captcha` 处理器

## 配置示例

### 管理员登录配置 (admin.login.yao)

```json
{
  "name": "::Admin Login",
  "action": {
    "process": "yao.login.admin",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Dashboard/kanban",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com?from=instance-admin-login"
  }
}
```

### 用户登录配置 (user.login.yao)

```json
{
  "name": "::User Login",
  "action": {
    "process": "scripts.user.Login",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Table/admin.user",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com/?from=instance-user-login"
  },
  "thirdPartyLogin": [
    {
      "title": "微信登录",
      "href": "/api/auth/wechat",
      "icon": "wechat",
      "blank": false
    },
    {
      "title": "GitHub登录",
      "href": "/api/auth/github",
      "icon": "github",
      "blank": true
    }
  ]
}
```

## 自定义处理器

除了内置的 `yao.login.Admin` 处理器，还可以创建自定义登录处理器：

### 自定义处理器示例

#### JavaScript/TypeScript 实现

在 `scripts/amis/user.ts` 中实现完整的登录处理器：

```typescript
/**
 * 获取用户信息
 */
function getUserInfo(type: string, value: string) {
  const supportTypes = {
    email: 'email',
    mobile: 'mobile'
  };
  if (!supportTypes[type]) {
    throw new Exception(`Login type :${type} is not support`);
  }

  const [user] = Process('models.admin.user.get', {
    select: [
      'id',
      'name',
      'password',
      'type',
      'email',
      'mobile',
      'extra',
      'status'
    ],
    wheres: [
      { column: supportTypes[type], value: value },
      { column: 'status', value: 'enabled' }
    ],
    limit: 1
  });
  return user;
}

/**
 * 自定义用户登录处理器，支持多种登录方式
 *
 * yao run scripts.amis.user.AmisLogin
 *
 * @param {object} payload 用户登录信息
 * @returns 返回登录信息
 */
export function AmisLogin(payload: {
  email?: string;
  mobile?: string;
  userName?: string;
  password: string;
  captcha?: { id: string; code: string };
}) {
  // 验证码验证
  if (payload.captcha && typeof payload.captcha === 'object') {
    const captchaValid = Process(
      'yao.utils.CaptchaValidate',
      payload.captcha.id,
      payload.captcha.code
    );
    if (captchaValid !== true) {
      throw new Exception('验证码不正确!', 401);
    }
  }

  const { password, email, mobile, userName } = payload;

  // 查找用户
  let user = null;
  if (email != null) {
    user = getUserInfo('email', email);
  } else if (mobile != null) {
    user = getUserInfo('mobile', mobile);
  } else if (userName != null) {
    user = getUserInfo('email', userName);
  }

  if (!user) {
    throw new Exception('用户不存在!', 401);
  }

  // 密码验证
  try {
    const passwordValid = Process('utils.pwd.Verify', password, user.password);
    if (passwordValid !== true) {
      throw new Exception('密码不正确!', 401);
    }
  } catch (error) {
    throw new Exception('密码不正确' + error.message, 401);
  }

  // 生成会话
  const TIMEOUT = 60 * 60 * 8; // 8小时
  const sessionId = Process('utils.str.UUID');
  const userData = { ...user };
  delete userData.password;

  // JWT 配置
  const jwtOptions = {
    timeout: TIMEOUT,
    sid: sessionId
  };

  const jwtClaims = { user_name: user.name };
  const jwt = Process('utils.jwt.Make', user.id, jwtClaims, jwtOptions);

  // 设置会话数据
  Process('session.set', 'user', userData, TIMEOUT, sessionId);
  Process('session.set', 'token', jwt.token, TIMEOUT, sessionId);
  Process('session.set', 'user_id', user.id, TIMEOUT, sessionId);

  // 设置权限缓存
  const userAuthObject = getUserAuthObjects(user.id);
  Process(
    'session.set',
    'user_auth_objects',
    userAuthObject,
    TIMEOUT,
    sessionId
  );

  return {
    sid: sessionId,
    user: userData,
    menus: xgenMenu(),
    token: jwt.token,
    expires_at: jwt.expires_at
  };
}
```

#### Go 实现对比

如果需要用 Go 实现，可以在 `scripts/user/login.go` 中：

```go
// 在 scripts/user/login.go 中实现
package user

import (
    "github.com/yaoapp/gou/process"
    "github.com/yaoapp/kun/exception"
)

func Login(process *process.Process) interface{} {
    // 获取登录参数
    payload := process.ArgsMap(0).Dot()

    // 验证用户名密码
    username := payload.Get("username").(string)
    password := payload.Get("password").(string)

    // 执行用户验证逻辑
    if !validateUser(username, password) {
        exception.New("用户名或密码错误", 401).Throw()
    }

    // 返回登录结果
    return map[string]interface{}{
        "token": generateToken(username),
        "user": getUserInfo(username),
    }
}
```

然后在配置中使用：

```json
{
  "name": "::User Login",
  "action": {
    "process": "scripts.user.Login",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/User/profile"
  }
}
```

## 国际化支持

登录配置支持国际化，字段值使用 `::` 前缀表示需要进行国际化处理：

```json
{
  "name": "::Admin Login",
  "layout": {
    "slogan": "::Make Your Dream With Yao App Engine"
  }
}
```

系统会根据当前语言环境自动翻译相应的文本内容。

## 安全注意事项

1. **验证码：** 建议在生产环境中启用验证码功能
2. **密码加密：** 使用 BCrypt 等安全的密码加密方式
3. **会话管理：** 合理设置 Token 过期时间
4. **HTTPS：** 生产环境中建议使用 HTTPS 协议
5. **输入验证：** 对用户输入进行严格验证和过滤

## 最佳实践

1. **分离管理员和用户登录：** 使用不同的配置文件和处理器
2. **合理的跳转页面：** 根据用户类型设置合适的登录后跳转页面
3. **品牌定制：** 通过 `cover`、`slogan`、`site` 等字段定制登录页面
4. **第三方登录：** 根据业务需求集成第三方登录
5. **错误处理：** 在自定义处理器中添加适当的错误处理逻辑

## 数据模型配置

### admin.user 模型配置

使用内置 `yao.login.admin` 处理器时，必须正确配置 `admin.user` 模型。以下是完整的配置要求和示例。

#### 必需字段详解

| 字段名       | 类型   | 必填 | 默认值    | 说明                                                                 |
| ------------ | ------ | ---- | --------- | -------------------------------------------------------------------- |
| **id**       | ID     | 是   | -         | 用户唯一标识，用于生成JWT Token，必须设置为主键                      |
| **password** | string | 是   | -         | 登录密码，长度建议256，必须设置 `"crypt": "PASSWORD"` 进行BCrypt加密 |
| **name**     | string | 是   | -         | 用户显示名称，长度建议80，登录成功后返回给前端                       |
| **type**     | enum   | 是   | `user`    | 用户类型，选项：`super`、`admin`、`staff`、`user`，用于区分权限级别  |
| **email**    | string | 否   | -         | 邮箱地址，用于邮箱登录，长度建议50，建议建立索引                     |
| **mobile**   | string | 否   | -         | 手机号码，用于手机号登录，长度建议20，建议建立索引                   |
| **extra**    | json   | 否   | -         | 扩展信息，JSON格式存储用户扩展属性，登录成功后返回                   |
| **status**   | enum   | 是   | `enabled` | 账户状态，选项：`enabled`、`disabled`，只有 `enabled` 状态才能登录   |

**重要说明：**

- `email` 和 `mobile` 至少需要一个不为空，否则无法登录
- `password` 字段必须使用 BCrypt 加密，处理器会使用 `bcrypt.CompareHashAndPassword` 进行验证
- `status` 字段是登录权限控制的关键，`disabled` 状态的用户无法登录
- `type` 字段用于权限分级，可根据业务需求扩展更多类型

#### 完整模型示例

```json
// models/user.mod.yao
{
  "name": "用户管理",
  "table": {
    "name": "admin_user",
    "comment": "管理员用户表",
    "engine": "InnoDB"
  },
  "columns": [
    {
      "label": "用户ID",
      "name": "id",
      "type": "ID",
      "comment": "用户唯一标识",
      "primary": true
    },
    {
      "label": "用户类型",
      "name": "type",
      "type": "enum",
      "option": ["super", "admin", "staff", "user"],
      "comment": "用户类型：super超级管理员, admin管理员, staff员工, user普通用户",
      "default": "user"
    },
    {
      "label": "邮箱地址",
      "name": "email",
      "type": "string",
      "length": 50,
      "comment": "邮箱地址，可用于登录",
      "nullable": true,
      "index": true,
      "validations": [
        { "method": "email", "args": [], "message": "邮箱格式不正确" }
      ]
    },
    {
      "label": "手机号码",
      "name": "mobile",
      "type": "string",
      "length": 20,
      "comment": "手机号码，可用于登录",
      "nullable": true,
      "index": true,
      "validations": [
        { "method": "mobile", "args": [], "message": "手机号格式不正确" }
      ]
    },
    {
      "label": "登录密码",
      "name": "password",
      "type": "string",
      "length": 256,
      "comment": "登录密码，BCrypt加密存储",
      "crypt": "PASSWORD",
      "nullable": false,
      "validations": [
        { "method": "minLength", "args": [6], "message": "密码长度不能少于6位" }
      ]
    },
    {
      "label": "用户姓名",
      "name": "name",
      "type": "string",
      "length": 80,
      "comment": "用户真实姓名"
    },
    {
      "label": "扩展信息",
      "name": "extra",
      "type": "json",
      "comment": "用户扩展信息，JSON格式存储",
      "nullable": true
    },
    {
      "label": "账户状态",
      "name": "status",
      "type": "enum",
      "option": ["enabled", "disabled"],
      "comment": "账户状态，只有enabled状态才能登录",
      "default": "enabled",
      "index": true
    }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```

#### 数据库操作

```bash
# 创建数据表
yao migrate -n admin.user

# 重置数据表（会删除现有数据）
yao migrate -n admin.user --reset

# 查看迁移状态
yao migrate
```

#### 演示数据

演示数据可以包含在模型文件的 `values` 节点中，执行 `yao migrate` 时会自动导入。密码字段会在导入时自动加密。

```json
{
  "values": [
    {
      "type": "admin",
      "email": "admin@yao.com",
      "password": "123456",
      "name": "系统管理员",
      "status": "enabled"
    },
    {
      "type": "user",
      "mobile": "13800138000",
      "password": "123456",
      "name": "普通用户",
      "status": "enabled"
    }
  ]
}
```

> **注意**：密码字段必须是加密后的 Hash 值。演示数据中的 Hash 值仅供参考，实际应用中请使用 `yao.utils.Pwd` 等工具生成。

#### 常见问题

1. **登录失败：用户不存在**
   - 检查 `email` 或 `mobile` 是否正确
   - 确认用户 `status` 为 `enabled`

2. **登录失败：密码错误**
   - 确认密码已使用 `crypt: "PASSWORD"` 加密
   - 检查密码字段长度是否足够（建议256）

3. **模型字段缺失**
   - 确认包含所有必需字段：`id`, `password`, `name`, `type`, `email`, `mobile`, `extra`, `status`
   - 检查字段名是否完全匹配（大小写敏感）

4. **验证失败**
   - 确认验证码功能正常工作
   - 检查验证码配置和存储

## 相关文件

- **源码位置：** `widgets/login/`
- **配置目录：** `logins/`
- **模型依赖：** `models/user.mod.yao` (admin.user模型)
- **API 路径：** `/api/__yao/login/{id}`
- **处理器名称：** `yao.login.admin`
- **数据表：** `admin_user`

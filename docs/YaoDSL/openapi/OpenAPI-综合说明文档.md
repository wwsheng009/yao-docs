# Yao OpenAPI 综合说明文档

## 概述

Yao OpenAPI 是一个全面的 RESTful API 系统，为 Yao 应用程序提供完整的开发和管理能力。该系统实现了 OAuth 2.1 和 OpenID Connect 规范，提供安全认证、资源管理、AI 对话、文件处理等核心功能。

## 核心特性

### 🔐 安全认证系统

- **OAuth 2.1 & OpenID Connect**: 完整实现 RFC 标准规范
- **多种授权模式**: 支持授权码、客户端凭证、设备授权等流程
- **PKCE 支持**: 为公共客户端提供增强安全保护
- **动态客户端注册**: RFC 7591 标准实现
- **令牌管理**: 完整的令牌签发、验证、撤销和内省机制

### 🤖 AI 对话服务

- **100% OpenAI 兼容**: 现有 OpenAI 客户端代码零修改迁移
- **实时流式响应**: 基于 Server-Sent Events 的流式对话
- **多助手支持**: 提供不同能力和个性的 AI 助手
- **上下文管理**: 持久化会话和对话历史
- **双格式支持**: OpenAI 标准格式和 Yao 简化格式

### 📁 文件管理系统

- **多存储后端**: 支持本地文件系统和 S3 兼容云存储
- **分块上传**: 大文件可靠上传机制
- **自动压缩**: Gzip 和图像压缩优化
- **元数据管理**: 完整的文件组织和检索功能
- **优化内容传递**: 直接文件读取和数据库驱动的元数据头

### 🏗️ DSL 资源管理

- **完整 CRUD**: 创建、读取、更新、删除 DSL 资源
- **加载管理**: 动态加载、卸载和重新加载资源
- **语法验证**: DSL 源代码语法检查
- **方法执行**: 在已加载的 DSL 资源上执行方法
- **资源发现**: 列出和检查可用的 DSL 资源

### 👤 用户管理系统

- **完整用户生命周期**: 注册、登录、个人资料管理
- **多因素认证**: TOTP 和短信验证码支持
- **第三方集成**: OAuth 提供商连接和管理
- **团队协作**: 团队创建、成员管理和邀请机制
- **API 密钥管理**: 用户 API 密钥的创建和管理

### 📊 追踪和监控

- **执行追踪**: 实时监控执行过程
- **事件流**: Server-Sent Events 实时事件推送
- **节点管理**: 执行节点的详细信息
- **内存空间**: 执行上下文和内存管理
- **日志系统**: 结构化日志记录和查询

## API 架构

### 基础 URL 结构

```
https://your-domain.com/v1/{module}
```

### 认证方式

所有受保护的端点都需要 OAuth Bearer Token：

```
Authorization: Bearer {access_token}
```

### 标准响应格式

成功响应：

```json
{
  "data": { ... },
  "message": "操作成功"
}
```

错误响应：

```json
{
  "error": "error_code",
  "error_description": "错误描述"
}
```

## 主要模块详解

### 1. 认证授权模块 (/oauth)

#### 核心端点

- `GET /oauth/authorize` - 授权请求
- `POST /oauth/token` - 令牌交换
- `POST /oauth/revoke` - 令牌撤销
- `POST /oauth/introspect` - 令牌内省
- `GET /oauth/jwks` - JSON Web 密钥集
- `GET /oauth/userinfo` - 用户信息

#### 发现端点

- `/.well-known/oauth-authorization-server` - 授权服务器元数据
- `/.well-known/openid_configuration` - OpenID Connect 配置

#### 典型使用流程

**Web 应用授权码流程：**

```bash
# 1. 发起授权
GET /oauth/authorize?client_id=web_app&response_type=code&redirect_uri=https://app.com/callback&scope=openid+profile

# 2. 交换令牌
POST /oauth/token
grant_type=authorization_code&code=auth_code&client_id=web_app&client_secret=secret

# 3. 使用令牌访问 API
GET /v1/dsl/list/model
Authorization: Bearer {access_token}
```

### 2. DSL 管理模块 (/dsl)

#### 支持的资源类型

- `model` - 数据库模型
- `connector` - 外部服务连接器
- `mcp-client` - MCP 客户端配置
- `api` - HTTP API 定义

#### 主要端点

- `GET /dsl/list/{type}` - 列出 DSL 资源
- `POST /dsl/create/{type}` - 创建 DSL 资源
- `GET /dsl/inspect/{type}/{id}` - 检查资源详情
- `PUT /dsl/update/{type}` - 更新资源
- `DELETE /dsl/delete/{type}/{id}` - 删除资源
- `POST /dsl/execute/{type}/{id}/{method}` - 执行方法

#### 使用示例

```bash
# 创建新模型
POST /v1/dsl/create/model
{
  "id": "user",
  "source": "{ \"name\": \"user\", \"table\": { \"name\": \"users\" }, \"columns\": [...] }",
  "store": "file"
}

# 执行模型方法
POST /v1/dsl/execute/model/user/find
{
  "args": [1, {"select": ["id", "name"]}]
}
```

### 3. AI 对话模块 (/chat)

#### 核心特性

- **OpenAI 兼容性**: 现有代码只需修改 API 基础 URL 和密钥
- **流式响应**: 实时流式输出，无需等待完整响应
- **多助手选择**: 不同专业领域的 AI 助手

#### 主要端点

- `GET /chat/completions` - GET 方式流式对话（Yao 格式）
- `POST /chat/completions` - POST 方式流式对话（OpenAI 格式）

#### 迁移示例

```python
# 原有 OpenAI 代码
import openai
openai.api_key = "sk-..."

# 迁移到 Yao（仅需修改两行）
openai.api_base = "https://your-yao.com/v1"
openai.api_key = "your-oauth-token"

# 其他代码保持不变
response = openai.ChatCompletion.create(
    model="mohe",
    messages=[{"role": "user", "content": "你好"}],
    stream=True
)
```

### 4. 文件管理模块 (/file)

#### 核心功能

- **多存储支持**: 本地文件系统和 S3 云存储
- **分块上传**: 大文件分块上传，提高可靠性
- **自动压缩**: Gzip 和图像压缩优化存储
- **元数据管理**: 完整的文件组织、标签和检索

#### 主要端点

- `POST /file/{uploaderID}` - 上传文件
- `GET /file/{uploaderID}` - 列出文件
- `GET /file/{uploaderID}/{fileID}` - 获取文件信息
- `GET /file/{uploaderID}/{fileID}/content` - 下载文件内容
- `DELETE /file/{uploaderID}/{fileID}` - 删除文件

#### 使用示例

```bash
# 简单文件上传
curl -X POST "/v1/file/default" \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.pdf" \
  -F "path=docs/report.pdf" \
  -F "gzip=true"

# 分块上传（大文件）
curl -X POST "/v1/file/default" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Range: bytes 0-1048575/3145728" \
  -H "Content-Uid: upload-session-123" \
  -F "file=@chunk1.bin"
```

### 5. 用户管理模块 (/user)

#### 功能范围

- **认证管理**: 登录、注册、登出
- **个人资料**: 用户信息更新和管理
- **安全设置**: 密码修改、邮箱/手机验证、MFA
- **第三方集成**: OAuth 提供商连接
- **团队协作**: 团队创建、成员管理、邀请机制
- **API 密钥**: 用户 API 密钥管理

#### 主要端点类别

- 认证端点 (`/user/login`, `/user/register`, `/user/logout`)
- 个人资料 (`/user/profile`)
- 账户安全 (`/user/account/*`)
- 多因素认证 (`/user/mfa/*`)
- OAuth 集成 (`/user/oauth/*`)
- 团队管理 (`/user/teams/*`)

### 6. 追踪监控模块 (/trace)

#### 监控能力

- **实时追踪**: Server-Sent Events 实时事件流
- **执行节点**: 详细的执行节点信息
- **内存空间**: 执行上下文和内存管理
- **日志系统**: 结构化日志记录

#### 主要端点

- `GET /trace/traces/:traceID/events` - 流式事件
- `GET /trace/traces/:traceID/info` - 追踪元数据
- `GET /trace/traces/:traceID/nodes` - 执行节点列表
- `GET /trace/traces/:traceID/logs` - 日志列表

### 7. 签到配置模块 (/signin)

#### 功能特性

- **多语言支持**: 本地化签到配置
- **多种认证方式**: 密码认证和第三方 OAuth
- **配置管理**: 灵活的签到界面配置

#### 主要端点

- `GET /signin` - 获取签到配置
- `POST /signin` - 密码认证
- `GET /signin/authback/{provider}` - OAuth 回调

## 测试和开发

### 测试环境

Yao OpenAPI 提供完整的测试基础设施：

- **标准化测试数据**: 预配置的测试客户端和用户
- **多存储支持**: MongoDB 和 Badger 存储测试
- **并行执行**: 自动测试隔离，支持 CI/CD 并行测试
- **完整清理**: 自动化测试数据清理

### 测试数据集

#### 标准测试客户端

1. **机密客户端** (`test-confidential-client`) - Web 应用测试
2. **公共客户端** (`test-public-client`) - 移动/SPA 应用测试
3. **客户端凭证客户端** (`test-credentials-client`) - 服务端认证测试

#### 标准测试用户

10 个预配置用户，涵盖不同权限和功能场景：

- 管理员用户、普通用户、增强安全用户、待验证用户等

## 商业使用条款

### 许可证要求

Yao OpenAPI 可用于商业用途，但需满足以下条件：

1. **开发者证书**: 商业部署需要获得有效的 Yao 开发者证书
2. **品牌保护**: Yao 品牌元素必须保持完整，不得移除或修改
3. **验证系统**: Yao 证书验证系统必须完整保持，禁止绕过或修改
4. **代码完整**: 核心验证机制（认证、OAuth、许可证检查等）必须保持未修改

### 合规义务

- 获得并维护有效的 Yao 开发者证书
- 保持所有证书验证代码完整
- 尊重商标权，保持品牌元素未修改
- 定期合规审查，确保持续遵守要求

## 安全特性

### OAuth 2.1 安全

- **PKCE (Proof Key for Code Exchange)**: 公共客户端强制要求
- **State 参数**: 授权请求的 CSRF 保护
- **安全令牌存储**: 适当的令牌过期和存储
- **客户端认证**: 多种认证方法支持

### HTTP 安全头

所有响应包含安全头：

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### 访问控制

- 所有端点需要有效的 OAuth 认证
- 文件访问限制在上传器/管理者级别
- 文件 ID 使用加密安全的 MD5 哈希

## 部署和配置

### 配置文件

OpenAPI 服务器通过 `openapi/openapi.yao` 配置。

### 环境要求

- **存储**: MongoDB（推荐）或 Badger（后备）
- **HTTPS**: 所有端点必须使用 HTTPS
- **证书**: 商业部署需要 Yao 开发者证书

### 性能优化

- **直接内容读取**: 减少流式开销
- **数据库驱动头**: 基于数据库元数据的准确响应头
- **缓存机制**: LRU 缓存提高性能
- **自动压缩**: Gzip 和图像压缩优化

## 总结

Yao OpenAPI 是一个功能完整、安全可靠的 API 系统，为现代应用程序开发提供了：

- **企业级安全**: OAuth 2.1 和 OpenID Connect 标准实现
- **AI 集成**: 100% OpenAI 兼容的对话服务
- **完整功能**: 用户管理、文件处理、DSL 管理、监控追踪
- **开发友好**: 零迁移成本的 OpenAI 兼容性
- **生产就绪**: 完整的测试基础设施和安全特性

该系统特别适合需要 AI 集成、文件管理、用户认证和 DSL 资源管理的现代 Web 应用程序。

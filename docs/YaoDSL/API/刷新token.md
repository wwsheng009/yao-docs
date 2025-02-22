# 刷新 token

## 概述

在基于 JWT 的认证系统中，token 刷新是一个重要的功能，它可以在用户 token 即将过期时，无需重新登录就能获取新的 token。本文将详细介绍如何在 Yao 中实现 token 刷新功能。

## 实现原理

1. 客户端在检测到 token 即将过期时，调用刷新 token 接口
2. 服务端通过 guard 验证当前 token 的有效性
3. 验证通过后，根据当前会话信息生成新的 token
4. 同时更新服务器端的 session 信息

## API 定义

在 API 配置文件中定义刷新 token 的接口：

```json
{
  "name": "用户接口",
  "version": "1.0.0",
  "description": "用户接口",
  "group": "user",
  "paths": [
    {
      "path": "/token/refresh",
      "guard": "bearer-jwt",
      "method": "POST",
      "process": "scripts.guard.TokenRefresh",
      "in": [],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

## Token 刷新处理器

实现 token 刷新的处理逻辑：

```js
/**
 * 刷新Token
 * @returns {object} 返回新的JWT token信息
 */
function TokenRefresh() {
  // 从当前会话获取用户信息
  const user = Process('session.Get', 'user');
  const id = user.id;

  // 获取当前会话ID
  const sid = Process('session.ID');

  // 生成新的JWT token
  const jwt = Process(
    'utils.jwt.Make',
    id, // 用户ID
    {}, // 自定义数据载荷
    {
      timeout: 3600, // token有效期(秒)
      sid: sid // 会话ID
    }
  );

  // 更新会话信息
  Process('session.Set', 'user_id', id);
  Process('session.Set', 'user', user);

  return jwt;
}
```

## Token 验证

可以自定义 token 验证逻辑，实现更灵活的 token 校验：

```js
/**
 * 自定义token验证
 * @param {string} path - API路径
 * @param {object} params - API参数
 * @param {object} query - 查询参数
 * @param {object|string} payload - 请求体数据
 * @param {object} headers - 请求头
 * @returns {object} 返回会话信息
 */
function ValidateToken(path, params, query, payload, headers) {
  // 获取并处理token
  query = query || {};
  let token = query.token || '';
  token = token[0] || '';
  token = token.replace('Bearer ', '');

  // 验证token是否存在
  if (token == '' || token.length == 0) {
    throw new Exception('No token provided', 403);
  }

  // 验证token有效性
  let data = Process('utils.jwt.Verify', token);

  // data.data 是jwt.make的第二个参数中的自定义数据
  // data.sid 是会话ID

  // 返回会话信息
  return {
    __sid: data.sid, // 会话ID
    __global: data.data // 全局数据
  };
}
```

## 最佳实践

1. **合理设置 token 有效期**：

   - 主 token 设置较短的有效期（如 1 小时）
   - 刷新 token 设置较长的有效期（如 7 天）

2. **安全性考虑**：

   - 刷新 token 接口必须使用 HTTPS
   - 验证当前 token 的有效性
   - 可以维护一个 token 黑名单，用于已注销的 token

3. **错误处理**：

   - token 失效时返回合适的状态码（如 401）
   - 提供清晰的错误信息
   - 客户端收到 401 时跳转到登录页面

4. **并发处理**：
   - 处理多个客户端同时刷新 token 的情况
   - 可以使用滑动窗口机制避免频繁刷新

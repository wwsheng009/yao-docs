# 服务器端会话 session 保持

## 使用会话 session 保持登录状态

在 Yao 中可以使用 session 保持登录状态,yao 会自动在客户端和服务器端同步 session。

操作步骤：

- 在用户登录处理器中设置 session，在登录成功后,调用 `session.set('user', user)` 将用户信息保存到 session 中。yao 内置的登录处理器已经实现了这一步，如果需要自定义登录逻辑,也要设置 session。

- 在其它需要检查登录状态的地方,通过 `session.get('user')` 获取用户信息。如果获取不到,则表示未登录。这里还有一个前提条件，就是 http api 需要开启登录认证，`"guard": "bearer-jwt"`。

## 与 session 相关的 process 定义

`/data/projects/yao/yao-app-sources/gou/process.go`
session 有以下的处理器:

- ~~session.start~~,如果在一个 flow 调用了 session.start,在这个调用的节点后的所有 flow 节点都能使用 session 的 sid
- session.get，可以指定不同的 sid
- ssseion.set，可以指定 sid，还有超时时间
- session.setmany，有三种调用方法
- session.dump,可以在第一个参数指定不同的 SID，比如 session.dump x1

在 flow 中使用 session
当使用 Session start 设置 SID 时,整个 Flow 都使用了同一个 sid
![yao-api-session](./session/yao_session_flow%E4%B8%AD%E4%BD%BF%E7%94%A8%E4%BC%9A%E8%AF%9D.jpg)

```go
    if node.Process != "" {
        process := NewProcess(node.Process, args...).WithGlobal(flow.Global).WithSID(flow.Sid)
        resp = process.Run()

        // 当使用 Session start 设置SID时
        // 设置SID (这个逻辑需要优化)
        if flow.Sid == "" && process.Sid != "" {
            flow.WithSID(process.Sid)
        }
    }
```

## 案例：自定义登录过程，使用 session 在 flow 中保存用户的信息

session 信息处理流转图

![session 信息处理流转图](../../%E6%B5%81%E7%A8%8B%E5%9B%BE/png/yao_session_%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95%E6%B5%81%E7%A8%8B%E4%BC%9A%E8%AF%9D.drawio.png)

用户登录后，会生成一个会话 id，使用这个 id 生成 token,在服务器的 session 保存用户 id 与用户的相关信息。

用户登录校验，检查用户的 flow 定义,第一步需要检查用户的用户名与密码是否正确

```json
{
  "label": "Password Login",
  "version": "1.0.0",
  "description": "Password Login",
  "nodes": [
    {
      "name": "Validate Captcha",
      "process": "xiang.helper.CaptchaValidate",
      "args": ["{{$captcha.id}}", "{{$captcha.code}}"]
    },
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "password"],
          "wheres": [{ "column": "mobile", "value": "?:$mobile" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Validate Passwor",
      "process": "xiang.helper.PasswordValidate",
      "args": ["{{$password}}", "{{$res.User.0.password}}"]
    },
    {
      "name": "Response",
      "process": "flows.login.Token",
      "args": ["{{$res.User.0.id}}"]
    }
  ],
  "output": "{{$res.Response}}"
}
```

给这次正确的登录生成会话 ID，并在 token 里包含上 sid,在这里可选的操作是在 session 中保存会话信息。

session.start 调用后，后面的 session 方法可以取到内部的 sid.session.start 会自动的让\_sid 在 flow 的内部保存

login token 会返回到客户端，客户端在访问 API 时自动的把 token 带上。

```json
{
  "label": "Token",
  "version": "1.0.0",
  "description": "JWT Token",
  "nodes": [
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "name", "user_id", "open_id", "union_id"],
          "wheres": [{ "column": "id", "value": "?:$in.0" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Menu",
      "process": "flows.xiang.menu",
      "args": ["{{$res.User.0.id}}"]
    },
    {
      "name": "SID",
      "process": "session.start"
    },
    {
      "name": "JWT",
      "process": "xiang.helper.JWTMake",
      "args": [
        "{{$res.User.0.id}}",
        {},
        {
          "timeout": 3600,
          "sid": "{{$res.SID}}"
        }
      ]
    },
    {
      "name": "Set User Data",
      "process": "session.set",
      "args": ["user", "{{$res.User.0}}"]
    },
    {
      "name": "Set User ID",
      "process": "session.set",
      "args": ["user_id", "{{$res.User.0.id}}"]
    }
  ],
  "output": {
    "sid": "{{$res.SID}}",
    "user": "{{$res.User.0}}",
    "menus": "{{$res.Menu}}",
    "token": "{{$res.JWT.token}}",
    "expires_at": "{{$res.JWT.expires_at}}"
  }
}
```

## 在 table 的 action 定义中使用 session

在 table 的 action 定义中可以使用“$.”作为前缀引用 session 信息。
调用 API 里怎么知道是哪个用户，并且在 table 绑定的 search 函数里还可直接调用户的会话信息。

实现的原理：

```go
// `yao/widgets/action/process.go`
// Session $.user.id $.user_id
    v := strings.TrimSpace(valueStr)
    if strings.HasPrefix(v, "$.") {
        name := strings.TrimLeft(v, "$.")
        namer := strings.Split(name, ".")

        val, err := session.Global().ID(sid).Get(namer[0])

        if err != nil {
            exception.New("Get %s %s", 500, v, err.Error()).Throw()
            return nil
        }

        // $.user_id
        if len(namer) == 1 {
            log.Trace("[Session] %s %v", v, val)
            return val
        }

        // $.user.id
        mapping := any.Of(val).MapStr().Dot()
			val = mapping.Get(strings.Join(namer[1:], "."))
			log.Trace("[Session] %s %v", v, val)
			return val
		}

```

答案在于 api 每次调用都携带的 token,在经过 api 的 bearer-jwt guard 处理后，http 的 上下文 context 自动保存了对应的 context id，后面的 process 根据 sid 可以找到对应的 session

## JS 脚本中使用 Session

经过上面的处理，在 js 脚本中可以直接调用处理器`session.get`与`session.dump`获取会话相关的信息。

```js
const ses = Process('session.dump');
console.log('session:', ses);
const user = Process('session.get', 'user');
console.log('user:', user);
```

## 版本变更

在 0.10.3 版本以后，`session.start`不再可用。需要使用处理器`utils.str.UUID`先生成唯一的标识 ID，在使用处理器`session.set`与`session.get`的时候在最后一个参数放入 sid。

```js
const sessionId = Process('utils.str.UUID');

Process('session.set', 'user', userPayload, timeout, sessionId);
Process('session.set', 'token', jwt.token, timeout, sessionId);
Process('session.set', 'user_id', user.id, timeout, sessionId);
```

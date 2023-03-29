# 服务器端会话 session 保持

## 与 session 相关的 process 定义

`/data/projects/yao/yao-app-sources/gou/process.go`
session 有以下的处理器:

- session.start,如果在一个 flow 调用了 session.start,在这个调用的节点后的所有 flow 节点都能使用 session 的 sid
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

## 案例：使用 session 在 flow 中保存用户的信息

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

## API 中使用 session

在所有的使用了 jwt token 作为 api guard 的 api 中都可以使用$session 直接引用会话变量。

## 在 table 的 action 定义中使用 session

在 table 的 action 定义中可以使用“$.”作为前缀引用 session 信息。
调用 API 里怎么知道是哪个用户，并且在 table 绑定的 search 函数里还可直接调用户的会话信息。
`yao/widgets/action/process.go`

```go
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

答案在于 api 每次调用都携带的 token,在经过 api 的 bearer-jwt guard 处理后，http 的 conText 自动保存了对应的 context id，后面的 process 根据 sid 可以找到对应的 session

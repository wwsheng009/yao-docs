# api 请求过程

[流程图在线查看](https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=yao_app.drawio#Uhttps%3A%2F%2Fraw.githubusercontent.com%2Fwwsheng009%2Fyao-docs%2Fmain%2Fdocs%2F%25E6%25B5%2581%25E7%25A8%258B%25E5%259B%25BE%2Fdrawio%2Fyao_app.drawio)

![](./png/yao_app_api%E8%AF%B7%E6%B1%82%E8%BF%87%E7%A8%8B.drawio.png)

## 处理流程说明

Yao 的 API 请求处理流程包含以下几个主要步骤：

1. **API 入口**

   - 接收来自客户端的 HTTP 请求
   - 初始化请求上下文

2. **处理器**

   - 根据请求路径进行路由分发
   - 将请求分发到相应的处理模块（table、model 等）

3. **Table 处理**

   - 如果请求涉及表格操作，进入 table 处理流程
   - 触发 Before Hook 进行前置处理
   - 执行表格相关操作
   - 触发 After Hook 进行后置处理

4. **Model 处理**

   - 如果请求涉及数据模型，进入 model 处理流程
   - 执行数据模型相关操作

5. **参数处理**

   - 解析请求参数
   - 处理 URL 查询参数（query-param）
   - 转换参数格式

6. **请求执行**

   - 根据解析的参数执行具体业务逻辑
   - 调用相应的处理函数

7. **结果返回**
   - 处理执行结果
   - 格式化响应数据
   - 返回给客户端

## 关键组件说明

- **gin 路由**: 负责 HTTP 请求的路由分发
- **parsein**: 请求参数解析器
- **URLToQueryParam**: 将 URL 参数转换为查询参数
- **Xun 查询**: 执行数据库查询操作
- **应用处理器**: 处理具体的业务逻辑

## 处理流程特点

1. 完整的前置和后置钩子支持，可以在处理前后执行自定义逻辑
2. 灵活的参数处理机制，支持多种参数格式
3. 统一的错误处理和响应格式
4. 模块化的设计，便于扩展和维护

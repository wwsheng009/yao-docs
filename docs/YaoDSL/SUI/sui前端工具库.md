# SUI 前端工具库

SUI 是一个后台渲染的框架，同时也提供了前端UI操作的工具库，结合 libsui.min.js 工具库，提供组件化开发、状态管理、事件处理、动态渲染、后端交互和 AI 代理功能。本文档概述其核心功能、扩展功能、Yao SDK 和 Yao AI Agent SDK 的使用方法。

在SUI中，模板编译后默认会注入一个名称为`libsui.min.js`的前端工具库，它包含了SUI中常用的工具函数。
执行以下命令会生成libsui.min.js文件。

```sh
yao sui build sui_id template_id
```

index.html中引用libsui.min.js文件。

```html
<script
  s:ns=""
  s:cn=""
  s:hash="script_5f50a1db8f374703"
  src="/assets/libsui.min.js"
  type="text/javascript"
  name="libsui"
></script>
```

在开发阶段，不需要显式的引用，只需要在模板关联的ts/js文件中引用类型声明即可。

```ts
//示例：
import { $Query, Component, EventData } from '@yao/sui';
import { $Backend, $Query, $Store, Component, Yao } from '@yao/sui';
```

此函数库包含以下功能：

- 核心库，包含HTML查询，数据处理。
- 全局Yao对象
- AI操作库

## 1. 核心功能

在后端渲染过程中，每一个模板中的子页面可以理解成一个个单独的组件`Component`,组件有自己的事件处理与数据管理、状态管理、属性信息。每一个组件都会有一个html属性`s:cn`，这个组件ID在一个页面中是唯一的，组件的其它信息都会以组件id的方式进行关联。

### 1.1 组件初始化

通过 `$$` 函数初始化组件，支持 CSS 选择器或 HTML 元素作为参数：

- **输入**：字符串选择器或 HTMLElement。
- **逻辑**：查找元素，获取 `s:cn` 属性（组件名称），并实例化对应组件。
- **返回**：`__sui_component` 实例或 `null`。

### 1.2 状态管理

`__sui_state` 管理组件状态，支持异步状态更新和事件传播：

- **方法**：
  - `Set(key, value, target)`：更新状态，触发 `watch` 中的处理函数，并支持向上传播状态变化事件。
  - `stopPropagation()`：阻止状态事件传播。
- **事件**：通过 `state:change` 自定义事件通知父组件。

### 1.3 属性管理

`__sui_props` 处理组件的属性（`prop:` 前缀）：

- **方法**：
  - `Get(key)`：获取指定属性值，支持 JSON 解析（`json-attr-prop:`）。
  - `List()`：列出所有属性键值对。

### 1.4 数据存储

`__sui_store` 管理组件的本地数据（`data:` 和 `json:` 前缀）：

- **方法**：
  - `Get(key)`：获取 `data:` 属性值。
  - `Set(key, value)`：设置 `data:` 属性值。
  - `GetJSON(key)`：获取并解析 `json:` 属性值。
  - `SetJSON(key, value)`：设置 JSON 格式的属性值。
  - `GetData()`：获取 `__component_data` 的 JSON 数据。

### 1.5 事件绑定

`__sui_event_init` 为带有 `s:event` 或 `s:event-jit` 的元素绑定事件：

- **逻辑**：查找 `s:on-*` 属性，绑定对应事件处理函数，支持 `data:` 和 `json:` 属性传递数据。
- **错误处理**：未找到组件或事件处理函数时记录错误日志。

### 1.6 后端调用

`__sui_backend_call` 用于发起后端 API 请求：

- **参数**：
  - `route`：API 路由。
  - `headers`：请求头。
  - `method`：调用方法。
  - `args`：参数列表。
- **逻辑**：向 `/api/__yao/sui/v1/run${route}` 发送 POST 请求，返回解析后的响应数据或错误。

### 1.7 动态渲染

`__sui_render` 实现动态内容渲染：

- **参数**：
  - `component`：组件实例或选择器。
  - `name`：渲染目标（`s:render` 属性）。
  - `data`：渲染数据。
  - `option`：渲染选项（`replace`、`showLoader`、`withPageData`、`route` 等）。
- **逻辑**：
  1. 查找 `s:render` 元素。
  2. 显示加载提示（可选）。
  3. 合并组件数据和页面数据，发送 POST 请求至 `/api/__yao/sui/v1/render${route}`。
  4. 更新目标元素内容，初始化子组件和事件。
- **返回**：渲染结果或错误。

## 2. 组件结构

### 2.1 Component

```typescript
interface Component {
  root: HTMLElement; // 组件根元素
  state: ComponentState; // 状态管理
  store: ComponentStore; // 数据存储
  watch?: Record<string, (value: any, state?: State) => void>; // 状态监听
  Constants?: Record<string, any>; // 常量
  [key: string]: any; // 扩展属性
}
```

### 2.2 RenderOption

```typescript
interface RenderOption {
  target?: HTMLElement; // 渲染目标
  showLoader?: HTMLElement | string | boolean; // 加载提示
  replace?: boolean; // 是否替换内容
  withPageData?: boolean; // 是否包含页面数据
  component?: string; // 组件名称
  route?: string; // 渲染路由
}
```

### 2.3 ComponentState

```typescript
interface ComponentState {
  Set: (key: string, value: any) => void; // 设置状态
}
```

### 2.4 ComponentStore

```typescript
interface ComponentStore {
  Get: (key: string) => string; // 获取数据
  Set: (key: string, value: any) => void; // 设置数据
  GetJSON: (key: string) => any; // 获取 JSON 数据
  SetJSON: (key: string, value: any) => void; // 设置 JSON 数据
  GetData: () => Record<string, any>; // 获取组件数据
}
```

### 2.5 State

```typescript
interface State {
  target: HTMLElement; // 状态目标元素
  stopPropagation: () => void; // 阻止状态传播
}
```

## 3. 使用示例

### 3.1 初始化组件

```html
<div s:cn="MyComponent"></div>
<script>
  const comp = $$("div[s:cn='MyComponent']");
</script>
```

### 3.2 状态更新

```javascript
comp.state.Set('count', 42); // 触发 watch.count 处理函数
```

### 3.3 事件绑定

```html
<button s:event s:on-click="handleClick" data:id="123">Click me</button>
<script>
  const self = this as Component;
  self.handleClick = (event, data) => console.log(data.id); // 输出: 123
</script>
```

### 3.4 动态渲染

```html
<div s:cn="MyComponent" s:route="/page">
  <div s:render="content"></div>
</div>
<script>
  const self = this as Component;

  self.render("content", { key: "value" }, { showLoader: true });
</script>
```

## 4. 注意事项

- 确保 `s:cn` 属性正确设置以关联组件。
- 事件绑定需确保 `window[cn]` 存在且为函数。
- 渲染和后端调用依赖正确的路由和服务器配置。
- 使用 `json:` 属性时需保证 JSON 格式正确。

以下是根据提供的 JavaScript 代码整理的简洁明了的中文文档，采用 Markdown 格式，概述了 SUI 框架中 `$Store`、`$Query`、`$Render` 和 `$Backend` 相关功能和使用方法。

扩展功能，包括 `$Store`、`$Query`、`$Render` 和 `$Backend`，用于增强组件数据管理、DOM 查询、动态渲染和后端交互。

## 5. 扩展功能

### 5.1 $Store

用于创建组件数据存储实例，基于 `__sui_store` 实现。

- **函数**：`$Store(elm)`
- **参数**：
  - `elm`：字符串选择器或 HTMLElement。
- **逻辑**：
  - 若 `elm` 为字符串，查询首个匹配元素；若无匹配，返回 `null`。
  - 返回 `__sui_store` 实例，管理 `data:` 和 `json:` 属性。
- **返回**：`__sui_store` 实例或 `null`。

### 5.2 $Query

提供类似 jQuery 的 DOM 查询和操作接口，封装为 `__Query` 类。

- **函数**：`$Query(selector)`
- **参数**：
  - `selector`：字符串选择器、Element 或 NodeList。
- **类方法**：
  - `elm()`：返回首个匹配元素。
  - `elms()`：返回所有匹配元素（NodeList）。
  - `find(selector)`：在当前元素内查找子元素，返回 `__Query` 实例或 `null`。
  - `findAll(selector)`：查找所有子元素，返回 `__Query` 实例或 `null`。
  - `closest(selector)`：查找最近的祖先元素，返回 `__Query` 实例或 `null`。
  - `on(event, callback)`：绑定事件监听器，返回自身以支持链式调用。
  - `$$()`：查找最近的 `[s:cn]` 组件元素并返回 `__sui_component` 实例。
  - `each(callback)`：遍历匹配元素，调用回调函数（参数为 `__Query` 实例和索引）。
  - `store()`：返回当前元素的 `__sui_store` 实例。
  - `attr(key)`：获取指定属性值。
  - `data(key)`：获取 `data:` 属性值。
  - `json(key)`：获取并解析 `json:` 属性值，解析失败返回 `null`。
  - `prop(key)`：获取 `prop:` 属性值，支持 JSON 解析（`json-attr-prop:`）。
  - `hasClass(className)`：检查元素是否包含指定类名。
  - `toggleClass(className)`：切换类名（支持字符串或数组），返回自身。
  - `removeClass(className)`：移除类名（支持字符串或数组），返回自身。
  - `addClass(className)`：添加类名（支持字符串或数组），返回自身。
  - `html(html?)`：获取或设置元素 `innerHTML`，无参数时返回 HTML 内容，有参数时设置内容并返回自身。
- **返回**：`__Query` 实例。

### 5.3 $Render

用于动态渲染组件内容，基于 `__sui_render` 实现。

- **函数**：`$Render(comp, option)`
- **参数**：
  - `comp`：组件实例或选择器。
  - `option`：渲染选项（参考 `RenderOption`）。
- **类方法**：
  - `Exec(name, data)`：执行渲染，调用 `__sui_render`。
- **返回**：`__Render` 实例。

### 5.4 $Backend

用于发起后端 API 请求，基于 `__sui_backend_call` 实现。

- **函数**：`$Backend(route?, headers?)`
- **参数**：
  - `route`：API 路由（可选，默认使用当前路径）。
  - `headers`：请求头（可选）。
- **逻辑**：
  - 自动添加公共路径前缀（`s:public` 属性）。
  - 规范化路由，移除重复前缀。
- **类方法**：
  - `Call(method, ...args)`：调用指定方法，传递参数，返回 Promise。
- **返回**：`__Backend` 实例。

## 6. 扩展功能使用示例

### 6.1 $Store

```html
<div data:key="value" json:info='{"id": 1}'></div>
<script>
  const store = $Store('div');
  console.log(store.Get('key')); // 输出: value
  console.log(store.GetJSON('info')); // 输出: { id: 1 }
  store.Set('key', 'new-value');
  store.SetJSON('info', { id: 2 });
</script>
```

### 6.2 $Query

```html
<div class="test" data:key="value">
  <span class="child">Content</span>
</div>
<script>
  const query = $Query('.test');
  console.log(query.data('key')); // 输出: value
  query.addClass('active').on('click', () => console.log('Clicked'));
  const child = query.find('.child');
  console.log(child.html()); // 输出: Content
  child.html('New Content');
</script>
```

### 6.3 $Render

一般不直接使用此方法，而是通过使用`$Query`引用对象再调用render方法。

```html
<div s:cn="MyComponent" s:render="content"></div>
<script>
  const comp = $("div[s:cn='MyComponent']");
  const renderer = $Render(comp, { showLoader: true });
  renderer.Exec('content', { key: 'value' }).then((html) => console.log(html));
</script>
```

### 6.4 $Backend

```javascript
const backend = $Backend('/api/test');
backend.Call('getData', { id: 1 }).then((data) => console.log(data));
```

## 7. 扩展功能注意事项

- `$Store` 和 `$Query` 操作需确保目标元素存在。
- `$Query` 的 `json` 和 `prop` 方法在解析 JSON 时会捕获错误并记录日志。
- `$Backend` 的路由需正确配置，依赖服务器支持。
- 链式调用（如 `addClass`、`on`）需确保元素有效以避免空操作。

## 全局Yao对象

YAO Pure JavaScript SDK 是一个轻量级库，用于与服务器 API 交互，支持 HTTP 请求、令牌管理、Cookie 操作和查询参数序列化。初始化时需指定主机地址，适用于 GET、POST 和文件下载等操作。

### 构造函数`Yao(host)`

初始化 YAO SDK 实例。

- **参数**：
  - `host`（可选）：API 基础 URL，默认使用当前页面协议和主机加 `/api`（如 `http://example.com/api`）。
- **属性**：
  - `host`：API 请求的基础 URL。
  - `query`：从当前 URL 查询字符串解析的键值对对象。

## 方法

### `Get(path, params, headers)`

执行 HTTP GET 请求。

- **参数**：
  - `path`：API 路径（如 `/users`）。
  - `params`（可选）：查询参数对象。
  - `headers`（可选）：附加 HTTP 头对象。
- **返回**：Promise，解析为 JSON 或文本响应。

### `Post(path, data, params, headers)`

执行 HTTP POST 请求。

- **参数**：
  - `path`：API 路径。
  - `data`（可选）：请求体数据（JSON 序列化）。
  - `params`（可选）：查询参数对象。
  - `headers`（可选）：附加 HTTP 头对象。
- **返回**：Promise，解析为 JSON 或文本响应。

### `Download(path, params, savefile, headers)`

从 API 下载文件并触发浏览器下载。

- **参数**：
  - `path`：API 路径。
  - `params`（可选）：查询参数对象。
  - `savefile`：保存文件名（如 `data.csv`）。
  - `headers`（可选）：附加 HTTP 头对象。
- **行为**：从响应创建文件并触发下载，失败时显示提示。

### `Fetch(method, path, params, data, headers, isblob)`

底层 HTTP 请求方法（供 `Get`、`Post`、`Download` 使用）。

- **参数**：
  - `method`：HTTP 方法（如 `GET`、`POST`）。
  - `path`：API 路径。
  - `params`（可选）：查询参数。
  - `data`（可选）：请求体数据（JSON 序列化）。
  - `headers`（可选）：附加 HTTP 头。
  - `isblob`（可选）：若为 `true`，返回 Blob。
- **返回**：Promise，解析为 JSON、文本或 Blob。

### `Token()`

获取认证令牌。

- **返回**：从 `sessionStorage` 或 `__tk` Cookie 获取的令牌，若无则返回空字符串。

### `Cookie(cookieName)`

获取指定 Cookie 值。

- **参数**：
  - `cookieName`：Cookie 名称。
- **返回**：Cookie 值，若不存在返回 `null`。

### `SetCookie(cookieName, cookieValue, expireDays)`

设置 Cookie。

- **参数**：
  - `cookieName`：Cookie 名称。
  - `cookieValue`：Cookie 值。
  - `expireDays`（可选）：过期天数，默认 30 天。
- **行为**：设置带过期时间和 `/` 路径的 Cookie。

### `DeleteCookie(cookieName)`

删除指定 Cookie。

- **参数**：
  - `cookieName`：Cookie 名称。
- **行为**：将 Cookie 过期时间设为 1970 年 1 月 1 日以删除。

### `Serialize(obj)`

将对象序列化为 URL 查询字符串。

- **参数**：
  - `obj`：键值对对象。
- **返回**：URL 编码的查询字符串（如 `key1=value1&key2=value2`）。

## 使用示例

### 8.3.1 初始化 SDK

```javascript
// 指定主机
const yao = new Yao('https://api.example.com');
// 或使用默认主机
const yao = new Yao();
```

### 8.3.2 GET 请求

```javascript
async function fetchData() {
  try {
    const response = await yao.Get(
      '/users',
      { id: 123 },
      { 'Custom-Header': 'value' }
    );
    console.log(response);
  } catch (error) {
    console.error('获取数据失败:', error);
  }
}
fetchData();
```

### 8.3.3 POST 请求

```javascript
async function postData() {
  const payload = { name: '张三', email: 'zhangsan@example.com' };
  try {
    const response = await yao.Post('/users', payload, { limit: 10 });
    console.log(response);
  } catch (error) {
    console.error('提交数据失败:', error);
  }
}
postData();
```

### 8.3.4 下载文件

```javascript
async function downloadFile() {
  try {
    await yao.Download('/export', { format: 'csv' }, 'data.csv');
  } catch (error) {
    console.error('下载文件失败:', error);
  }
}
downloadFile();
```

### 8.3.5 Cookie 管理

```javascript
// 设置 Cookie
yao.SetCookie('user_id', '12345', 7);

// 获取 Cookie
const userId = yao.Cookie('user_id');
console.log('用户 ID:', userId);

// 删除 Cookie
yao.DeleteCookie('user_id');
```

### 8.3.6 获取令牌

```javascript
const token = yao.Token();
console.log('认证令牌:', token);
```

## 注意事项

- 自动在请求中添加 `Authorization: Bearer <token>` 头（若令牌存在）。
- `Fetch` 方法默认使用 `application/json` 作为 `Content-Type`。
- 使用 `fetch` API，支持 CORS 模式和重定向。
- 下载失败时显示简单提示。

## YAO AI Agent

YAO AI Agent SDK 是一个用于与 AI 代理交互的轻量级库，支持通过 EventSource 接收实时消息、处理事件和附件上传。初始化时需指定代理 ID 和配置选项，适用于实时聊天和 AI 交互场景。

## 数据结构

### `AgentMessage`

消息结构：

- `text`: 消息文本。
- `type`: 消息类型（如 `text`, `action`, `error`）。
- `done`: 是否完成。
- `is_neo`: 是否为 AI 消息。
- `assistant_id`, `assistant_name`, `assistant_avatar`: 代理信息。
- `props`: 附加属性。
- `tool_id`: 工具 ID。
- `new`, `delta`: 新消息或增量更新标志。
- `result`: 结果数据。
- `previous_assistant_id`: 前一代理 ID。

### `AgentInput`

输入类型：

- 字符串：直接文本。
- 对象：包含 `text` 和可选 `attachments`（`AgentAttachment` 数组）。

### `AgentAttachment`

附件结构：

- `name`, `url`, `type`, `content_type`, `bytes`, `created_at`, `file_id`: 附件信息。
- `chat_id`, `assistant_id`, `description`（可选）：关联信息。

### `AgentOption`

初始化选项：

- `host`（可选）：API 地址，默认 `/api/__yao/neo`。
- `token`: 认证令牌。
- `silent`（可选）：是否静默模式，默认 `false`。
- `history_visible`（可选）：是否显示历史记录，默认 `false`。
- `chat_id`（可选）：会话 ID。
- `context`（可选）：上下文对象。

## 类与方法

### `Agent`

AI 代理类，管理与 AI 的交互。

#### 构造函数

```typescript
constructor(assistant_id: string, option: AgentOption)
```

- 初始化代理，设置主机、令牌、事件处理器等。

#### `On(event, handler)`

注册事件处理器。

- **参数**：
  - `event`: 事件类型（`message` 或 `done`）。
  - `handler`: 回调函数（`MessageHandler` 或 `DoneHandler`）。
- **返回**：`Agent` 实例（支持链式调用）。
- **示例**：
  ```javascript
  agent.On('message', (msg) => console.log(msg.text));
  agent.On('done', (msgs) => console.log('完成', msgs));
  ```

#### `Cancel()`

取消当前事件流连接。

#### `Call(input, ...args)`

调用 AI 代理。

- **参数**：
  - `input`: 输入（字符串或包含文本和附件的对象）。
  - `args`: 附加参数。
- **返回**：Promise，解析为结果或抛出错误。
- **行为**：通过 EventSource 接收实时消息，触发 `message` 和 `done` 事件。

#### `makeChatID()`

生成唯一会话 ID（格式：`chat_[时间戳]_[随机字符串]`）。

## 使用示例

### 9.3.1 初始化代理

```javascript
const agent = new Agent('assistant123', {
  host: '', //默认会调用/api/__yao/neo，或是指定主机,
  token: new yao().Token(), //"your_token",
  silent: false,
  history_visible: true,
  context: { user: 'test' }
});
```

### 9.3.2 注册事件

```javascript
//注册事件处理函数，监听消息事件和完成事件。
agent.On('message', (msg) => {
  console.log('收到消息:', msg.text, msg.type);
});
agent.On('done', (msgs) => {
  console.log('会话完成:', msgs);
});
```

### 9.3.3 调用代理（文本输入）

```javascript
async function callAgent() {
  try {
    const result = await agent.Call('你好，AI！');
    console.log('结果:', result);
  } catch (error) {
    console.error('错误:', error.message);
  }
}
callAgent();
```

### 9.3.4 调用代理（带附件）

```javascript
async function callWithAttachment() {
  const input = {
    text: '处理这个文件',
    attachments: [
      {
        name: 'doc.pdf',
        url: 'https://example.com/doc.pdf',
        type: 'file',
        content_type: 'application/pdf',
        bytes: 1024,
        created_at: '2025-05-28T09:00:00Z',
        file_id: 'file123'
      }
    ]
  };
  try {
    const result = await agent.Call(input);
    console.log('结果:', result);
  } catch (error) {
    console.error('错误:', error.message);
  }
}
callWithAttachment();
```

### 9.3.5 取消会话

```javascript
agent.Cancel();
```

## 注意事项

- 使用 EventSource 实现实时消息流。
- 自动处理认证令牌和错误（如 401、403、500 等）。
- 支持增量消息更新（`delta`）和新消息（`new`）。
- 错误信息通过 `message` 事件返回，类型为 `error`。

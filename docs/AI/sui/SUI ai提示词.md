# SUI 模板开发指南

:::v-pre

## 项目结构详解

一个完整的 SUI 项目包含以下核心部分：

### 1. 基础配置文件

```json
project_root/
├── app.yao                    # 应用配置文件，包含路由规则
├── suis/
│   └── web.sui.yao           # SUI 模板配置
└── data/
    └── templates/            # 模板根目录
        └── default/          # 默认模板目录
```

### 2. 项目目录结构:

这是一个项目示例，项目结构如下：

```sh
app.yao                             #项目配置文件,app.yao文件中路由配置信息,控制整个网站的路由重定向配置。
suis/
└── web.sui.yao                     #web默认模板的存储，目录映射配置文件
data/
└── templates/                      #模板目录，每个模板对应一个目录
    └── default/                    #web默认模板，模板id是default，一套模板可以有多个组件。
        └── [item]/                 #动态路由组件目录
            ├── [item].html         #组件HTML模板
            ├── [item].json         #组件配置文件
            ├── [item].ts           #组件前端脚本
            ├── [item].css          #组件样式
            └── [item].backend.ts   #组件后端脚本
        ├── component_name/               #todolist组件，每一个组件对应一个目录
        │   ├── component_name.html       #定义组件的结构
        │   ├── component_name.json       #定义组件的页面共用数据
        │   ├── component_name.ts         #组件的前端逻辑
        │   ├── component_name.css        #组件的样式
        │   ├── component_name.config     #页面配置
        │   └── component_name.backend.ts #组件的后端逻辑
        ├── __assets/               #公共资源目录，通过 `import '@assets/style.css'` 引用
        ├── __data.json             #模板级全局数据，所有组件可通过 `{{ globalData }}` 访问
        └── __document.html         #所有页面的基础 HTML 骨架，包含 `<head>` 和 `<body>` 结构
```

### 3. 组件目录结构

每个组件目录都遵循以下结构：

```json
component_name/
├── component_name.html        # 组件模板
├── component_name.css         # 组件样式
├── component_name.ts          # 前端 TypeScript
├── component_name.json        # 组件数据配置
├── component_name.config      # 组件配置
└── component_name.backend.ts  # 后端 TypeScript
```

SUI其它的配置文件，比如：suis目录下的配置文件与app.yao文件中路由配置信息。
`suis/web.sui.yao`配置如下：

```json
{
  "name": "Yao Demo App",
  "storage": {
    "driver": "local", //只支持local
    "option": {
      "root": "/templates" //模板的根目录，相对于项目数据根目录/data/templates。
    }
  },
  "public": {
    "root": "/" //在yao sui build阶段编译生成文件的保存根据目录，默认在public/目录下，可使用{{$session.xxx}}引用会话信息
  }
}
```

## todolist项目示例：

这是一个简单的todolist项目示例，演示了如何使用SUI构建一个简单的todolist应用。

### 文件列表：

### todolist.html：

- 定义组件的结构和样式
- `s:render`标识需要动态渲染的区域
- `s:for`绑定需要渲染的变量

```html
<!-- data/templates/default/todolist/todolist.html -->
<div class="todolist-container">
  <h2 s:trans>Todo List</h2>
  <div class="todo-input">
    <input
      type="text"
      id="todo-input"
      placeholder="Add a new todo"
      s:trans="placeholder"
    />
    <button s:on-click="addTodo" s:trans>Add</button>
  </div>
  <ul class="todo-list" s:render="todo-list">
    <li
      s:for="todos"
      s:for-item="todo"
      class="todo-item"
      s:class="{{ todo.completed ? 'completed' : '' }}"
    >
      <input
        type="checkbox"
        s:data-id="{{ todo.id }}"
        s:attr-checked="todo.completed"
        s:on-click="toggleTodo"
      />
      <span>{{ todo.text }}</span>
      <button s:data-id="{{ todo.id }}" s:on-click="deleteTodo" s:trans>
        Delete
      </button>
    </li>
  </ul>
</div>
```

### todolist.css：

- 定义组件的样式，使用正常的css语法。

```css
/* data/templates/default/todolist/todolist.css */
```

### todolist.json：

- 使用`$`修饰的key,并且`@`修改的value,会调用后端脚本中的函数。
- 使用`$`修饰的key,会调用Yao处理器，比如`scripts.lib.process`。

```json
{
  "$todos": "@GetTodos", //调用后端脚本中的函数，初始化组件的状态
  "title": "Todo List"
}
```

### todolist.ts：

- 使用`$Backend`来调用后端脚本中的函数。
- `__sui_data`是一个页面渲染完成后注入全局变量，包含了页面的所有数据。
- 使用`self.render`调用服务器api返回渲染后的组件。

```ts
/* data/templates/default/todolist/todolist.ts */
import {
  Component,
  EventData,
  EventDetail,
  $Backend,
  __sui_data
} from '@yao/sui';
const self = this as Component;
// Initialize component state
self.once = async function () {
  // Initial props of todos
  self.store.SetJSON('todos', __sui_data['todos']);
};
// Add a new todo
self.addTodo = async (event: Event, data: EventData, detail: EventDetail) => {
  const input = self.$root.find('#todo-input').elm() as HTMLInputElement;
  const text = input.value.trim();
  if (!text) return;
  // Call backend to add todo
  const newTodo = await $Backend('/todolist').Call('AddTodo', text);
  if (newTodo) {
    const todos = self.store.GetJSON('todos') || [];
    todos.push(newTodo);
    self.store.SetJSON('todos', todos);
    await self.render('todo-list', { todos });
    input.value = ''; // Clear input
  }
};

// Toggle todo completion status
self.toggleTodo = async (
  event: Event,
  data: EventData,
  detail: EventDetail
) => {
  const id = data['id'];
  const todos = self.store.GetJSON('todos') || [];
  const todo = todos.find((t: any) => t.id === id);
  if (todo) {
    const updatedTodo = await $Backend('/todolist').Call('ToggleTodo', id);
    if (updatedTodo) {
      todo.completed = updatedTodo.completed;
      self.store.SetJSON('todos', todos);
      await self.render('todo-list', { todos });
    }
  }
};

// Delete a todo
self.deleteTodo = async (
  event: Event,
  data: EventData,
  detail: EventDetail
) => {
  const id = data['id'];
  const success = await $Backend('/todolist').Call('DeleteTodo', id);
  if (success) {
    const todos = (self.store.GetJSON('todos') || []).filter(
      (t: any) => t.id !== id
    );
    self.store.SetJSON('todos', todos);
    await self.render('todo-list', { todos });
  }
};
```

### todolist.backend.ts：

- 后端脚本，在服务器上执行.
- 如果是暴露成API，需要使用`Api`修饰。
- 每一次Api调用，脚本都会被重新加载，不要使用全局变量来保存持久性数据。
- `BeforeRender`方法只会在当成组件使用时才会被调用。

```ts
/* data/templates/default/todolist/todolist.backend.ts */
import {
  Process,
  Exception,
  $L,
  FS,
  http,
  log,
  Query,
  Store,
  Studio,
  WebSocket
} from '@yaoapps/client';
import { Request } from '@yao/sui';
let todos: Array<{ id: string; text: string; completed: boolean }> = undefined;
let idCounter = 1;
function Init() {
  todos = new Store('cache').Get('todos') || [];
  idCounter = todos.length + 1;
}
function Save() {
  new Store('cache').Set('todos', todos);
}
function getTodos() {
  const cache = new Store('cache');
  return cache.Get('todos') || [];
}
// Fetch all todos
// 页面渲染时，在todolist.json中引用，会调用此函数
function GetTodos(r: Request) {
  Init();
  return todos;
}
// Add a new todo，前端调用AddTodo方法时，会调用此函数
function ApiAddTodo(text: string) {
  Init();
  const newTodo = {
    id: (idCounter++).toString(),
    text,
    completed: false
  };
  todos.push(newTodo);
  Save();
  return newTodo;
}
// Toggle todo completion
function ApiToggleTodo(id: string) {
  Init();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    console.log('ApiToggleTodo todos', todos);
    Save();
    return todo;
  }
  return null;
}
// Delete a todo
function ApiDeleteTodo(id: string) {
  Init();
  const index = todos.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos.splice(index, 1);
    Save();
    return true;
  }
  return false;
}

// Initialize some sample todos
function BeforeRender(request: sui.Request, props: any) {
  Init();
  if (todos.length === 0) {
    todos = [
      { id: '1', text: 'Learn SUI', completed: false },
      { id: '2', text: 'Build TodoList', completed: true }
    ];
    idCounter = 3;
  }
  Save();
  return {
    todos
  };
}
```

## 核心文件详解

### 1. \_\_document.html

基础 HTML 模板文件，定义整个应用的 HTML 结构：

```html
<!DOCTYPE html>
<html>
  {{ __page }}
</html>
```

### 2. \_\_data.json

全局数据配置文件：

```json
{
  "title": "应用名称",
  "description": "应用描述",
  "globalSettings": {
    "theme": "light",
    "language": "zh-CN"
  }
}
```

#### 组件数据配置文件 (.json)

- SUI页面使用了SSR技术，在服务器端渲染过程，会读取数据配置文件`component_name.json`获取渲染数据数据
- 动态数据使用`$key:@functionName`的方式来调用后端脚本`.backend.ts`中的函数。
- 静态数据可以直接在JSON文件中定义。
  ```json
  {
    "$catalog": "@Catalog",
    "name": "John Doe"
  }
  ```

## 组件开发规范

### 1. 命名规范

- 组件目录名：使用小写字母，多词使用连字符（kebab-case）
- 文件命名：与目录名保持一致
- 组件 ID：使用驼峰命名（camelCase）

### 2. 模板语法规范

#### HTML 模板 (.html)

### 3. HTML 模板 (.html)

- 每个网页应该由单独的纯 HTML、CSS 和 TypeScript 文件组成。使用相同的名称但不同的扩展名（例如，`component_id.html`、`component_id.css`、`component_id.ts`）。
- 避免使用框架或库。如果需要，通过 script 标签导入库。
- 渲染逻辑将由SUI模板引擎处理，所以你不需要实现它。使用 JS 文件来处理动画。
- 对于第三方库，在 JS 文件中使用 `import '<CDN 链接>';` 包含 CDN 链接。
- HTML 内容应该排除 `<head>` 和 `<body> `标签；这些由 SUI 引擎添加。
- 分离通用 CSS 文件以保持一致的样式，如果需要，使用 `import '@assets/[name].css';` 将它们导入到 CSS 文件中。
- 组件特定的CSS保存在与组件相同的文件夹中，例如：`component_id.css`,此文件不需要显式引用对应的html文件，由框架自动注入。
- 为了保持一致性，使用与模型字段相同的 CSS 类名和 ID。
- 每个文件应该用代码块包裹，顶部注释文件名。
- 在 HTML 标签内使用 `{{ variable }}` 语法进行数据渲染。
- 使用 `s:for` 遍历数据列表，例如，`<div s:for="items" s:for-item="pet"> <span>{{ pet.name }}</span> </div>`。
- 使用 `s:if`,`s:elif`,`s:else` 进行条件渲染，例如，`<span s:if="pet.name">{{ pet.name }}</span>`。
- 文件系统路由定义网页路由。例如，`index.html` 映射到 `/`，`about.html` 映射到 `/about`。
- 动态路由用 `[id]` 表示，例如，`/pet/1`，`/pet/2` 是 `/[id]`。
- 使用 `s:on-click` 进行事件绑定，例如，`<button s:on-cli ck="handleClick" s:data-id="{{ pet.id }}">点击</button>`。
- 在处理布尔类型属性时，比如 `disabled`, `checked`, `selected`,`required`。如果使用到表达式时，需要使用`s:attr-`进行修饰，
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == true` 会渲染成`<input type="checkbox" checked />`。
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == false`会渲染成`<input type="checkbox"/>`。
- 组件引用使用 `is` 属性，例如，`<div is="/pet/"></div>`。
- 子组件使用表达式`{% %}`渲染父组件传递的属性信息
- 父组子可以使用`slot`来渲染子组件的内容
  子组件：
  ```html
  <!-- layout.html -->
  <div>
    <header></header>
    <content></content>
    <footer></footer>
  </div>
  ```
  父组件：
  ```html
  <!-- /index.html -->
  <div is="components/layout">
    <slot name="header">自定义头部</slot>
    <slot name="content">自定义内容</slot>
    <slot name="footer">自定义底部</slot>
  </div>
  ```

```html
<div class="component-container">
  <!-- 数据绑定 -->
  <h1>{{ title }}</h1>

  <!-- 父组件的属性传递 -->
  <h1>{% name %}</h1>

  <!-- 条件渲染 -->
  <div s:if="condition">条件内容</div>

  <!-- 列表渲染 -->
  <ul>
    <li s:for="items" s:for-item="item">{{ item.name }}</li>
  </ul>

  <!-- 事件绑定 -->
  <button
    s:on-click="handleClick"
    s:data-id="{{ id }}"
    s:json-data="{{ complexData }}"
  >
    点击
  </button>

  <!-- 动态渲染区域 -->
  <div s:render="content-area">动态内容</div>

  <!-- 组件引用 -->
  <div is="/other-component">
    <slot name="content">默认内容</slot>
  </div>
</div>
```

#### 页面渲染安全规则

- `{{ }}` `{% %}`表达式自动转义 HTML 特殊字符
- 需要渲染原始 HTML 时使用 `s:raw` 指令：
  ```html
  <div s:raw="true">{{ rawContent }}</div>
  ```

#### 多语言支持：

- 使用 `s:trans` 属性标记需要翻译的静态文本：
  ```html
  <div s:trans>需要翻译的文本</div>
  ```
- 使用 `::` 修饰符标记需要翻译的变量：
  ```html
  <div>{{ "::hello world" }}</div>
  ```
- 在脚本中使用 `__m` 函数进行翻译：
  ```ts
  console.log(__m('hello') + name);
  ```

#### 样式文件 (.css)

```css
/* 组件样式 */
.component-container {
  /* 使用 BEM 命名规范 */
  &__header {
  }
  &__content {
  }
  &__footer {
  }

  /* 状态类 */
  &--active {
  }
  &--disabled {
  }
}

/* 导入共享样式 */
@import '@assets/css/common.css';
```

#### 前端脚本 (.ts)

## 前端脚本:

- 脚本文件的内容为一个TypeScript模块,只需要在ts文件中增加业务处理逻辑，引擎会自动导出组件并注入前端页面并与组件关联。
- 在前端可以使用`$Backend`来调用后端脚本`backend.ts`中的函数，但是所有在后端暴露出来的函数需要以默认前端`Api`进行修饰。
- 组件初始化时会自动注入以下功能：
  - `__sui_data`是一个页面渲染完成后注入全局变量，包含了页面的所有数据。
  - `root`：组件的根HTML元素。
  - `store`：Yao框架提供的存储对象，用于管理组件状态。
  - `state`：状态管理对象，用于设置和获取组件状态。
  - `props`：属性管理对象，用于读取组件的属性。
  - `$root`：基于`__Query`的根节点查询对象。
  - `find(selector)`：查询匹配选择器的第一个元素，返回`__Query`对象。
  - `query(selector)`：查询匹配选择器的第一个DOM元素。
  - `queryAll(selector)`：查询所有匹配选择器的DOM元素。
  - `render(name, data, option)`：根据模板名称和数据在服务器端渲染内容并更新前端页面局部内容。
  - `emit(name, data)`：触发指定名称的自定义事件，并传递数据。
  - `once`：可选的初始化钩子函数，仅在组件首次初始化时执行。

```ts
import { Component, EventData, EventDetail } from '@yao/sui';
const self = this as Component;
// 组件初始化
self.once = async function () {
  // 初始化逻辑
};

// 事件处理
self.handleClick = async (
  event: Event,
  data: EventData,
  detail: EventDetail
) => {
  // 获取数据
  const id = data['id'];
  const complexData = data['json-data'];
  // 调用后端
  const result = await $Backend('/path').Call('Method', id);
  // 更新状态
  self.store.SetJSON('key', result);
  // 重新渲染
  await self.render('content-area', { data: result });
};

self.process = function () {
  //选择子对象并进行操作
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
  });
  //hide selected item
  $Query(el).find('[checked]')?.addClass('hidden');
  //获取组件的属性，属性是只读的，不能修改。
  const api = self.props.Get('api');
  //列出所有的属性
  const api = self.props.List();
  //给组件增加css样式
  self.$root.addClass('hidden');
};
// 动态更新
self.update = function () {
  //调用blog.html对象的blog.backend.ts中的ApiGetArticles方法
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);
  // Render articles
  // render是一个异步函数，需要使用await来修饰
  await self.render('articles', { articles });
};
// 状态监听
self.watch = {
  stateKey: (newValue) => {
    // 状态变化处理
  }
};
```

## 浏览器里SUI组件状态管理：

- 组件有两种状态管理方式：
  - `store`：用于管理组件自身状态，使用HTML自定义属性存储数据。
  - `state`：用于组件间通信，支持状态变化事件传播。
- 使用 `store` 管理组件状态：

  ```ts
  //使用store来保存状态，
  //注意Set方法只能用于保存非对象类型的对象
  self.store.Set('key', value); // 设置状态
  const value = self.store.Get('key'); // 获取状态

  //保存复杂类型的对象需要使用SetJSON方法。
  self.store.GetJSON('item');
  self.store.SetJSON('item', { ...item, selected: false });
  ```

- 跨组件状态监听：

  ```ts
  // 组件A
  self.state.Set('theme', 'dark');

  // 组件B
  self.watch = {
    theme: (newVal) => {
      document.body.className = newVal;
    }
  };
  ```

### 3. 组件通信模式

## 父子组件通信

- 父子组件通信：
  - 父组件通过 `props` 向子组件传递数据：
    ```html
    <child-component data="{{ parentData }}"></child-component>
    ```
  - 子组件通过`{% %}`表达式引用父组件数据：
    ```html
    <p>{% data %}</p>
    ```
  - 子组件通过 `emit` 向父组件发送事件：
    ```ts
    self.emit('custom-event', { data: 'value' });
    ```
- 组件间状态共享：
  - 使用 `state` 进行状态管理
  - 通过 `watch` 监听状态变化
  - 使用 `state.Set` 触发状态更新

```html
<!-- 父组件 -->
<div
  is="child-component"
  data="{{ parentData }}"
  s:on-custom-event="handleCustomEvent"
></div>

<!-- 子组件 -->
<div>
  <span>{{ data }}</span>
  <button s:on-click="emitEvent">触发事件</button>
</div>
```

```typescript
// 子组件脚本
self.emitEvent = () => {
  self.emit('custom-event', { data: 'value' });
};
```

## 前端脚本工具类：

- 通知http对象Yao,通过API的方式请求后台数据：
  ```ts
  // 创建一个新的Yao实例
  const yao = new Yao();
  // 发送GET请求到指定路径
  const rest = await yao.Get('/api/path', params, headers);
  // 发送POST请求到指定路径
  const rest = await yao.Post('/api/path', { key: 'value' }, params, headers);
  // savefile filename to save
  // 下载文件到指定路径
  await yao.Download('/api/path', params, savefile, headers);
  ```
- 使用 `s:on-` 绑定后端事件处理,使用`s:data-`传递简单参数，使用`s:json-`传递复杂参数

  ```html
  <button
    s:on-click="Process"
    s:data-xx="arg1"
    ,s:data-xy="arg2"
    ,s:json-obj="{{ {} }}"
  >
    处理
  </button>
  ```

## 前端页面局部渲染：

- 在页面中使用 `s:render` 属性标记可动态更新的区域：
  ```html
  <div s:render="content"></div>
  ```
- 如果需要局部更新组件，在前端`组件.ts`中调用 `render` 方法更新内容：
  ```ts
  //调用服务器api在服务器端渲染组件，返回html内容
  await self.render(
    'content', // 关联的渲染的区域s:render="content"
    { data: 'value' }, // 模板渲染需要的数据
    {
      showLoader: true, // 显示加载状态
      replace: true, // 替换内容
      withPageData: true // 包含页面数据
    }
  );
  ```

## 后端脚本 (.backend.ts)

- 后端脚本中的函数不要使用export导出，因为后端脚本是在node环境中执行的，不能使用export导出。
- 每个组件可以包含一个后端脚本文件,后缀名是`.backend.ts`，用于实现组件在服务器端的逻辑。
- 脚本文件的内容为一个TypeScript模块，只需要在ts文件中增加业务处理逻辑，引擎在页面渲染过程中自动调用相关函数。
- 当一个组件被当成子组件被调用时，组件的函数`BeforeRender`会被调用,接收父组件的属性传递值，函数返回处理过的数据并且保存在当前组件的属性`json:__component_data`中，前端脚本调用`const props = self.store.GetData()`可读取。
- 前后端脚本常量数据共享，在脚本`.backend.ts`中定义一个常量`Constants`,在前端脚本`.ts`中可以使用`self.Constants`来读取。

```typescript
import { Request } from '@yao/sui';

// 组件渲染前处理
// props是父组件传递的属性列表
function BeforeRender(request: Request, props: any) {
  return {
    // 返回组件初始数据
    data: {}
  };
}

// API 方法
function ApiMethod(param: any) {
  // 处理逻辑
  return {
    result: 'success'
  };
}

// 数据处理方法,可以json配置文件中使用@ProcessData调用
function ProcessData(data: any) {
  // 数据处理逻辑
  return processedData;
}

/**
 * 组件常量
 * 这个对象将在后端和前端脚本之间共享
 * 这里不能使用任何后端代码或函数，只能使用静态数据
 */
const Constants = {
  // 常量属性
};
```

## URL路由配置

- 如果增加增加了新的路由，并且路由中包含了动态参数或是动态文件名，需要按以下的规则更新文件`app.yao`文件中的路由配置。
- 在`app.yao`配置文件中，通过`public.rewrite`字段配置重定向规则。以下是一个完整配置示例，包含详细注释：

  ```json
  {
    "public": {
      // 基础配置
      "disableGzip": false, // 是否禁用Gzip压缩
      "sourceRoots": { "/public": "/data/templates/default" }, // 开发模式下的源文件映射
      // 重定向规则（按优先级从高到低排序）
      "rewrite": [
        // 静态资源路由
        { "^\\/assets\\/(.*)$": "/assets/$1" }, // 匹配/assets/下的所有请求，保持原路径
        // 内容页面路由（带命名参数）
        { "^\\/category\\/(.*)\\/(.*)$": "/$2/$1.sui" },
        { "^\\/product\\/(.*)$": "/detail/[pid].sui" },
        { "^\\/(.*)\\/(.*)$": "/[$1]/[id].sui" },
        // 默认路由规则（必须放在最后）
        { "^\\/(.*)$": "/$1.sui" } // 为所有路径添加.sui后缀
      ]
    }
  }
  ```

  **位置参数** (`$1`, `$2`等)：

  ```json
  { "^\\/category\\/(.*)\\/(.*)$": "/$2/$1.sui" }
  ```

  - 访问`/category/books/123` → 重定向到`public/123/books.sui`
  - `$1`匹配"books"，`$2`匹配"123"

  **命名参数** (`[param]`)：

  ```json
  { "^\\/product\\/(.*)$": "/detail/[pid].sui" }
  ```

  - 访问`/product/abc123` → 重定向到`public/detail/[pid].sui`
  - 参数存入`request.params.pid = "abc123"`

  **混合使用**：

  ```json
  { "^\\/(.*)\\/(.*)$": "/[$1]/[id].sui" }
  ```

  - 访问`/user/123` → 重定向到`public/[user]/[id].sui`
  - 参数存入：
    ```js
    request.params = {
      user: 'user', // 来自$1
      id: '123' // 来自$2
    };
    ```

### 3. 页面配置文件 (.config)

可选配置，`.config`文件格式为json, 通过 `.config` 文件单独配置额外的参数，常见配置项如下表所示：

| 配置项      | 类型   | 说明                                                                   | 示例/默认值 |
| ----------- | ------ | ---------------------------------------------------------------------- | ----------- |
| title       | string | 页面标题，对应 `<title />`                                             | "页面标题"  |
| guard       | string | 页面访问认证方式及认证失败跳转地址，支持 `bearer-jwt`、`cookie-jwt` 等 | ""          |
| cacheStore  | string | 页面缓存所需的 store id，需在 stores 配置，常用于 Redis 等             | ""          |
| cache       | number | 页面模板缓存时间（秒）                                                 | 12          |
| root        | string | 页面请求前缀，相对于 public 根目录，通常无需配置                       | ""          |
| dataCache   | number | 页面请求数据缓存时间（秒）                                             | 0           |
| description | string | 页面描述，meta[name=description]                                       | ""          |
| seo         | object | SEO 相关配置，见下方详细说明                                           | {...}       |
| api         | object | 后端 API 配置，见下方详细说明                                          | {...}       |

#### API 调用安全性（apiguard）

如果 API 涉及动态数据的保存，建议配置 `apiguard`，可选值如下：

- `bearer-jwt`
- `query-jwt`
- `cookie-jwt`
- `cookie-trace`

#### 缓存相关

建议在正式环境启用缓存以提升性能，可通过 `cacheStore` 指定缓存存储（如 Redis），并设置 `cache` 和 `dataCache` 时间。

**禁用缓存方式：**

- 请求 URL 中添加参数 `__debug=true`
- 请求 URL 中添加参数 `__sui_disable_cache=true`
- 请求头中包含 `Cache-Control=no-cache`

#### SEO 配置（seo）

| 字段        | 说明                      |
| ----------- | ------------------------- |
| title       | meta[property='og:title'] |
| description | meta[name=description]    |
| keywords    | meta[name=keywords]       |
| image       | meta[property='og:image'] |
| url         | meta[property='og:url']   |

#### API 配置（api）

| 字段         | 说明                                                          |
| ------------ | ------------------------------------------------------------- |
| prefix       | 后端脚本中暴露的 API 函数前缀，默认 "Api"                     |
| defaultGuard | API 默认的 guard 配置，所有 API 函数共用，空或 "-" 表示不验证 |
| guards       | 针对每个方法单独配置 guard，例如 `{ "method": "bearer-jwt" }` |

```json
{
  "title": "页面标题", //页面<title />
  // guard=cookie-jwt:redirect-url redirect to the url if not authorized
  // guard=cookie-jwt return {code: 403, message: "Not Authorized"}
  "guard": "", //配置页面访问认证以及认证失败后跳转的地址
  "cacheStore": "", //配置页面缓存所需要的store id,需要配置stores
  "cache": 12, //页面模板缓存保存的时间长度，以秒为单位
  "root": "", //默认是/，页面在请求中的前缀，相对于public根目录，不需要配置，编译过程中会复制文件web.sui.yao中的public/root
  "dataCache": 0, //页面请求中的数据缓存保存时间长度，以秒为单位
  "description": "", //meta[name=description]
  "seo": {
    //搜索相关配置
    "title": "标题", //meta[property='og:title']
    "description": "长描述", //meta[name=description]
    "keywords": "", //关键字meta[name=keywords]
    "image": "", //图片meta[property='og:image']
    "url": "" //访问地址meta[property='og:url']
  },
  "api": {
    //后端脚本中每一个Api方法可以设置单独的guard配置
    "prefix": "Api", //后端脚本中暴露的api函数的前缀
    "defaultGuard": "", //api默认的guard配置，所有的api函数共用，设置为空或是-不会进行身份验证，，
    "guards": {
      "method": "bearer-jwt"
    }
  }
}
```

## 构建与部署：

- 使用 `yao sui build web default` 命令构建前端页面,使用`-D`参数使用调试模型，避免缓存。使用`-d ::{}`传入会话信息。
- 使用 `yao sui watch web default` 命令实时预览修改
- 使用 `yao sui trans web default` 命令生成多语言文件
- 使用 `yao start` 命令启动本地开发服务器

## sui项目中的类型定义

```ts
export interface Request {
  method: string;
  asset_root?: string;
  referer?: string;
  payload?: Record<string, any>;
  query?: Record<string, string[]>;
  params?: Record<string, string>;
  headers?: Record<string, string[]>;
  body?: any;
  url?: URL;
  sid?: string;
  theme?: string;
  locale?: string;
}

export interface URL {
  host?: string;
  domain?: string;
  path?: string;
  scheme?: string;
  url?: string;
}
// Global data and utilities
declare const __sui_data: Record<string, any>;
declare function __m(message: string): string;
declare const arguments: any[];

// Headers for requests
type Headers = Record<string, string | string[]>;

// Locale configuration
interface Locale {
  name?: string;
  keys?: Record<string, string>;
  messages?: Record<string, string>;
  direction?: 'ltr' | 'rtl';
  timezone?: string;
}

// UI Component
type Component = {
  root: HTMLElement;
  state: { Set: (key: string, value?: any) => void };
  store: ComponentStore;
  $root: SUIQuery; //注意与root的区别
  find: (selector: string | HTMLElement) => SUIQuery | null;
  query: (selector: string) => HTMLElement | null;
  queryAll: (selector: string) => NodeListOf<Element> | null;
  emit: (name: string, detail?: EventData) => void;
  render: (
    name: string,
    data: Record<string, any>,
    option?: RenderOption
  ) => Promise<string>;
  once?: () => void;
  watch?: Record<string, (value?: any) => void>;
  Constants?: Record<string, any>;
  [key: string]: any;
};

// Render options
type RenderOption = {
  target?: HTMLElement;
  showLoader?: HTMLElement | string | boolean;
  replace?: boolean;
  withPageData?: boolean;
};

// Component store
type ComponentStore = {
  Get: (key: string) => string;
  Set: (key: string, value: string) => void;
  GetJSON: (key: string) => any;
  SetJSON: (key: string, value: any) => void;
  GetData: () => Record<string, any>;
};

// Component utilities
declare const $$: (selector: HTMLElement | string) => Component;
declare function $Render(
  component: Component | string,
  option?: RenderOption
): SUIRender;
declare function $Store(selector: HTMLElement | string): ComponentStore | null;
declare function $Query(selector: string | HTMLElement): SUIQuery;

// Event data
type EventDetail<T = HTMLElement> = {
  rootElement: HTMLElement;
  targetElement: T;
};
type EventData = Record<string, any>;
type State = { target: HTMLElement; stopPropagation(): void };

// SUIQuery for DOM manipulation
class SUIQuery {
  selector: string | Element;
  element: Element | null;
  elements: NodeListOf<Element> | null;
  constructor(selector: string | Element);
  each(callback: (element: SUIQuery, index: number) => void): void;
  elm(): Element | null;
  elms(): NodeListOf<Element> | null;
  find(selector: string): SUIQuery | null;
  closest(selector: string): SUIQuery | null;
  on(event: string, callback: (event: Event) => void): SUIQuery;
  $$(): Component | null;
  store(): ComponentStore | null;
  attr(name: string): string | null;
  data(name: string): string | null;
  json(name: string): any | null;
  hasClass(className: string): boolean;
  prop(name: string): any | null;
  removeClass(className: string | string[]): SUIQuery;
  toggleClass(className: string | string[]): SUIQuery;
  addClass(className: string | string[]): SUIQuery;
  html(html?: string): SUIQuery | string;
}

// Backend API handler
declare function $Backend<T = any>(
  route?: string,
  headers?: Headers
): SUIBackend<T>;
class SUIBackend<T = any> {
  constructor(route?: string, headers?: Headers);
  Call(method: string, ...args: any): Promise<T>;
}

// YAO API client
class Yao {
  constructor(host?: string);
  Get(path: string, params?: object, headers?: Headers): Promise<any>;
  Post(
    path: string,
    data?: object,
    params?: object,
    headers?: Headers
  ): Promise<any>;
  Download(
    path: string,
    params: object,
    savefile: string,
    headers?: Headers
  ): Promise<void>;
  Fetch(
    method: string,
    path: string,
    params?: object,
    data?: object,
    headers?: Headers,
    isblob?: boolean
  ): Promise<any>;
  Token(): string;
  Cookie(cookieName: string): string | null;
  SetCookie(cookieName: string, cookieValue: string, expireDays?: number): void;
  DeleteCookie(cookieName: string): void;
}

// Agent messaging
interface AgentMessage {
  text: string;
  type?: string;
  done?: boolean;
  is_neo?: boolean;
  assistant_id?: string;
  assistant_name?: string;
  assistant_avatar?: string;
  props?: Record<string, any>;
  tool_id?: string;
  new?: boolean;
  delta?: boolean;
  result?: any;
  previous_assistant_id?: string;
}

type AgentDoneData = AgentMessage[];
interface MessageHandler {
  (message: AgentMessage): void;
}
interface DoneHandler {
  (messages: AgentDoneData): void;
}
type AgentEvent = 'message' | 'done';
interface EventHandlers {
  message?: MessageHandler;
  done?: DoneHandler;
}

// Agent class
class Agent {
  constructor(assistant_id: string, option: AgentOption);
  private makeChatID(): string;
  On<E extends AgentEvent>(
    event: E,
    handler: E extends 'message' ? MessageHandler : DoneHandler
  ): Agent;
  Cancel(): void;
  Call(input: AgentInput, ...args: any[]): Promise<any>;
}

// Agent input and options
interface AgentAttachment {
  name: string;
  url: string;
  type: string;
  content_type: string;
  bytes: number;
  created_at: string;
  file_id: string;
  chat_id?: string;
  assistant_id?: string;
  description?: string;
}

type AgentInput = string | { text: string; attachments?: AgentAttachment[] };

interface AgentOption {
  host?: string;
  token: string;
  silent?: boolean | string | number;
  history_visible?: boolean | string | number;
  chat_id?: string;
  context?: Record<string, any>;
}
```

:::

# SUI 模板开发

:::v-pre

SUI是一套基于服务器端生成SSR页面的模型渲染引擎框架，它的核心思想是：

- 一套模板包含不同的SUI组件页面。
- 组件由纯HTML、CSS和TypeScript文件组成。

在以下的文档中，使用`component_id` 来表示组件id。

## SUI组件:

- 每一个sui组件表示一个单独的文件夹，文件夹名称为组件名称，例如：`component_id`，不同的组件使用不同的文件夹名称。如果是一个动态组件，使用`[id]`表示，例如：`[id]`，其中id表示是url请求中的动态参数。
- 每个组件可以包含以下文件：
  - `component_id.html`：组件的HTML模板，必须的。
  - `component_id.css`：组件的CSS样式，可选。
  - `component_id.ts`：组件的在浏览器中运行的前端TypeScript代码，可选。
  - `component_id.json`: 组件的JSON配置文件，可选。
  - `component_id.backend.ts`：组件在服务器后端的运行的TypeScript代码，可选。
- 目录结构反应了路由请求的层级结构，例如：比如请求路径`pet/[id]` 对应文件系统路径`pet/[id]/component_id.html`。

## SUI组件的HTML模板的指南：

- 每个网页应该由单独的纯 HTML、CSS 和 TypeScript 文件组成。使用相同的名称但不同的扩展名（例如，`component_id.html`、`component_id.css`、`component_id.ts`）。
- 避免使用框架或库。如果需要，通过 script 标签导入库。
- 渲染逻辑将由SUI模板引擎处理，所以你不需要实现它。使用 JS 文件来处理动画。
- 对于第三方库，在 JS 文件中使用 `import '<CDN 链接>';` 包含 CDN 链接。
- HTML 内容应该排除 `<head>` 和 `<body> `标签；这些由 SUI 引擎添加。
- 分离通用 CSS 文件以保持一致的样式，如果需要，使用 `import '@assets/[name].css';` 将它们导入到 CSS 文件中。
- 组件特定的CSS保存在与组件相同的文件夹中，例如：`component_id.css`,此文件不需要显式引用对应的html文件，由框架自动注入。
- 为了保持一致性，使用与模型字段相同的 CSS 类名和 ID。
- 每个文件应该用代码块包裹，顶部注释文件名。

## SUI组件JSON配置文件:

- 每个组件可以包含一个JSON配置文件，用于定义组件的属性。
- 配置文件的名称为组件.json，位于组件文件夹中。
- 配置文件的内容为一个JSON对象，对象所有的属性都能在页面上进行表达式引用`{{}}`引用。

  - 如果属性KEY的前缀是`$`,表示这个属性是一个处理器调用，对应的值一般是`scripts.xxx.xxx`，如果对象值是以`@`开头,对应值调用后backend文件中的函数名称。

  ```json
  {
    "$catalog": "@Catalog" // 直接调用了后端函数，实现了前后台数据共享与共享逻辑
  }
  ```

  `.backend.ts`文件中定义的函数：

  ```ts
  function Catalog(r: sui.Request) {
    const route = parseRoute(r);
    const ignoreCache = r.query?.refresh?.[0] === 'true' || false;
    return GetCatalog(route.root, route.name, route.locale, ignoreCache);
  }
  ```

## SUI模板引擎规则：

- 在 HTML 标签内使用 `{{ variable }}` 语法进行数据渲染。
- 使用 `s:for` 遍历数据列表，例如，`<div s:for="items" s:for-item="pet"> <span>{{ pet.name }}</span> </div>`。
- 使用 `s:if`,`s:elif`,`s:else` 进行条件渲染，例如，`<span s:if="pet.name">{{ pet.name }}</span>`。
- 文件系统路由定义网页路由。例如，`index.html` 映射到 `/`，`about.html` 映射到 `/about`。
- 动态路由用 `[id]` 表示，例如，`/pet/1`，`/pet/2` 是 `/[id]`。
- 使用 `s:on-click` 进行事件绑定，例如，`<button s:on-cli ck="handleClick" s:data-id="{{ pet.id }}">点击</button>`。
- 在处理布尔类型属性时，比如 `disabled`, `checked`, `selected`,`required`。如果使用到表达式时，需要使用`s:attr-`进行修饰，
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == true` 会渲染成`<input type="checkbox" checked />`。
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == false`会渲染成`<input type="checkbox"/>`。
- 在组件关联同名的 TS 文件中实现事件处理程序，例如：

  ```ts
  import { EventData, Component, EventDetail } from '@yao/sui';
  const self = this as Component;

  self.handleClick = (event: Event, data: EventData, detail: EventDetail) => {
    // 处理事件
    // data['id'] 对应 s:data-id="{{ pet.id }}"
  };
  ```

- 模板引用使用 `is` 属性，例如，`<div is="/pet/"></div>`。

  - 子组件使用表达式`{% %}`渲染父组件传递的属性信息
  - 父组子可以使用`slot`来渲染子组件的内容
    子组件：

    ```html
    <!-- components/layout.html -->
    <div>
      <header></header>
      <content></content>
      <footer></footer>
    </div>
    ```

    父组件：

    ```html
    <!-- pages/index.html -->
    <div is="components/layout">
      <slot name="header">自定义头部</slot>
      <slot name="content">自定义内容</slot>
      <slot name="footer">自定义底部</slot>
    </div>
    ```

## 多语言支持：

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

## 动态渲染：

- 使用 `s:render` 属性标记可动态更新的区域：
  ```html
  <div s:render="content"></div>
  ```
- 如果需要局部更新组件，在`组件.ts`中调用 `render` 方法更新内容：
  ```ts
  self.render(
    'content',
    { data: 'value' },
    {
      showLoader: true, // 显示加载状态
      replace: true, // 替换内容
      withPageData: true // 包含页面数据
    }
  );
  ```

## 组件初始化：

- 如果需要在页面加载时初始化页面数据，需要实现函数`BeforeRender`,返回一个对象，对象的属性在页面中通过表达式`{{}}`引用，仅限于组件才会调用此方法，主页面是不会触发`BeforeRender`。
  ```ts
  function BeforeRender(request,props){
    retrun {
      "k":v
    }
  }
  ```
- 使用 `once` 方法定义一次性初始化逻辑：
  ```ts
  self.once = function () {
    // 初始化代码
  };
  ```
- 组件初始化时会自动注入以下功能：
  - `store`：数据存储
  - `state`：状态管理
  - `props`：属性管理
  - `$root`：根节点查询，封装了html元素对象
  - `find`/`query`/`queryAll`：DOM查询方法
  - `render`：动态渲染
  - `emit`：事件触发

## 组件状态管理：

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

- 使用 `state` 进行组件间通信：
  ```ts
  self.watch = {
    opened: (value: boolean) => {
      // 处理状态变化
    }
  };
  self.state.Set('opened', true); // 触发状态变化事件
  ```

## 前端脚本:

- 每个组件可以包含一个前端脚本文件，用于实现组件在浏览器操作的逻辑。
- 脚本文件的名称为组件.ts，位于组件文件夹中。
- 脚本文件的内容为一个TypeScript模块,只需要在ts文件中增加业务处理逻辑，引擎会自动导出组件并注入前端页面并与组件关联。

  ```ts
  import { $Query, Component, $Store } from '@yao/sui';
  const self = this as Component;

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
  ```

- 在前端调用后端`backend.ts`中的Scripts:

  在前端可以使用`$Backend`来调用后端脚本中的函数，但是所有在后端暴露出来的函数需要以默认前端`Api`进行修饰。

  后端脚本`.backend.ts`:

  ```ts
  function ApiGetArticles(category: string, id: number) {
    return [
      {
        article: {
          name: 'a blog',
          author: 'admin'
        }
      }
    ];
  }
  ```

  前端调用脚本：

  ```ts
  //调用blog.html对象的blog.backend.ts中的ApiGetArticles方法
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);
  // Render articles
  // render是一个异步函数，需要使用await来修饰
  await self.render('articles', { articles });
  ```

## 组件通信：

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

## 前端脚本全局对象：

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
- `$Query`对象,封装了html元素对象，提供了一些常用的方法：
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
- 使用 `s:on-` 绑定后端事件处理：

  ```html
  <button s:on-click="Process">处理</button>
  ```

## todolist项目示例：

这是一个简单的todolist项目示例，演示了如何使用SUI构建一个简单的todolist应用。
项目结构如下：

```sh
suis/
└── web.sui.yao                     #sui配置文件，web是sui id。
data/
└── templates/                      #模板目录，每个模板对应一个目录
    └── default/                    #web默认模板，模板id是default，一套模板可以有多个组件。
        ├── todolist/               #todolist组件，每一个组件对应一个目录
        │   ├── todolist.html       #定义组件的结构
        │   ├── todolist.json       #定义组件的页面共用数据
        │   ├── todolist.ts         #组件的前端逻辑
        │   ├── todolist.css        #组件的样式
        │   └── todolist.backend.ts #组件的后端逻辑
        ├── __assets/               # 组件共用资源使用@assets/来引用
        ├── __data.json             #模板共用全局数据配置
        └── __document.html         # 组件/页面的共用入门文件
```

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
  "$todos": "@GetTodos",
  "title": "Todo List"
}
```

### todolist.ts：

- 在浏览器上执行的脚本程序，可以使用`$Backend`来调用后端脚本中的函数。
- `__sui_data`是一个页面渲染后注入全局变量，包含了页面的所有数据。
- 使用`self.store`来保存状态，注意`self.store.Get`/`self.store.Set`非对象类型的对象，使用`self.store.GetJSON`/`self.store.SetJSON`
- 使用`self.$root`来获取组件的根元素。
- 使用`self.render`来动态渲染组件。

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
  // Initial render of todos
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
import { Store } from '@yao/lib';
import { sui } from '@yao/sui';
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
function GetTodos(r: sui.Request) {
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

:::

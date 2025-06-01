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
            └── page_name/    # 页面目录
                └── component_name/ # 组件目录
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
        ├── components/                         #模板共用组件目录，所有页面都可以引用。
        │   ├── component_name/                 #组件目录，每个组件对应一个目录
        │   │   ├── component_name.html         #组件HTML模板
        │   │   ├── component_name.json         #组件模板数据配置
        │   │   ├── component_name.ts           #组件前端脚本
        │   │   ├── component_name.css          #组件样式
        │   │   └── component_name.backend.ts   #组件后端脚本
        ├── page_name/               #页面，每一个页面对应一个目录
        │   ├── page_name.html       #页面的模板结构
        │   ├── page_name.json       #页面的模板关联数据配置
        │   ├── page_name.ts         #页面的前端逻辑
        │   ├── page_name.css        #页面的样式
        │   ├── page_name.config     #页面访问控制配置
        │   └── page_name.backend.ts #组件的后端逻辑
        │       ├── component_name/  #组件目录
        │       │   ├── component_name.html         #组件HTML模板
        │       │   ├── component_name.json         #组件数据文件配置文件
        │       │   ├── component_name.ts           #组件前端脚本
        │       │   ├── component_name.css          #组件样式
        │       │   └── component_name.backend.ts   #组件后端脚本
        │       └── [item]/                 #动态路由组件目录
        │           ├── [item].html         #动态路由组件HTML模板
        │           ├── [item].json         #动态路由组件数据文件配置文件
        │           ├── [item].ts           #动态路由组件前端脚本
        │           ├── [item].css          #动态路由组件样式
        │           └── [item].backend.ts   #动态路由组件后端脚本
        ├── __locales/               #模板级多语言配置目录，所有页面都可以引用。
        │   └── zh-cn/                #语言配置目录，每个语言对应一个目录
        │       ├── [page_id].yml     #页面的多语言配置文件，指定页面对应一个配置文件。
        │       └── __global.yml      #模板级的多语言配置文件，所有页面都可以引用。
        ├── __assets/               #公共资源目录，通过 `import '@assets/style.css'` 引用
        │   └── js/                 #公共资源js目录
        │   └── css/                  #公共资源css目录
        │       └── tailwind.css      #tailwindcss配置文件
        ├── __data.json             #模板级全局数据，所有组件可通过 `{{ $global.xx }}` 访问
        ├── template.json           #模板配置文件，包含多语言支持配置信息
        ├── package.json            #外部依赖包配置文件
        └── __document.html         #所有页面的基础 HTML 骨架，包含 `<head>` 和 `<body>` 结构
```

目录结构由sui_id/template_id/page/component组成，其中:

- sui_id: 模板id，对应suis目录下的配置文件，如web.sui.yao。
- template_id: 模板id，对应data/templates目录下的模板目录。
- page: 页面目录，对应data/templates/template_id/page_name目录,在template_id目录下的第一个层级
- component: 组件目录，对应data/templates/template_id/page_name/component_name目录。

页面与组件之间的关系：

- 页面是一个完整的页面，包含页面`<body></body>`的结构、样式、逻辑等。
- 页面可以包含多个组件，每个组件对应一个目录。
- 组件可以包含子组件，子组件的目录结构与组件相同。

页面与组件之间的区别：

- 页面模板内容使用`<body></body>`包裹,而组件模板没有这个要求
- 页面是一个完整的页面，包含页面的结构、样式、逻辑等，前端页面脚本与样式在全局生效，渲染过程中会替换`__doucment.html`文件中的`{{ __page }}` 点位符。
- 组件是一个独立的组件，包含组件的结构、样式、逻辑等，在页面中使用`<div is=component xx="p1"></div>`引用组件，组件关联的后端脚本中可以使用`BeforeRender`函数接收调用参数，可以被不同的页面重复引用。
- 页面可以包含多个组件，组件可以包含子组件。
- 如果组件是某一个页面的专用组件，放在页面目录的子目录下。
- 共用的组件，放在模板根目录components子目录下。

### 3. 组件目录结构

每个页面目录都遵循以下结构：

两者都使用json格式，但是需要区分配置文件`.json`与`.config`文件用途。

- `.json`文件是组件的模板数据配置文件，内容由开发者自由定义，可调用后端服务获取数据。
- `.config`文件是页面的访问配置文件，配置格式固定，开发者需要按要求填写，比如访问认证，seo标题、描述、关键词等。

```json
page_name/
├── page_name.html        # 组件模板
├── page_name.css         # 组件样式
├── page_name.ts          # 前端 TypeScript
├── page_name.json        # 页面模板数据配置
├── page_name.config      # 页面访问配置，比如访问认证，seo标题、描述、关键词等。
└── page_name.backend.ts  # 后端 TypeScript
```

每个组件目录都遵循以下结构：

```json
page_name
└── component_name/
    ├── component_name.html        # 组件模板
    ├── component_name.css         # 组件样式
    ├── component_name.ts          # 前端 TypeScript
    ├── component_name.json        # 组件数据配置
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

### todolist.html：

- 定义用户访问页面结构模板
- `s:render`标识可以动态渲染的区域
- `s:for`绑定需要渲染的变量

```html
<!-- data/templates/default/todolist/todolist.html -->
<!-- 使用json:初始化后台数据 -->
<body json:todos="{{ [] }}" data:count:"0">
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
</body>
```

### todolist.css：

- 定义组件的样式，使用正常的css语法，可以使用`@assets/style.css`引用公共资源目录下的css文件。

```css
/* data/templates/default/todolist/todolist.css */
```

### 模板关联数据文件todolist.json：

- 使用`$`修饰的key,并且`@`修改的value,会调用后端脚本中的函数。
- 使用`$`修饰的key,会调用Yao处理器，比如`scripts.lib.process`。

```json
{
  "$todos": "@GetTodos", //调用后端脚本中的函数，初始化组件的状态
  "title": "Todo List"
}
```

### 翻译文件

```yaml
# data/templates/default/todolist/__locales/zh-cn/todolist.yml
messages:
  Add: '增加'
```

### todolist.ts（前端脚本）：

- 使用`$Backend`来调用后端脚本中的函数。
- 使用`self.render`调用服务器api返回渲染后的组件。
- `__sui_data`是一个页面渲染完成后注入全局变量，包含了页面的所有数据。
- 是在文档加载完成事件`DOMContentLoaded`中读取全局变量`__sui_data`，而不是once中调用，。

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
  // call when component inited
  console.log('todolist 初始化');
};
// Add a new todo
self.addTodo = async (event: Event, data: EventData, detail: EventDetail) => {
  try {
    const input = self.$root.find('#todo-input').elm() as HTMLInputElement;
    const text = input.value.trim();
    if (!text) throw new Error('Input cannot be empty');
    const newTodo = await $Backend('/todolist').Call('AddTodo', text);
    if (!newTodo) throw new Error('Failed to add todo');
    const todos = self.store.GetJSON('todos') || [];
    todos.push(newTodo);
    self.store.SetJSON('todos', todos);
    await self.render('todo-list', { todos });
    input.value = '';
  } catch (error) {
    console.error('Error adding todo:', error);
    alert('Failed to add todo. Please try again.');
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

// 在文档加载完成后，初始化组件的状态
async function initState() {
  console.log('状态初始化');
}
document.addEventListener('DOMContentLoaded', initState);
```

### todolist.backend.ts(后端脚本)：

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

function Save(todos) {
  new Store('cache').Set('todos', todos);
}
function getTodos() {
  return new Store('cache').Get('todos') || [];
}
// Fetch all todos
// 页面渲染时，在页面模板数据关联文件todolist.json中引用，会调用此函数
function GetTodos(r: Request) {
  return getTodos();
}
// Add a new todo，前端render函数调用AddTodo方法时，会调用此函数，需要以Api开头。
function ApiAddTodo(text: string) {
  const todos = getTodos();
  let idCounter = todos.length + 1; // Simple ID counter, adjust as needed for unique ID
  const newTodo = {
    id: (idCounter++).toString(),
    text,
    completed: false
  };
  todos.push(newTodo);
  Save(todos);
  return newTodo;
}
// Toggle todo completion
function ApiToggleTodo(id: string) {
  const todos = getTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    console.log('ApiToggleTodo todos', todos);
    Save(todos);
    return todo;
  }
  return null;
}
// Delete a todo
function ApiDeleteTodo(id: string) {
  const todos = getTodos();
  const index = todos.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos.splice(index, 1);
    Save(todos);
    return true;
  }
  return false;
}
```

## 核心文件详解

### `package.json`

- 项目的依赖管理文件，定义项目的外部依赖库和命令。
- 安装依赖后把输出文件复制到`__assets`目录下。

```json
{
  "scripts": {
    "dev": "tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --watch --minify",
    "build": "tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
  },
  "packageManager": "pnpm@10.4.1",
  "devDependencies": {
    "@tailwindcss/cli": "^4.1.8",
    "@tailwindcss/typography": "^0.5.16",
    "flowbite": "^3.1.2",
    "flowbite-typography": "^1.0.5",
    "tailwindcss": "^4.1.8"
  }
}
```

安装命令

```bash
pnpm install
cp node_modules/flowbite/dist/flowbite.min.js __assets/js/flowbite.min.js
```

### `tailwind.css`

Tailwind CSS的配置文件，定义了项目的样式和主题。

```css
@import 'tailwindcss';
@plugin "flowbite/plugin";
@source "../../node_modules/flowbite";
@plugin "flowbite-typography";
@plugin "@tailwindcss/typography";
/* 支持flowbite dark主题 */
@custom-variant dark (&:where(.dark, .dark *));
```

### `__document.html`

- 基础的页面模板文件，定义所有页面共用的配置，占位符`{{ __page }}`用于替换页面的HTML内容,页面模板需要使用`<body></body>`标签包裹。
- 如果需要增加新的全局样式，先在`__assets/css`目录下创建新的css文件。
- 如果需要增加新的全局脚本或是引用外部库文件，比如`jQuery`等，先在`__assets/js`目录下创建新的js文件。
- 使用flowbite4,css样式文件使用命令构建，只需要在`__document.html`只需要引入`tailwind.min.css`和`flowbite.min.js`即可。

```html
<!DOCTYPE html>
<html lang="{{ $global.theme }}" {{ $global.theme }}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="{{ description }}" />
    <meta name="keywords" content="{{ keywords }}" />
    <meta name="og:url" content="{{ url }}" />
    <meta name="og:title" content="{{ title }}" />
    <meta name="og:image" content="{{ image }}" />
    <title>{{ title }}</title>
    <!-- css样式 -->
    <link href="@assets/css/tailwind.min.css" rel="stylesheet" />
    <link href="@assets/css/flowbite.min.css" rel="stylesheet" />
    <!-- 其它外部库样式链接 -->
    <!-- js脚本 -->
    <script src="@assets/js/flowbite.min.js"></script>
    <!-- 其它的外部库链接 -->
  </head>
  {{ __page }}
</html>
```

`__page`是一个占位符，用于替换页面的HTML内容，它一般包含以下内容。

```html
<body>
  <main class="relative bg-transparent">// 页面内容</main>
</body>
```

````

### template.json(模板配置文件)

- 模板配置文件增加语言配置，增加支持的语言列表，配置默认的语言。
- 配置构建前执行的命令，使用`pnpx @tailwindcss/cli`来构建tailwindcss。

```json
{
  "locales": [
    { "label": "English", "value": "en-us", "default": true },
    { "label": "简体中文", "value": "zh-cn" }
  ],
  "scripts": {
    "before:build": [
      {
        "type": "command",
        "content": "pnpx @tailwindcss/cli -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
      }
    ]
  }
}
````

### `__data.json`(模板全局数据配置文件):

- 配置信息在所有页面/组件共享。
- `theme`: 主题配置，支持`light`和`dark`两种主题。
- 在模板中使用`{{ $global.theme }}`来获取主题配置。

```json
{
  "title": "应用名称",
  "description": "应用描述",
  "theme": "light",
  "language": "zh-CN"
}
```

### 页面/组件数据配置文件 (.json)

- SUI引擎渲染使用了SSR技术，在服务器端渲染过程，会读取组件或是页面数据配置文件`page_name.json`或是`component_name.json`获取渲染数据数据
- 动态数据使用`$key:@functionName`的方式来调用后端脚本`.backend.ts`中的函数。
- 静态数据可以直接在JSON文件中定义。
  ```json
  {
    "$catalog": "@Catalog",
    "name": "John Doe"
    //其它静态数据
  }
  ```

### 多语言文件配置`__locales/localeID/pageID.yml`与`__locales/localeID/__global.yml`

- 多语言文件配置，用于配置页面/组件的多语言支持，每个页面/组件可以有自己的多语言配置文件，也可以有全局的多语言配置文件。
- 在messages属性中定义需要翻译的文本信息，key为需要翻译的文本，value为翻译后的文本。
- key是在页面模板中使用`s:trans`属性来引用的,或是使用`::`来引用的。

```yml
messages:
  Hello: Hello
  Welcome: Welcome
  Name: Name
```

### `.html`页面/组件开发模板语法规范

### 1. 命名规范

- 页面/组件目录名：使用小写字母，多词使用连字符（kebab-case）
- 文件命名：与目录名保持一致
- 页面/组件 ID：使用简单的单个单词，例如 `home`, `about`, `contact`

### 2. 模板语法规范

### 3. HTML 模板 (.html)

- 重要：模板也是一个 HTML 文件，使用标准的 HTML 语法，针对于page页面，需要使用`<body>`标签包裹整个页面内容。
- 模板渲染过程使用一个包含多种数据的复杂对象，数据来源如下：

  - **`$payload`**: `request.Payload` - 用户请求的数据
  - **`$query`**: `request.Query` - 请求查询参数
  - **`$param`**: `request.Params` - 请求路径参数
  - **`$cookie`**: `cookies` - Cookie 数据
  - **`$url`**: `request.URL` - 请求地址
  - **`$theme`**: `cookies["color-theme"]` - 用户通过 Cookie 设置的前端主题
  - **`$locale`**: `cookies["locale"]` - 用户通过 Cookie 设置的语言
  - **`$timezone`**: `"+08:00"` - 后端服务器系统时区
  - **`$direction`**: `'ltr'` - 默认语言方向
  - **`$global`**: 从 `__data.json` 文件定义的变量
  - **模板关联配置文件**: 模板对应的 `.json` 配置文件中的变量
  - **模板自定义变量**: 页面通过 `Set` 指令配置的变量

- sui引擎自定义属性说明：

  - `s:for`：遍历数据列表，例如，`<div s:for="items" s:for-item="item"> <span>{{ item.name }}</span> </div>`。
  - `s:for-item`: 遍历数据列表，获取当前项，例如，`<div s:for="items" s:for-item="item"> <span>{{ item.name }}</span> </div>`。
  - `s:for-index`：遍历数据列表，获取当前索引，例如，`<div s:for="items" s:for-item="item" s:for-index="index"> <span>{{ index }}</span> </div>`。
  - `s:if`：条件渲染，例如，`<span s:if="pet.name">{{ pet.name }}</span>`。
  - `s:elif`：条件渲染，例如，`<span s:elif="pet.name">{{ pet.name }}</span>`。
  - `s:else`：条件渲染，例如，`<span s:else>No name</span>`。
  - `s:trans`：翻译，配置翻译配置文件实现多语言，例如，`<span s:trans>Hello</span>`。
  - `s:on-`：前缀，事件绑定，例如，`<button s:on-click="handleClick" s:data-id="{{ pet.id }}">点击</button>`。
  - `s:data-`：前缀，传递简单类型数据给事件，建议使用`data:`，，例如，`<button s:on-click="handleClick" s:data-id="{{ pet.id }}">点击</button>`。
  - `s:json-`：前缀，传递定复杂类型数据给事件，建议使用`json:`，例如，`<button s:on-click="handleClick" s:json-data="{{ { "name": "value"} }}">点击</button>`。
  - `s:render`：动态渲染区域，例如，`<div s:render="content-area"> {{ data }} </div>`。
  - `s:attr-`：前缀，针对于布尔属性的控件，表达式返回真设置对应的值，例如，`<input type="checkbox" s:attr-checked="{{ isChecked }}">` => `<input type="checkbox" checked>` 或是 `<input type="checkbox" />`。
  - `...key`：前缀，解构复杂的配置属性，例如，`<div is="/pet/" ...key> </div>`
  - `s:raw=true`：不转义HTML特殊字符，不正确的使用会导致安全风险（如 XSS 攻击），例如，`<div s:raw="true">{{ rawContent }}</div>`。
  - `data:`：前缀，传递数据给组件，例如，`<div is="/pet/" data:id="{{ pet.id }}"> </div>`。
  - `json:`：前缀，传递JSON数据给组件，例如，`<div is="/pet/" json:obj="{{ { "name": "value"} }}"> </div>`。
  - `is:`：引用组件，例如，`<div is="/pet/"> </div>`。
  - `slot:`：标签，需要name属性，渲染子组件的内容，例如，`<slot name="content">自定义内容</slot>`。

- 每个模板应该由单独的纯 HTML、CSS 和 TypeScript 文件组成。使用相同的名称但不同的扩展名（例如，`component_id.html`、`component_id.css`、`component_id.ts`）。
- 避免使用框架或库。如果需要，通过 script 标签导入库。
- 渲染逻辑将由SUI模板引擎处理，所以你不需要实现它。使用 JS 文件来处理动画。
- 对于第三方库，在 JS 文件中使用 `import '<CDN 链接>';` 包含 CDN 链接。
- HTML 内容应该排除 `<head>` 和 `<body> `标签；这些由 SUI 引擎添加。
- 分离通用 CSS 文件以保持一致的样式，如果需要，使用 `import '@assets/[name].css';` 将它们导入到 CSS 文件中。
- 组件特定的CSS保存在与组件相同的文件夹中，例如：`component_id.css`,此文件不需要显式引用对应的html文件，由框架自动注入。
- 为了保持一致性，使用与模型字段相同的 CSS 类名和 ID。
- 每个文件应该用代码块包裹，顶部注释文件名。
- 在 HTML 标签内使用 `{{ variable }}` 语法进行数据渲染。
- 子组件使用表达式`{% %}`渲染父组件传递的属性信息
- 使用 `s:for` 遍历数据列表，例如，`<div s:for="items" s:for-item="pet"> <span>{{ pet.name }}</span> </div>`。
- 使用 `s:if`,`s:elif`,`s:else` 进行条件渲染，例如，`<span s:if="pet.name">{{ pet.name }}</span>`。
- 文件系统路由定义网页路由。例如，`index.html` 映射到 `/`，`about.html` 映射到 `/about`。
- 使用 `s:on-click` 进行事件绑定，例如，`<button s:on-cli ck="handleClick" s:data-id="{{ pet.id }}">点击</button>`。
- 在处理布尔类型属性时，比如 `disabled`, `checked`, `selected`,`required`。如果使用到表达式时，需要使用`s:attr-`进行修饰，
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == true` 会渲染成`<input type="checkbox" checked />`。
  示例：`<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />`，`isCheck == false`会渲染成`<input type="checkbox"/>`。
- 模板引用其它组件使用 `is` 属性，例如，`<div is="/pet/"></div>`。
- 模板可以使用`slot`来渲染子组件的内容
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

  <!-- 接收父组件的属性传递 -->
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
  <div s:render="content-area">{{ data }}</div>

  <!-- 组件引用 -->
  <div is="/other-component">
    <slot name="content">默认内容</slot>
  </div>
</div>
```

#### 属性展开：

在页面/组件的json配置文件中，定义一个obj对象，包含html属性，值为一个对象，对象的key为属性名，value为属性值，在页面上使用`...key`来展开属性。

需要注意对象名不要使用驼峰命名，html属性不支持驼峰命名，需要使用连字符命名。

```json
{
  "objattr": {
    "class": "px-3",
    "style": "font-size: 14px;",
    "id": "myId"
  }
}
```

在模板中使用`...key`来展开属性，例如：

```html
<container>
  <div ...objattr></div>
</container>
```

展开后的html为：

```html
<div style="font-size: 14px;" id="myId" class="px-3"></div>
```

#### 模板渲染安全规则

- `{{ }}` `{% %}`表达式自动转义 HTML 特殊字符
- 需要渲染原始 HTML 时使用 `s:raw` 指令：
  ```html
  <div s:raw="true">{{ rawContent }}</div>
  ```

#### 模板多语言支持：

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

- 模板推荐使用tailwindcss的样式和脚本，使用flowbite的样式和脚本。

```css
/* 样式 */
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

- 脚本文件的内容为一个TypeScript模块,只需要在ts文件中增加业务处理逻辑，引擎会自动导出组件并注入前端页面。
- 页面关联的脚本文件会在页面加载时立即执行，组件关联的脚本文件会在文档加载完成后执行。
- 在前端可以使用`$Backend`来调用后端脚本`backend.ts`中的函数，但是所有在后端暴露出来的函数需要以默认前端`Api`进行修饰。

```ts
import { Component, EventData, EventDetail, __m } from '@yao/sui';
const self = this as Component;

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
  // 调用函数__m翻译文本
  console.log(__m('welcome_message')); // Translates 'welcome_message' based on locale
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
  // render是一个异步函数，需要使用await来修饰
  await self.render('articles', { articles });
};
// 状态监听
self.watch = {
  stateKey: (newValue) => {
    // 状态变化处理
  }
};

self.once = async function () {
  // 组件初始化逻辑
  console.log('Component initialized');
};

function initStat() {
  // 页面初始化逻辑
  console.log('Page initialized');
}
document.addEventListener('DOMContentLoaded', initStat);
```

### 前端常用的操作：

- 页面/组件初始化时会在前端脚本`.ts`中自动注入以下功能：

  - `__sui_data`是一个页面渲染完成后注入全局变量，包含了页面的所有数据。
  - `self`: ,。
    - 如果模板文件类型是page页面，self会引用全局对象的window。
    - 如果模板文件类型是组件，self会引用组件Component的实例。
  - `self.root`：返回HTMLDOM节点。
    - 如果模板文件类型是组件则返回组件挂载所在html Dom对象。
    - 如果模板文件类型是页面则返回`document.body`对象。
  - `self.store`：Yao框架提供的存储对象，用于管理组件状态,操作html dom中的使用前缀`data:`与`json:`修饰的属性。
  - `self.state`：状态管理对象，用于设置和获取组件状态。
  - `self.props`：属性管理对象，用于读取组件的属性。
  - `self.$root`：返回`SUIQuery`实例。
  - `self.find(selector)`：在页面/组件内查询匹配选择器的第一个元素，返回`SUIQuery`对象。
  - `self.query(selector)`：在页面/组件内查询匹配选择器的第一个DOM元素。
  - `self.queryAll(selector)`：在页面/组件内查询所有匹配选择器的DOM元素。
  - `self.render(name, data, option)`：根据`s:render`ID和数据在服务器端渲染内容并更新前端页面局部内容。
  - `self.emit(name, data)`：触发指定名称的自定义事件，并传递数据。
  - `self.once`：可选的初始化钩子函数，仅在页面/组件首次初始化时执行。

- 常见操作：

  - `self.query("[input-element]")` 在页面/组件内选择Dom元素
  - `self.find("[multiple-values]")?.hasClass("hidden")` 查找页面/组件是否有css class

- 属性读取：

  - `self.props.Get("mode")` 读取页面/组件属性

- 状态设置:

  - `$$(self.root.querySelector(".flowbite-edit-input")).state.Set("value", label);` 在页面上找到组件并设置状态，触发对应组件`watch`中的函数。
  - `$$(selector)` 在页面上查找组件并返回实例，selector是html元素或是css选择器。
  - `$$(dropdown).store.GetJSON("items")` 操作其它组件

## 多语言切换：

通过设置cookie来切换语言，cookie的名称为`locale`，值为语言代码，例如：`zh-CN`。

```ts
yao.SetCookie('locale', 'zh-CN');
window.location.reload();
```

## 主题切换

- 支持`light`、`dark`、`system`三种主题。
- 通过`cookie=color-theme`可以把主题保存到cookie中
- 后端脚本中使用`request.$theme`来获取。

在前端脚本可以使用以下代码来切换主题：

```ts
type Theme = 'light' | 'dark' | 'system';

function getTheme() {
  const yao = new Yao();
  const savedTheme = yao.Cookie('color-theme') as Theme | null;
  return savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';
}

function setTheme(event: Event, data: EventData, detail: EventDetail) {
  const { theme } = data;
  const yao = new Yao();
  const html = document.documentElement;
  // Remove existing theme classes
  html.classList.remove('light', 'dark');
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.classList.add('dark');
    }
    yao.SetCookie('color-theme', 'system');
    return;
  }
  html.classList.add(theme);
  yao.SetCookie('color-theme', theme);
}
```

## SUI模板组件状态管理：

- 组件有两种状态管理方式：

  - `store`：用于管理组件自身状态，使用HTML自定义属性存储数据。
  - `state`：用于组件间通信，支持状态变化事件传播。

- 使用 `store` 管理组件状态：

  在模板中配置`data:`与`json:`属性给前端脚本初始化数据。
  `.json`数据配置文件。

  ```json
  {
    "item": [
      {
        "name": "Item 1"
      }
    ],
    "key": "value"
  }
  ```

  在模板中使用`data:`与`json:`属性来初始化数据,可以使用`{{}}` 引用数据配置文件。

  ```html
  <body json:item="{{chart_data}}" data:key="{{key}}"></body>
  ```

  ```ts
  //在前端脚本中使用store.GetJSON来读取Jsong复杂数据。
  self.store.GetJSON('item');
  //保存复杂类型的对象需要使用SetJSON方法。
  self.store.SetJSON('item', { ...item, selected: false });
  //使用store来读取模板中的配置信息，
  const value = self.store.Get('key'); // 获取值value
  //注意Set方法只能用于保存非对象类型的对象
  self.store.Set('key', value); // 设置临时状态
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

引用组件：

- 通过import的方式引用组件。
  ```html
  <body>
    <import s:as="Anchor" s:from="/flowbite/components/anchor"></import>
    <Anchor></Anchor>
    <Anchor></Anchor>
    <Anchor></Anchor>
  </body>
  ```
- 通过`is`属性引用组件。

  ```html
  <body>
    <header is="/header" active="/blog"></header>
    <title is="/blog/title" title="Blog"></title>
    <list is="/blog/list"></list>
    <footer is="/footer"></footer>
  </body>
  ```

- 父子组件通信：
  - 页面/父组件通过html属性配置向子组件传递数据：
    ```html
    <child-component data="{{ parentData }}"></child-component>
    ```
  - 子组件通过`{% %}`表达式引用父组件属性数据：
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

## 页面ts全局工具类：

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

## 模板局域重复渲染：

- 在模板中使用 `s:render` 属性标记可以重复渲染的区域，即可以在加载时渲染，也可以单独使用API接口进行后端渲染。
- 重要：即使html元素增加了`s:render`属性，也需要添加模板内容定义，不可以缺少模板定义。
- `s:render`标识使用`querySelectorAll`筛选所有的子节点，不包含自身，需要注意此属性所在的层次，避免缺失html元素。
- 此区域一般是需要包含动态内容的区域，API接口通过传入不同的数据返回不同的页面源代码。
  ```html
  <div s:render="content">
    <!-- 模板定义 -->
    {{ product }}
  </div>
  ```
- 如果需要重复渲染模板，在前端`组件.ts`中调用 `render` 方法更新内容：
  ```ts
  //调用服务器api在服务器端渲染组件，返回html内容
  await self.render(
    'content', // 关联的需要渲染的区域s:render="content"
    { data: 'value' }, // 模板渲染需要的数据
    {
      showLoader: true, // 在api加载过程中显示加载状态
      replace: true, // 替换内容
      withPageData: true // 包含页面全局变量__sui_data
    }
  );
  ```

## 后端脚本 (.backend.ts)

- 后端脚本中的函数不要使用export导出，因为后端脚本是在node环境中执行的，不能使用export导出。
- 每个页面/组件可以包含一个后端脚本文件,后缀名是`.backend.ts`，用于实现页面/组件在服务器端的逻辑。
- 脚本文件的内容为一个TypeScript模块，只需要在ts文件中增加业务处理逻辑，引擎在页面渲染过程中自动调用相关函数。
- 对于类型是页面的模板，不要实施函数`BeforeRender`。
- 对于类型是组件的模板，可选择实现函数`BeforeRender`，用于在组件渲染前处理数据。
- 函数`BeforeRender`接收父组件的属性传递值，函数返回处理过的属性数据，在属性配置上使用`{{ }}` 接收新的属性配置。
- 前后端脚本常量数据共享，在脚本`.backend.ts`中定义一个常量`Constants`,在前端脚本`.ts`中可以使用`self.Constants`来读取。

`.json`(模板数据配置)：

```json
{
  "$list": "@ProcessData" //调用后端函数
}
```

`.backend.ts`(后端脚本)：

```typescript
import { Request } from '@yao/sui';

// 组件渲染前处理
// props是父组件传递的属性列表
function BeforeRender(request: Request, props: any) {
  // 根据父节点传入的属性与请求参数，生成组件所需要的属性信息
  // 处理逻辑
  const data: Record<string, any> = { ...Constants.defaults, ...props }; // Copy the props
  return { ...data };
}

// API 方法，暴露的API方法可以在前端脚本中使用，需要使用Api前缀修饰此函数。
function ApiMethod(param: any) {
  // 处理逻辑
  return {
    result: 'success'
  };
}

// 数据处理方法,可以json配置文件中使用@ProcessData调用
function ProcessData(request: Request) {
  // 数据处理逻辑
  // 在动态组件中使用request.params获取动态参数
  // 例如：/item/[item]
  const itemId = request.params.item; // Access dynamic parameter [item]
  return { itemId, data: {} };
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

### 后端脚本拦截处理组件参数传递示例：

- 父组件：
  ```html
  <div is="/component" title="{{ 'title' }}" description="{{ 'desc' }}"></div>
  ```
- 子组件：
  ```html
  <root
    title="{{ title }}"
    description="{{ description }}"
    type="flowbite-dropdown"
  >
    <h1>{% title %}</h1>
    <p>{% description %}</p>
  </root>
  ```
- 子组件脚本`backend.ts`：

  ```ts
  // 组件初始化逻辑
  function BeforeRender(
    request: sui.Request,
    props: Record<string, string>
  ): Record<string, any> {
    console.log('old props:', props);
    //output:
    //old props: { title: 'title', description: 'desc' }

    retrun { ...props,title:'hello',description:'world' };
  }
  ```

  输出：

  ```html
  <div title="hello" description="world" type="flowbite-dropdown">
    <h1>hello</h1>
    <p>world</p>
  </div>
  ```

## 前后端数据交互：

- 模板中使用`data:`或是`s:data-`传递数据给前端，在前端中使用`store.GetData()`获取数据，在事件处理函数中使用`data['id']`获取数据。
- 模板中使用`json:`或是`s:json-`传递数据给前端，在前端中使用`store.GetJSON()`获取数据，在事件处理函数中使用`data['id']`获取json数据。
- 在后端脚本`.backend.ts`中定义一个常量`Constants`,在前端脚本`.ts`中可以使用`self.Constants`来读取。
- 在后端组件或是页面数据配置文件`.json`中配置的数据，在前端全局变量`__sui_data`中读取。
- 在后端全局数据配置文件`__data.json`中配置的数据，在前端全局变量`__sui_data`中读取，在模板中使用`{{ $global.xxx }}`来访问。
- 前端调用后端API：
  - 使用 `$Backend` 调用后端脚本中的函数，例如：`const result = await $Backend('/path').Call('Method', id);`。
  - 后端脚本中的函数需要以 `Api` 开头，例如：`function ApiMethod(id) { ... }`。

## URL路由配置

- 如果页面访问增加了新的路由，并且路由中包含了动态参数或是动态文件名，需要按以下的规则更新文件`app.yao`文件中的路由配置。
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
        { "^\\/(.*)\\/(.*)$": "/[$1]/[pid].sui" },
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

  前一部分使用正则表达式的分组来捕获URL参数，后面通过`$1`和`$2`来匹配路由中的参数。

  - 访问`/category/books/123` → 重定向到`public/123/books.sui`
  - `$1`匹配"books"，`$2`匹配"123"

  **命名参数** (`[param]`)：

  ```json
  { "^\\/product\\/(.*)$": "/detail/[pid].sui" }
  ```

  在前一部分使用正则表达式分组捕获URL参数，并将其作为命名参数`[pid]`传递给路由，按分组出现的顺序进行映射关系，`$1->[1]`,`$2->[2]`。

  - 访问`/product/abc123` → 重定向到`public/detail/[pid].sui`
  - 参数存入`request.params.pid = "abc123"`

  **混合使用，复杂场景**：

  ```json
  { "^\\/(.*)\\/(.*)$": "/[$1]/[pid].sui" }
  ```

  在路由中同时使用位置参数和命名参数，前一部分捕获URL参数并作为位置参数，后面的部分作为命名参数。

  - 先进行文件路径的替换：访问`/user/123` → 重定向到`public/[user]/[pid].sui`
  - 再进行参数的映射，参数存入：
    ```js
    request.params = {
      user: 'user', // 来自$1
      pid: '123' // 来自$2
    };
    ```

### 3. 页面/组件配置文件 (.config)

可选配置，`.config`文件格式为json, 通过 `.config` 文件单独配置额外的参数，常见配置项如下表所示：

| 配置项      | 类型   | 说明                                                                           | 示例/默认值 |
| ----------- | ------ | ------------------------------------------------------------------------------ | ----------- |
| title       | string | 页面标题，对应 `<title />`                                                     | "页面标题"  |
| guard       | string | 页面访问认证方式及认证失败跳转地址，支持 `bearer-jwt`、`cookie-jwt` 等         | ""          |
| cacheStore  | string | 页面缓存所需的 store id，需在 stores 配置，常用于 Redis 等 ,配置为空会禁用缓存 | ""          |
| cache       | number | 页面模板缓存时间（秒），配置为cache=0会禁用页面page缓存                        | 12          |
| root        | string | 页面请求前缀，相对于 public 根目录，通常无需配置                               | ""          |
| dataCache   | number | 页面请求数据缓存时间（秒），配置为dataCache=0会禁用data缓存                    | 0           |
| description | string | 页面描述，meta[name=description]                                               | ""          |
| seo         | object | SEO 相关配置，会自动附加到页面的meta节点，见下方详细说明                       | {...}       |
| api         | object | 后端`.backend.ts`脚本中 API函数 配置，见下方详细说明                           | {...}       |

#### API 调用安全性（apiguard）

如果 API 涉及动态数据的保存，建议配置 `apiguard`，可选值如下：

- `bearer-jwt`，使用header中的`Authorization: Bearer token`进行JWT认证，token过期或认证失败会返回403，同时保存到`request.Sid`中，用于跟踪请求。
- `query-jwt`,使用URL中的`?__tk=xxx`进行JWT认证，token过期或认证失败会返回403，同时保存到`request.Sid`中，用于跟踪请求。
- `cookie-jwt`,使用cookie中的`__tk`进行JWT认证，token过期或认证失败会返回403，同时保存到`request.Sid`中，用于跟踪请求。
- `cookie-trace`，cookie跟踪，获取cookie中的`__sid`，保存到`request.Sid`中，用于跟踪请求。

#### 缓存相关

建议在正式环境启用页面缓存以提升性能，可通过 `cacheStore` 指定缓存存储（如 Redis），并设置 `cache` 和 `dataCache` 时间。

**禁用缓存方式：**

- 请求 URL 中添加参数 `__debug=true`
- 请求 URL 中添加参数 `__sui_disable_cache=true`
- 请求头中包含 `Cache-Control=no-cache`

#### SEO 配置（seo）

| 字段        | 说明                                  |
| ----------- | ------------------------------------- |
| title       | 替换html页面meta[property='og:title'] |
| description | 替换html页面meta[name=description]    |
| keywords    | 替换html页面meta[name=keywords]       |
| image       | 替换html页面meta[property='og:image'] |
| url         | 替换html页面meta[property='og:url']   |

#### API 配置（api）

| 字段         | 说明                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| prefix       | 后端`.backend.ts`脚本中暴露的 API 函数前缀，默认 "Api" ，只有此前缀的函数才能通过API接口进行调用 |
| defaultGuard | API 默认的 guard 配置，所有 API 函数共用，空或 "-" 表示不验证                                    |
| guards       | 针对每个方法单独配置 guard，例如 `{ "method": "bearer-jwt" }`                                    |

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
    //这里的配置会在附加到页面的meta节点
    "title": "标题", //替换[property='og:title']
    "description": "长描述", //替换meta[name=description]
    "keywords": "", //替换meta[name=keywords]
    "image": "", //替换meta[property='og:image']
    "url": "" //替换meta[property='og:url']
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

- 使用 `yao sui build web default` 命令构建前端模板中所有的页面,在开发阶段可以使用`-D`参数使用调试模板，参数会禁用缓存。使用`-d ::{}`传入会话信息。
- 使用 `yao sui watch web default` 命令实时预览修改
- 使用 `yao sui trans web default` 命令生成多语言文件
- 使用 `yao start` 命令启动本地开发服务器

## 开发调试

- 页面模板调试，在页面中使用`{{ $env }}`在页面中输出页面渲染使用的变量`<div>{{ $env }}</div>`。
- 使用 `yao sui build` 使用`-D`参数参数会禁用缓存，并且生成的模板文件不会进行压缩。
- 请求 URL 中添加参数 `?__debug=true`,页面加载时，浏览器控制台会自动的输出全局变量`__sui_data`。

## `sui.d.ts`(sui项目中的类型定义):

```ts
// TypeScript声明：YAO Pure JavaScript SDK
// 作者: Max <max@iqka.com>
// 维护者: https://yaoapps.com

/** HTTP请求接口 */
export interface Request {
  method: string; // 请求方法，如"GET"或"POST"
  asset_root?: string; // 资产访问根URL，可选
  referer?: string; // 请求来源URL
  payload?: Record<string, any>; // 请求负载数据
  query?: Record<string, string[]>; // URL查询参数
  params?: Record<string, string>; // URL路径参数
  headers?: Record<string, string[]>; // 请求头
  body?: any; // 请求体
  url?: URL; // 请求URL详情
  sid?: string; // 会话ID，可选
  theme?: string; // 主题偏好，可选
  locale?: string; // 区域设置，可选
}

/** 请求URL结构 */
export interface URL {
  host?: string; // 主机，如"www.example.com"
  domain?: string; // 域名，如"example.com"
  path?: string; // 路径，如"/path/to/route"
  scheme?: string; // 协议，如"http"或"https"
  url?: string; // 完整URL
}

/** 服务器获取的数据 */
export declare const __sui_data: Record<string, any>;

/** 本地化消息和设置 */
export declare function __m(message: string): string;

// @ts-ignore
export declare const arguments: any[] = [];

/** 请求头类型 */
export type Headers = Record<string, string | string[]>;

/** 本地化设置接口 */
export interface Locale {
  name?: string; // 区域名称，如"en-US"
  keys?: Record<string, string>; // 翻译键值对
  messages?: Record<string, string>; // 消息模板
  direction?: "ltr" | "rtl"; // 文字方向
  timezone?: string; // 时区，如"+05:30"
}

/** UI组件类型 */
export declare type Component = {
  root: HTMLElement; // 组件根元素
  state: ComponentState; // 状态管理
  store: ComponentStore; // 状态存储
  $root: SUIQuery; // DOM查询对象
  find: (selector: string | HTMLElement) => SUIQuery | null; // 查找元素
  query: (selector: string) => HTMLElement | null; // 查询单个元素
  queryAll: (selector: string) => NodeListOf<Element> | null; // 查询所有元素
  emit: (name: string, detail?: EventData) => void; // 触发事件
  render: (name: string, data: Record<string, any>, option?: RenderOption) => Promise<string>; // 渲染视图
  once?: () => void; // 一次性生命周期方法
  watch?: Record<string, (value?: any) => void>; // 状态监听
  Constants?: Record<string, any>; // 组件常量
  [key: string]: any;
};

/** 渲染选项 */
export declare type RenderOption = {
  target?: HTMLElement; // 渲染目标容器
  showLoader?: HTMLElement | string | boolean; // 显示加载器
  replace?: boolean; // 是否替换现有内容
  withPageData?: boolean; // 是否包含页面数据
};

/** 组件状态管理 */
export declare type ComponentState = {
  Set: (key: string, value?: any) => void; // 设置状态
};

/** 组件存储管理 */
export declare type ComponentStore = {
  Get: (key: string) => string; // 获取值
  Set: (key: string, value: string) => void; // 设置值
  GetJSON: (key: string) => any; // 获取JSON数据
  SetJSON: (key: string, value: any) => void; // 设置JSON数据
  GetData: () => Record<string, any>; // 获取所有数据
};

/** 获取组件 */
export declare const $$: (selector: HTMLElement | string) => Component;

/** 事件详情 */
export declare type EventDetail<T = HTMLElement> = {
  rootElement: HTMLElement; // 组件根元素
  targetElement: T; // 事件目标元素
};

/** 事件数据 */
export declare type EventData = Record<string, any>;

/** 事件状态 */
export declare type State = {
  target: HTMLElement; // 目标元素
  stopPropagation(): void; // 停止事件传播
};

/** 创建渲染实例 */
export declare function $Render(component: Component | string, option?: RenderOption): SUIRender;

/** 渲染操作类 */
export declare class SUIRender {
  constructor(comp: Component | string, option?: RenderOption);
  Exec(name: string, data: Record<string, any>): Promise<string>; // 执行渲染
}

/** 获取存储 */
export declare function $Store(selector: HTMLElement | string): ComponentStore | null;

/** DOM查询 */
export declare function $Query(selector: string | HTMLElement): SUIQuery;

/** DOM操作类 */
export declare class SUIQuery {
  selector: string | Element; // 查询选择器或元素
  element: Element | null; // 当前元素
  elements: NodeListOf<Element> | null; // 匹配元素集合
  constructor(selector: string | Element);
  each(callback: (element: SUIQuery, index: number) => void): void; // 遍历元素
  elm(): Element | null; // 获取当前元素
  elms(): NodeListOf<Element> | null; // 获取所有元素
  find(selector: string): SUIQuery | null; // 查找子元素
  closest(selector: string): SUIQuery | null; // 查找最近祖先
  on(event: string, callback: (event: Event) => void): SUIQuery; // 添加事件监听
  $$(): Component | null; // 获取关联组件
  store(): ComponentStore | null; // 获取存储
  attr(name: string): string | null; // 获取属性
  data(name: string): string | null; // 获取data属性
  json(name: string): any | null; // 获取JSON数据
  hasClass(className: string): boolean; // 检查类
  prop(name: string): any | null; // 获取属性值
  removeClass(className: string | string[]): SUIQuery; // 移除类
  toggleClass(className: string | string[]): SUIQuery; // 切换类
  addClass(className: string | string[]): SUIQuery; // 添加类
  html(html?: string): SUIQuery | string; // 获取或设置HTML
}

/** 创建后端请求 */
export declare function $Backend<T = any>(route?: string, headers?: Headers): SUIBackend<T>;

/** 后端API调用类 */
export declare class SUIBackend<T = any> {
  constructor(route?: string, headers?: Headers);
  Call(method: string, ...args: any): Promise<T>; // 调用API
}

/** YAO API交互类 */
export declare class Yao {
  constructor(host?: string);
  Get(path: string, params?: object, headers?: Headers): Promise<any>; // GET请求
  Post(path: string, data?: object, params?: object, headers?: Headers): Promise<any>; // POST请求
  Download(path: string, params: object, savefile: string, headers?: Headers): Promise<void>; // 下载文件
  Fetch(method: string, path: string, params?: object, data?: object, headers?: Headers, isblob?: boolean): Promise<any>; // 通用请求
  Token(): string; // 获取token
  Cookie(cookieName: string): string | null; // 获取cookie
  SetCookie(cookieName: string, cookieValue: string, expireDays?: number): void; // 设置cookie
  DeleteCookie(cookieName: string): void; // 删除cookie
}

/** 代理消息 */
export interface AgentMessage {
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

/** 完成事件数据 */
export type AgentDoneData = AgentMessage[];

/** 消息处理器 */
export interface MessageHandler {
  (message: AgentMessage): void;
}

/** 完成处理器 */
export interface DoneHandler {
  (messages: AgentDoneData): void;
}

/** 代理事件类型 */
export type AgentEvent = "message" | "done";

/** 事件处理器 */
export interface EventHandlers {
  message?: MessageHandler;
  done?: DoneHandler;
}

/** 代理类 */
export declare class Agent {
  constructor(assistant_id: string, option: AgentOption);
  private makeChatID(): string; // 生成聊天ID
  On<E extends AgentEvent>(event: E, handler: E extends "message" ? MessageHandler : DoneHandler): Agent; // 注册事件
  Cancel(): void; // 取消代理
  Call(input: AgentInput, ...args: any[]): Promise<any>; // 调用代理
}

/** 附件信息 */
export interface AgentAttachment {
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

/** 代理输入类型 */
export type AgentInput = string | { text: string; attachments?: AgentAttachment[] };

/** 代理初始化选项 */
export interface AgentOption {
  host?: string;
  token: string;
  silent?: boolean | string | number;
  history_visible?: boolean | string | number;
  chat_id?: string;
  context?: Record<string, any>;
}
```

:::

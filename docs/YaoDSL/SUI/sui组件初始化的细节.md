# SUI 组件初化的细节

当一个页面被当成组件来使用时，它的初始化过程是怎样的呢？

比如我们有一个组件`list.html`，它一个header组件与footer组件，它们的html代码如下：

## sui模板文件

list.html:

```html
<div>
  <div is="/header"></div>

  {{title}}

  <div is="/footer"></div>
</div>
```

header.html:

````html
<div class="header">this is the header part {{title}}</div>
```html footer.html: ```html
<div class="footer">this is the footer part</div>
````

footer.html:

```html
<div class="footer" s:on-click="hello">this is the footer part</div>
```

同时给footer.html增加一个footer.ts文件，它的内容如下：

```ts
import { Component } from '@yao/sui'; //注意类型导入import一定要是以分号结尾的，否则会出错。

// 引用当前组件实例
const self = this as Component;

self.hello = function () {
  console.log('hello');
};
```

## 生成的list.sui文件

执行`yao build`命令后，会生成`list.sui`文件，它的内容如下，Yao会自动的把footer.html的内容编译成一个组件对象，并且把它的js代码嵌入到`list.sui`文件中。

```html
<!DOCTYPE html>
<html>
  <head>
    <script
      s:ns=""
      s:cn=""
      s:hash="script_5f50a1db8f374703"
      src="/assets/libsui.min.js"
      type="text/javascript"
      name="libsui"
    ></script>

    <script
      s:ns="page__footer_3"
      s:cn="comp__footer"
      s:hash="script_de036f98f46d0ca2"
      type="text/javascript"
    >
      // 这是用户定义的组件对象，组件会使用s:ready属性来关联组件的js代码，在文件加载后会触发执行
      // component是html元素对象，在组件初始化时传入html元素对象。
      // 函数名与组件名相同，用于关联组件与它的初始化函数，也可以理解如果用户创建了组件的处理函数，那它会在文档加载后被初始化。
      function comp__footer(component) {
        this.root = component; //引用html元素对象
        const __self = this; //组件对象
        // Yao框架插入的代码，每一个组件都一样，用于管理组件的状态，属性，事件等。
        this.store = new __sui_store(this.root);
        this.state = new __sui_state(this);
        this.props = new __sui_props(this.root);
        this.$root = new __Query(this.root);
        this.find = function (selector) {
          return new __Query(__self.root).find(selector);
        };
        this.query = function (selector) {
          return __self.root.querySelector(selector);
        };
        this.queryAll = function (selector) {
          return __self.root.querySelectorAll(selector);
        };
        this.render = function (name, data, option) {
          const r = new __Render(__self, option);
          return r.Exec(name, data);
        };
        this.emit = function (name, data) {
          const event = new CustomEvent(name, { detail: data });
          __self.root.dispatchEvent(event);
        };

        // --------------------->
        // 用户定义的组件代码开始，可以访问组件的其它方法与属性。
        const self = this;
        self.hello = function () {
          console.log('hello');
        };
        // <----------------------

        if (this.root.getAttribute('initialized') != 'true') {
          __self.root.setAttribute('initialized', 'true');
          __self.root.addEventListener('state:change', function (event) {
            const name = this.getAttribute('s:cn');
            const target = event.detail.target;
            const key = event.detail.key;
            const value = event.detail.value;
            const component2 = new window[name](this);
            const state = new __sui_state(component2);
            state.Set(key, value, target);
          });
          __self.once && __self.once();
        }
      }
    </script>

    <script type="text/javascript">
      let __sui_locale = {};
      try {
        __sui_locale = {};
      } catch (e) {
        __sui_locale = {};
      }

      function __m(message, fmt) {
        if (fmt && typeof fmt === 'function') {
          return fmt(message, __sui_locale);
        }
        return __sui_locale[message] || message;
      }
    </script>
  </head>
  <body s:ns="page__list_2" s:public="/" s:assets="/assets">
    <div>
      <!-- 这是用户定义的组件对象，组件会使用s:ready属性来关联组件的js代码，在文件加载后会触发执行  -->
      <div
        class="header"
        s:public="/"
        s:assets="/assets"
        s:ns="page__header_2"
        s:cn="comp__header"
        s:ready="comp__header()"
        s:route="/header"
      >
        this is the header part this is a long title that will be truncated
      </div>

      this is a long title that will be truncated

      <!-- 这是用户定义的组件对象，组件会使用s:ready属性来关联组件的js代码，在文件加载后会触发执行  -->
      <!-- s:event 表示有绑定的事件 -->
      <!-- s:event-cn 事件对应的组件 -->
      <div
        class="footer"
        s:on-click="hello"
        s:event="page__footer_3-4"
        s:event-cn="comp__footer"
        s:public="/"
        s:assets="/assets"
        s:ns="page__footer_3"
        s:cn="comp__footer"
        s:ready="comp__footer()"
        s:route="/footer"
        initialized="true"
      >
        this is the footer part
      </div>
    </div>

    <script type="text/javascript">
      try {
        // 全局对象，用于存储页面数据，包括payload,param,cookie,url,locale,timezone,direction,title等。
        var __sui_data = {
          $payload: null,
          $param: {},
          $cookie: { locale: 'en-us', 'color-theme': 'dark' },
          $url: {
            path: '/list',
            url: 'http://127.0.0.1:5099/list',
            scheme: 'http',
            domain: '127.0.0.1',
            host: '127.0.0.1:5099'
          },
          $theme: 'dark',
          $query: {},
          $locale: 'en-us',
          $timezone: '+08:00',
          $direction: 'ltr',
          title: 'this is a long title that will be truncated',
          $global: { title: 'Yao Demo App' }
        };
      } catch (e) {
        console.log('init data error:', e);
      }

      document.addEventListener('DOMContentLoaded', function () {
        // 为所有带有s:ready属性的元素执行初始化
        document.querySelectorAll('[s\\:ready]').forEach(function (element) {
          // 获取元素的s:ready方法名和组件类名
          const method = element.getAttribute('s:ready');
          const cn = element.getAttribute('s:cn');
          // 检查方法名和组件类名是否存在且组件类是可调用的
          if (method && typeof window[cn] === 'function') {
            try {
              // 实例化组件并传入元素作为参数
              new window[cn](element);
            } catch (e) {
              // 捕获并记录组件初始化错误
              const message = e.message || e || 'An error occurred';
              console.error(`[SUI] ${cn} Error: ${message}`);
            }
          }
        });
        // 初始化自定义事件处理逻辑，会再次调用组件的初始化方法
        __sui_event_init(document.body);
      });
    </script>
  </body>
</html>
```

## 组件 API 文档

构造函数为HTML组件提供以下核心功能：

1. **组件初始化**：

   - 将传入的HTML元素作为组件的根节点（`root`）。
   - 确保组件只初始化一次（通过`initialized`属性控制）。

2. **状态管理**：

   - 通过`__sui_state`对象管理组件的状态，支持状态的设置和更新。
   - 监听`state:change`事件，自动更新目标组件的状态。

3. **属性管理**：

   - 使用`__sui_props`对象管理组件的属性。

4. **DOM查询**：

   - 提供`find`、`query`和`queryAll`方法，分别用于查找单个元素、查询单个元素和查询所有匹配元素。

5. **渲染功能**：

   - 通过`render`方法支持动态渲染，结合模板名称和数据生成内容。

6. **事件触发**：

   - 使用`emit`方法触发自定义事件，允许组件间通信。

7. **一次性初始化钩子**：
   - 支持`once`方法，用于执行组件初始化时的自定义逻辑。

## 属性与方法

### 属性

- `root`：组件的根HTML元素。
- `store`：Yao框架提供的存储对象，用于管理组件状态。
- `state`：状态管理对象，用于设置和获取组件状态。
- `props`：属性管理对象，用于操作组件的属性。
- `$root`：基于`__Query`的根节点查询对象。
- `find(selector)`：查询匹配选择器的第一个元素，返回`__Query`对象。
- `query(selector)`：查询匹配选择器的第一个DOM元素。
- `queryAll(selector)`：查询所有匹配选择器的DOM元素。
- `render(name, data, option)`：根据模板名称和数据在服务器端渲染内容并更新前端页面。
- `emit(name, data)`：触发指定名称的自定义事件，并传递数据。
- `once`：可选的初始化钩子函数，仅在组件首次初始化时执行。

### 区别

`store`和`state`的区别在于：

- `store`是一个针对于组件本身，用于存储当前组件状态，每一个组件都有自己的`store`,并且使用了html自定义属性进行状态的保存。
- `state`是不同组件之进行通信，传递组件间状态变化的状态。

`emit`和`state:change`的区别在于：

- `emit`可以触发所有的自定义事件，比如在html组件页面中配置了`s:on-xxxx`事件，可以调用方法`emit`来触发。
- `state:change`是专门用于组件间通信的事件，当组件状态发生变化时，会触发`state:change`事件，并调用组件中的watch配置的回调函数。

### 事件

- `state:change`：当组件状态发生变化时触发,sui内部会管理此事件的处理，用户只需要在watch函数里处理状态事件，事件对象包含以下属性：
  - `target`：目标组件。
  - `key`：状态键。
  - `value`：状态值。

## 使用示例

### 定义一次性初始化逻辑

```js
// 定义一次性初始化逻辑
self.once = function () {
  console.log('FooterComponent 初始化完成');
  // 设置初始状态
  self.state.Set('text', '欢迎使用页脚组件！');
};
```

### 触发自定义事件

```js
// 示例：触发自定义事件
self.emit('footer:ready', { status: 'initialized' });
```

### 监听状态

```js
self.watch = {
  opened: (value: boolean) => {
    if (value) return open();
    return close();
  }
}
```

## 总结

sui模板引擎会把用户的编写的代码与内置的模板代码结合一起组合成一个完整的组件函数，然后把它嵌入到html文件中。

组件的初始化过程是这样的：

1. 当页面加载时，会执行`DOMContentLoaded`事件，会为所有带有`s:ready`属性的元素执行初始化。
2. 初始化时，会实例化组件并传入元素作为参数。
3. 组件的初始化函数会被执行，会执行用户定义的组件代码。
4. 组件的初始化函数会为组件的元素添加事件处理函数，用于处理组件的事件。
5. 组件的初始化函数会为组件的元素添加`s:ready`属性，用于标记组件已经初始化。

组件的构建函数会在以下的情况下被调用：

- 页面加载时
- 事件绑定时
- state改变时

## 注意

- 避免在组件的代码中进行全局初始化操作，因为此函数是一个组件的构建函数，组件的代码可能会多次调用，比如在页面加载时会调用，在事件绑定时也会调用，如果需要避免多次调用，在once函数里调用初始化代码。

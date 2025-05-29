# SUI 页面自动插入的内容

## 自动注入的脚本

在 sui 页面编译过程中，会自动的在页面中插入一些内容。

- 全局数据。

- 组件关连的脚本。

- 全局 js 对象。
  为了方便用户操作页面，sui 页面会自动的注入一些全局对象。

### Yao 全局工具类对象

用于操作页面的一些 API。比如获取 Token，获取 Cookie，设置 Cookie，删除 Cookie，序列化数据等。

```ts
/**
 * Yao Object
 * @param {*} host
 */
function Yao(host) {}

/**
 * Get API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Get = async function (path, params, headers) {};

/**
 * Post API
 * @param {*} path
 * @param {*} data
 * @param {*} params
 * @param {*} headers
 */
Yao.prototype.Post = async function (path, data, params, headers) {};

/**
 * Download API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Download = async function (path, params, savefile, headers) {};

/**
 *
 * Fetch API
 * @param {*} method
 * @param {*} path
 * @param {*} params
 * @param {*} data
 * @param {*} headers
 */
Yao.prototype.Fetch = async function (
  method,
  path,
  params,
  data,
  headers,
  isblob
) {};
/** 获取Token */
Yao.prototype.Token = function () {};
/** 获取Cookie */
Yao.prototype.Cookie = function (cookieName) {};
/** 设置Cookie */
Yao.prototype.SetCookie = function (cookieName, cookieValue, expireDays) {};
/** 删除Cookie */
Yao.prototype.DeleteCookie = function (cookieName) {};

/**
 * Serialize To Query String
 * @param {*} obj
 * @returns
 */
Yao.prototype.Serialize = function (obj) {};
```

使用方法：

```js
// 创建一个新的Yao实例
const yao = new Yao();
// 获取当前的Token
const token = yao.Token();
// 获取指定名称的Cookie值
const cookie = yao.Cookie('cookieName');
// 设置Cookie,有效期7天
yao.SetCookie('cookieName', 'cookieValue', 7);
// 删除指定名称的Cookie
yao.DeleteCookie('cookieName');
// 将对象序列化为查询字符串
const data = yao.Serialize({ key: 'value' });

// 发送GET请求到指定路径
const rest = await yao.Get('/api/path', params, headers);
// 发送POST请求到指定路径
const rest = await yao.Post('/api/path', { key: 'value' }, params, headers);
// savefile filename to save
// 下载文件到指定路径
await yao.Download('/api/path', params, savefile, headers);
```

### SUI 组件操作

在前端针对于SUI 组件进行Query查询选择器，返回一个`$Query`对象,通过此对象可以对组件进行详细的操作。

```ts
function $Query(selector: string | Element): __Query {
  return new __Query(selector);
}
```

使用方法,类似于Jquery。

```js
$Query('[category]').each((el) => {
  el.removeClass(active).addClass(inactive);
});
```

实现的细节，主要是用于操作页面 HTML DOM 的对象。

```ts
/**
 * Class for DOM manipulation and traversal.
 */
class __Query {
  /**
   * The selector or element used for querying.
   */
  selector: string | Element | NodeListOf<Element> | undefined = '';
  /**
   * All matched elements or null.
   */
  elements: NodeListOf<Element> | null = null;
  /**
   * Create a query instance.
   */
  element: Element | null = null;

  /**
   * Create a query instance.
   */
  constructor(selector: string | Element | NodeListOf<Element>) {
    if (typeof selector === 'string') {
      this.selector = selector;
      this.elements = document.querySelectorAll(selector);
      if (this.elements.length > 0) {
        this.element = this.elements[0];
      }
    } else if (selector instanceof NodeList) {
      this.elements = selector;
      if (this.elements.length > 0) {
        this.element = this.elements[0];
      }
    } else {
      this.element = selector;
    }

    this.selector = selector;
  }
  /**
   * Get the current element.
   */
  elm(): Element | null {
    return this.element;
  }

  /**
   * Get all matched elements.
   */
  elms(): NodeListOf<Element> | null {
    return this.elements;
  }

  /**
   * Find child elements by selector.
   */
  find(selector: string): __Query | null {
    const elm = this.element?.querySelector(selector);
    if (elm) {
      return new __Query(elm);
    }
    return null;
  }

  findAll(selector: string): __Query | null {
    const elms = this.element?.querySelectorAll(selector);
    if (elms) {
      return new __Query(elms);
    }
    return null;
  }

  /**
   * Find the closest matching ancestor.
   */
  closest(selector: string): __Query | null {
    const elm = this.element?.closest(selector);
    if (elm) {
      return new __Query(elm);
    }
    return null;
  }

  /**
   * Add event listener.
   */
  on(event: string, callback: (event: Event) => void): __Query {
    if (!this.element) {
      return this;
    }
    this.element.addEventListener(event, callback);
    return this;
  }

  //根组件
  $$() {
    if (!this.element) {
      return null;
    }
    const root = this.element.closest('[s\\:cn]');
    if (!root) {
      return null;
    }

    // @ts-ignore
    return $$(root);
  }
  /**
   * Iterate over elements.
   */
  each(callback: (element: __Query, index: number) => void) {
    if (!this.elements) {
      return;
    }
    this.elements.forEach((element, index) => {
      callback(new __Query(element), index);
    });
    return;
  }

  /**
   * Get the associated store.
   */
  store() {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }

    // @ts-ignore
    return new __sui_store(this.element);
  }

  /**
   * Get an attribute value.
   */
  attr(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    return this.element.getAttribute(key);
  }

  /**
   * Get data-attribute value.
   */
  data(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    return this.element.getAttribute('data:' + key);
  }

  /**
   * Get JSON data.
   */
  json(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    const v = this.element.getAttribute('json:' + key);
    if (!v) {
      return null;
    }
    try {
      return JSON.parse(v);
    } catch (e) {
      console.error(`Error parsing JSON for key ${key}: ${e}`);
      return null;
    }
  }

  /**
   * Get a property value.
   */
  prop(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    const k = 'prop:' + key;
    const v = this.element.getAttribute(k);
    const json = this.element.getAttribute('json-attr-prop:' + key) === 'true';
    if (json && v) {
      try {
        return JSON.parse(v);
      } catch (e) {
        console.error(`Error parsing JSON for prop ${key}: ${e}`);
        return null;
      }
    }
    return v;
  }

  /**
   * Check if the element has a class.
   */
  hasClass(className) {
    return this.element?.classList.contains(className);
  }

  /**
   * Toggle classes.
   */
  toggleClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.toggle(v);
    });
    return this;
  }

  /**
   * Remove classes.
   */
  removeClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.remove(v);
    });
    return this;
  }

  /**
   * Add classes.
   */
  addClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.add(v);
    });
    return this;
  }

  /**
   * Get or set inner HTML.
   */
  html(html?: string): __Query | string {
    if (html === undefined) {
      return this.element?.innerHTML || '';
    }
    if (this.element) {
      this.element.innerHTML = html;
    }
    return this;
  }
}
```

### SUI 组件选择器

`$Query`中的`$$`方法用于获取sui页面中定义的Compoment对象，与`$Query`的区别是，`$$`方法会返回一个`sui前端组件对象`，而`$Query`方法会返回一个`html dom`对象。而sui前端组件对象中包含了组件的状态，事件，属性，方法等。

`$$`方法可以通过组件的名称来获取组件对象，比如`$$('input')`会返回一个`input`组件对象。或是通过组件的html元素来获取组件对象，比如`$$(document.querySelector('input'))`会返回一个`input`组件对象。

```ts
/**
 * Dom Object
 * @param {*} selector 选择器,html元素或是组件，
 * @returns Sui 组件
 */
function $$(selector) {
  let elm: HTMLElement | null = null;
  if (typeof selector === 'string') {
    elm = document.querySelector(selector);
  }

  if (selector instanceof HTMLElement) {
    elm = selector;
  }

  if (elm) {
    const cn = elm.getAttribute('s:cn');
    if (cn && cn != '' && typeof window[cn] === 'function') {
      const component = new window[cn](elm);
      //elm ,html元素，
      //yao component组件对象，每一个组件都会有对应的js对象,会在编译的过程中自动生成。
      return new __sui_component(elm, component);
    }
  }
  return null;
}
```

这里会有点复杂，sui 前端组件中包含了不同的对象，比如状态，事件处理，属性，方法等。

```ts
/**
 * 创建一个sui组件对象
 * @param {*} elm 组件的html元素
 * @param {*} component 组件对象，用户通常需要自定义组件对象的处理函数，与组件同名的js或是ts文件。
 * @returns sui组件对象
 */
function __sui_component(elm, component) {
  this.root = elm;

  // 读取与保存组件的状态数据
  // $$(dropdown).store.Get("selected")
  this.store = new __sui_store(elm); //保存组件的数据

  // 父组件传入的属性
  this.props = new __sui_props(elm); //保存组件的属性

  //组件的事件处理，使用Set方法来触发事件处理函数。
  this.state = component ? new __sui_state(component) : {}; //保存组件的状态

  const __self = this;

  //封装 html 对象
  this.$root = new __Query(this.root);

  this.find = function (selector) {
    // @ts-ignore
    return new __Query(__self.root).find(selector);
  };
  // 查找组件的子组件
  // 示例： $$(input).query("[input-element]").setAttribute("placeholder", placeholder);
  this.query = function (selector) {
    return __self.root.querySelector(selector);
  };
  // 查找组件的子组件列表
  this.queryAll = function (selector) {
    return __self.root.querySelectorAll(selector);
  };
  // 触发组件事件
  this.emit = function (name, data) {
    const event = new CustomEvent(name, { detail: data });
    __self.root.dispatchEvent(event);
  };
  // 渲染组件
  this.render = function (name, data, option) {
    // @ts-ignore
    const r = new __Render(__self, option);
    return r.Exec(name, data);
  };
}

/**
 * sui组件的状态处理细节。
 *
 * SUI组件的状态处理，组件通过回调函数进行响应处理，如果在组件中定义了watch对象，则会自动调用watch中的函数。
 *
 * 把事件向传到父组件中，父组件可以通过watch对象来监听组件的状态变化。
 *
 * @param {*} component yao sui组件对象，用户通常需要自定义组件对象的处理函数，与组件同名的js或是ts函数。
 */
function __sui_state(component) {
  //组件需要在组件对象中定义watch对象，用于监听组件状态的变化。
  this.handlers = component.watch || {};

  //调用Set函数来触发组件的watch对象中的监听函数。
  this.Set = async function (key, value, target) {
    const handler = this.handlers[key];
    //target对象默认是当前组件对象，如果target对象是组件对象，则使用组件对象中的root对象【html对象】。
    target = target || component.root;
    if (handler && typeof handler === 'function') {
      const stateObj = {
        target: target,
        stopPropagation: function () {
          target.setAttribute('state-propagation', 'true');
        }
      };
      //watch中的监听函数被调用时，会传入两个参数，第一个参数是新的值，第二个参数是状态对象，可以理解成事件对象。
      await handler(value, stateObj);
      // 默认情况下会向上传播状态变化，除非在watch中的函数中调用了stateObj.stopPropagation()函数。
      const isStopPropagation = target
        ? target.getAttribute('state-propagation') === 'true'
        : false;
      if (isStopPropagation) {
        return;
      }

      let parent = component.root.parentElement?.closest(`[s\\:cn]`);
      if (parent == null) {
        return;
      }

      // Dispatch the state change custom event to parent component
      const event = new CustomEvent('state:change', {
        detail: { key: key, value: value, target: component.root }
      });
      parent.dispatchEvent(event);
    }
  };
}

/**
 * 组件的读取，只读取props:开头的属性。当一个组件被其它组件使用时，
 * 在编译过程中，会把上级的属性并且以`props`为前缀的复制到子组件中。
 * 所以这些属性都是只读的，不能修改。
 *
 * @param {*} elm 组件的html元素
 * @returns
 */
function __sui_props(elm) {
  this.Get = function (key) {
    if (!elm || typeof elm.getAttribute !== 'function') {
      return null;
    }
    const k = 'prop:' + key;
    const v = elm.getAttribute(k);
    const json = elm.getAttribute('json-attr-prop:' + key) === 'true';
    if (json) {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    }
    return v;
  };

  this.List = function () {
    const props = {};
    if (!elm || typeof elm.getAttribute !== 'function') {
      return props;
    }

    const attrs = elm.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.name.startsWith('prop:')) {
        const k = attr.name.replace('prop:', '');
        const json = elm.getAttribute('json-attr-prop:' + k) === 'true';
        if (json) {
          try {
            props[k] = JSON.parse(attr.value);
          } catch (e) {
            props[k] = null;
          }
          continue;
        }
        props[k] = attr.value;
      }
    }
    return props;
  };
}
```

### Store 对象

Store 选择器，返回html元素或是组件对象中关联的状态信息，也可以直接使用`$Query('').store`来引用。

```ts
function $Store(elm) {
  if (!elm) {
    return null;
  }

  if (typeof elm === 'string') {
    elm = document.querySelectorAll(elm);
    if (elm.length == 0) {
      return null;
    }
    elm = elm[0];
  }
  // @ts-ignore
  return new __sui_store(elm);
}
```

使用示例：

```js
function selectItem(el: HTMLElement) {
  const store = $Store(el);
  const item = store.GetJSON("item");
  store.SetJSON("item", { ...item, selected: true });
}
```

实现的细节。

函数返回一个封装html元素/sui组件数据存储关联操作的对象，可以理解成一个获取或是设置html元素属性数据的对象。yao sui组件的元素数据存储在html元素的自定义属性中，而不是像react或是vue有一个专门的store保存对象。可以理解成html元素的自定义属性。这样做的好处是可以方便的在html元素中保存数据，而不需要单独的store对象，并且可以直接前后端共享数据。后端在渲染页面时，可以直接把数据保存在html元素的自定义属性中，前端在渲染页面时，可以直接从html元素的自定义属性中获取数据。

```ts
/**
 * 组件的状态处理，利用组件/html元素的自定义属性来保存组件的数据
 *
 * @param {*} elm 组件的html元素
 * @returns
 *
 */
function __sui_store(elm) {
  elm = elm || document.body;

  this.Get = function (key) {
    return elm.getAttribute('data:' + key);
  };
  //把数据保存在组件的html元素中
  this.Set = function (key, value) {
    elm.setAttribute('data:' + key, value);
  };

  this.GetJSON = function (key) {
    const value = elm.getAttribute('json:' + key);
    if (value && value != '') {
      try {
        const res = JSON.parse(value);
        return res;
      } catch (e) {
        const message = e.message || e || 'An error occurred';
        console.error(`[SUI] Event Handler Error: ${message}`, elm);
        return null;
      }
    }
    return null;
  };

  this.SetJSON = function (key, value) {
    elm.setAttribute('json:' + key, JSON.stringify(value));
  };

  //后端的数据会通过这个属性传输到前端。
  //组件需要在后端脚本【组件同名的.backend.ts】中BeforeRender方法中设置组件的数据。
  this.GetData = function () {
    return this.GetJSON('__component_data') || {};
  };
}
```

## 多语言

语言翻译，多语言，在后端页面或是组件中如果有配置了多语言，在页面渲染后，则会把多语言数据保存在`__sui_locale`对象中。在 js 脚本中可以使用`__m`进行翻译。

```html
<script type="text/javascript">
  let __sui_locale = {};
  try {
  	__sui_locale = %s;
  } catch (e) { __sui_locale = {}  }

  function __m(message, fmt) {
  	if (fmt && typeof fmt === "function") {
  		return fmt(message, __sui_locale);
  	}
  	return __sui_locale[message] || message;
  }
</script>
```

## 全局对象

在页面渲染时，会把用户请求的数据作为全局数据保存在`__sui_data`对象中。`__sui_data` 保存了页面的全局数据。包含请求的对象，cookie，主题，语言，时区，payload，参数，url 等。

在浏览器中加载页面时，会自动的加载页面中所有的组件初始化脚本，比如加载事件处理，处理`s:ready`事件。

```html
<script name="imports" type="json">
  []
</script>

<script type="text/javascript">
  try {
    var __sui_data = {
      $query: { x: ['1223'] },
      $cookie: {
        TOKEN:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic2lkIjoiMWYzZTMxNjQtYjM1ZS00MWU4LTkwZGUtNjZkOWM1ZjgxOTMxIiwiZGF0YSI6e30sImF1ZCI6IllhbyBQcm9jZXNzIHV0aWxzLmp3dC5NYWtlIiwiZXhwIjoxNzEwOTU3OTUwLCJqdGkiOiIxIiwiaWF0IjoxNzEwOTI5MTUwLCJpc3MiOiJ4aWFuZzoxIiwibmJmIjoxNzEwOTI5MTUwLCJzdWIiOiJVc2VyIFRva2VuIn0.P3pTPWn9jF__3vjo9-u7m66j9H_1IcC2zLNMCi4V8BE'
      },
      $theme: null,
      $locale: null,
      $timezone: '+08:00',
      $payload: null,
      $param: {},
      $url: {
        host: 'localhost:5099',
        domain: 'localhost',
        path: '/demo/index',
        scheme: 'http',
        url: 'http://localhost:5099/demo/index'
      },
      $direction: 'ltr'
    };
  } catch (e) {
    console.log('init data error:', e);
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      document.querySelectorAll('[s\\:ready]').forEach(function (element) {
        const method = element.getAttribute('s:ready');
        const cn = element.getAttribute('s:cn');
        if (method && typeof window[cn] === 'function') {
          try {
            window[cn](element);
          } catch (e) {
            const message = e.message || e || 'An error occurred';
            console.error(`[SUI] ${cn} Error: ${message}`);
          }
        }
      });
    } catch (e) {}
  });
</script>
```

## 组件初始化

函数`__sui_event_init`会在页面加载完成后调用，初始化绑定页面及组件的事件。

在组件中，使用`s:event-xxxx`属性来绑定事件，事件的的参数可以使用以下两种方法来直接传递参数：

- 在组件中使用`s:data-xxxx`属性,`s:json-xxxx`属性来设置事件的数据，在页面编译过程中`s:data-xxxx`属性会转换成`data:xxx`属性，`s:json-xxx`属性会转换成`json:xxx`属性。
- 也可以在组件中使用`data:xxx`属性,`json:xxxx`属性来设置事件的数据。

```html
<li
  s:for="categories"
  class="
      px-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-200
      hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer
      border-b-2 
      {{ item.name == articles.category ? 'text-primary-500 dark:text-primary-400  border-primary-500 dark:border-primary-400' : 'border-transparent ' }}
    "
  s:data-category="{{ item.name }}"
  s:on-click="LoadCategory"
  category
>
  {{ item.name }}
</li>
```

在页面对应的`<componentid>.ts`中，编写前端事件响应处理函数，需要注意的是这个是前端js，不是`<componentid>.backend.ts`。

```ts
/**
 * When category is changed, load articles
 * @param event 浏览器事件
 * @param data 组件的关联数据
 * @prram detail 事件关联的数据
 */
self.LoadCategory = async function (
  event: MouseEvent, //html 事件
  data: EventData, //在这个参数中会接收在组件中配置的所有的data属性，比如上面的调用会传入{category:xxxx}
  detail: {
    rootElement: HtmlElement; //即是本组件
    targetElement: HtmlElement; // 点击的元素,事件源
  }
) {
  // Active and inactive class
  const active =
    'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400';
  const inactive = 'border-transparent';

  // Prevent default behavior ( href redirect )
  event.preventDefault();

  // Get category and store it
  const category = data.category || null;
  self.store.Set('category', category);

  // Change item style
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
    // Current category
    if ($Store(el.element as HTMLElement).Get('category') === category) {
      el.removeClass(inactive).addClass(active);
    }
  });

  // Load articles
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);

  // Render articles
  await self.render('articles', { articles });
};
```

示例 2：

组件配置

```html
<div
  s:else
  class="flex items-center"
  s:on-click="onItemClick"
  data:xxs="px-4"
  s:data-index="{{ index }}"
  s:json-item="{{ item }}"
  data-value="{{ item.value }}"
  class="
        flex items-center justify-between cursor-pointer rounded-lg
        transition-none hover:transition hover:duration-200 hover:ease-in-out
        {{ itemSizeClass }} {{ itemColorClass }}
        
      "
  item
></div>
```

组件对应的js脚本。

```ts
/**
 *  When the item is clicked, raise the item-click event and toggle the selected state
 * @param event
 * @param data
 * @param detail
 * @returns
 */
self.onItemClick = (
  event: Event,
  data: Record<string, any>,
  detail: Record<string, any>
) => {
  debugger;
  event.stopPropagation();
  const item = data.item || {};
  const props = self.store.GetData(); //这里是取的`.backend.ts`中函数`BeforeRender`返回对象。
  const mode = props.mode || 'single';

  // Single mode select the item
  if (mode == 'single') {
    unselectAllItems();
    selectItem(detail.targetElement);
    self.root.dispatchEvent(new CustomEvent('item-click', { detail: item }));
    return;
  }

  // Multiple mode item has been selected
  if (item.selected) {
    unselectItem(detail.targetElement);
    self.root.dispatchEvent(
      new CustomEvent('item-click', { detail: { ...item, selected: false } })
    );
    return;
  }

  // Multiple mode item unselected
  selectItem(detail.targetElement);
  self.root.dispatchEvent(
    new CustomEvent('item-click', { detail: { ...item, select: true } })
  );
  return;
};
```

```ts
/**
 * 事件处理
 * @param event 浏览器原始事件
 * @param dataKeys 在组件中使用data:xxxx属性定义的属性，使用self.store.Get()/Set()可以访问或是设置组件的data数据。
 * @param jsonKeys 在组件中使用json:xxxx属性定义的属性, 使用self.store.GetJSON()/SetJSON()可以访问或是设置组件的json数据。
 * @param target 事件源,HTML元素，比如组件中的某一个按钮或是html元素
 * @param root SUI组件所在的根元素，HTML元素
 * @param handler 在`.backend.ts`中定义的事件响应处理函数
 * @returns
 */
function __sui_event_handler(
  event,
  dataKeys,
  jsonKeys,
  target,
  root,
  handler: Function
) {
  const data = {};
  target = target || null;
  if (target) {
    dataKeys.forEach(function (key) {
      const value = target.getAttribute('data:' + key);
      data[key] = value;
    });
    jsonKeys.forEach(function (key) {
      const value = target.getAttribute('json:' + key);
      data[key] = null;
      if (value && value != '') {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          const message = e.message || e || 'An error occurred';
          console.error(`[SUI] Event Handler Error: ${message} `, target);
        }
      }
    });
  }
  // 用户定义的事件处理函数
  handler &&
    handler(event, data, {
      rootElement: root,
      targetElement: target
    });
}

/**
 * 事件初始化
 * @param elm 页面的根元素
 * @returns
 */
function __sui_event_init(elm: Element) {
  /**
   * 绑定事件
   * @param eventElm 事件源
   * @returns
   */
  const bindEvent = (eventElm) => {
    const cn = eventElm.getAttribute('s:event-cn') || '';
    if (cn == '') {
      console.error('[SUI] Component name is required for event binding', elm);
      return;
    }

    // Data keys
    // 收集用户定义的事件
    const events: Record<string, string> = {};
    //收集data:xxxx属性
    //收集json:xxxx属性
    const dataKeys: string[] = [];
    const jsonKeys: string[] = [];
    for (let i = 0; i < eventElm.attributes.length; i++) {
      if (eventElm.attributes[i].name.startsWith('data:')) {
        dataKeys.push(eventElm.attributes[i].name.replace('data:', ''));
      }
      if (eventElm.attributes[i].name.startsWith('json:')) {
        jsonKeys.push(eventElm.attributes[i].name.replace('json:', ''));
      }
      if (eventElm.attributes[i].name.startsWith('s:on-')) {
        const key = eventElm.attributes[i].name.replace('s:on-', '');
        events[key] = eventElm.attributes[i].value;
      }
    }

    // Bind the event
    for (const name in events) {
      const bind = events[name];
      if (cn == '__page') {
        const handler = window[bind];
        const root = document.body;
        const target = eventElm;
        eventElm.addEventListener(name, (event) => {
          __sui_event_handler(event, dataKeys, jsonKeys, target, root, handler);
        });
        continue;
      }
      //如果是子组件，需要找到它的父组件
      const component = eventElm.closest(`[s\\:cn=${cn}]`);
      if (typeof window[cn] !== 'function') {
        console.error(`[SUI] Component ${cn} not found`, eventElm);
        return;
      }

      // @ts-ignore
      const comp = new window[cn](component);
      const handler = comp[bind];
      const root = comp.root;
      const target = eventElm;
      eventElm.addEventListener(name, (event) => {
        __sui_event_handler(event, dataKeys, jsonKeys, target, root, handler);
      });
    }
  };

  //查询所有包含s:event属性的元素
  const eventElms = elm.querySelectorAll('[s\\:event]');
  //查询所有包含s:event-jit属性的元素
  const jitEventElms = elm.querySelectorAll('[s\\:event-jit]');
  eventElms.forEach((eventElm) => bindEvent(eventElm));
  jitEventElms.forEach((eventElm) => bindEvent(eventElm));
}
```

## 浏览器渲染组件

在浏览器中，无刷新更新部分页面组件的方法。

通过调用 api，传入上下文数据，返回页面的 html 代码，在浏览器中无刷新替换页面源代码，不需要整个页面刷新。

组件需要设置属性：`s:render="name"`。

```ts
class __Render {
  comp = null;
  option = null;
  constructor(comp, option) {
    this.comp = comp;
    this.option = option;
  }
  async Exec(name, data): Promise<string> {
    // @ts-ignore
    return __sui_render(this.comp, name, data, this.option);
  }
}

/**
 * SUI Render
 * @param component
 * @param name
 */
async function __sui_render(
  component: Component | string,
  name: string,
  data: Record<string, any>,
  option?: RenderOption
): Promise<string> {
  const comp = // 获取组件，可以传入组件名称
    // sui_component
    (typeof component === 'object' ? component : $$(component)) as Component;

  if (comp == null) {
    console.error(`[SUI] Component not found: ${component}`);
    return Promise.reject('Component not found');
  }

  const elms = comp.root.querySelectorAll(`[s\\:render=${name}]`);
  if (!elms.length) {
    console.error(`[SUI] No element found with s:render=${name}`);
    return Promise.reject('No element found');
  }

  // Set default options
  option = option || {};
  option.replace = option.replace === undefined ? true : option.replace;
  option.showLoader =
    option.showLoader === undefined ? false : option.showLoader;
  option.withPageData =
    option.withPageData === undefined ? false : option.withPageData;

  // Prepare loader
  let loader = `<span class="sui-render-loading">Loading...</span>`;
  if (option.showLoader && option.replace) {
    if (typeof option.showLoader === 'string') {
      loader = option.showLoader;
    } else if (option.showLoader instanceof HTMLElement) {
      loader = option.showLoader.outerHTML;
    }
    elms.forEach((elm) => (elm.innerHTML = loader));
  }

  // Prepare data
  let _data = comp.store.GetData() || {};
  if (option.withPageData) {
    // @ts-ignore
    _data = { ..._data, ...__sui_data };
  }

  // get s:route attribute
  const elm = comp.root.closest('[s\\:route]');
  const routeAttr = elm ? elm.getAttribute('s:route') : false;
  const root = document.body.getAttribute('s:public') || '';
  const route = routeAttr ? `${root}${routeAttr}` : window.location.pathname;
  option.component = (routeAttr && comp.root.getAttribute('s:cn')) || '';

  const url = `/api/__yao/sui/v1/render${route}`;
  const payload = { name, data: _data, option };

  // merge the user data
  if (data) {
    for (const key in data) {
      payload.data[key] = data[key];
    }
  }
  const headers = {
    'Content-Type': 'application/json',
    Cookie: document.cookie
  };

  // Native post request to the server
  try {
    const body = JSON.stringify(payload);
    const response = await fetch(url, { method: 'POST', headers, body: body });
    const text = await response.text();
    if (!option.replace) {
      return Promise.resolve(text);
    }

    // Set the response text to the elements
    elms.forEach((elm) => {
      elm.innerHTML = text;
      try {
        // 重新初始化新生成的组件的事件
        __sui_event_init(elm);
      } catch (e) {
        const message = e.message || 'Failed to init events';
        Promise.reject(message);
      }
    });

    return Promise.resolve(text);
  } catch (e) {
    //Set the error message
    elms.forEach((elm) => {
      elm.innerHTML = `<span class="sui-render-error">Failed to render</span>`;
      console.error('Failed to render', e);
    });
    return Promise.reject('Failed to render');
  }
}
```

使用示例参考上面的`LoadCategory`,页面用户点击某个分类时，使用api获取后端文章列表，进行部分页面更新。

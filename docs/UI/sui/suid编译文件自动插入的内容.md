# SUI 页面自动插入的内容

sui lib 内容，主要是 js 脚本。

函数`$$`类型于 jquery 的组件选择函数，返回一个 sui 组件，包含组件数据与状态。

```html
<script name="sui" type="text/javascript">
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) =>
        x.done
          ? resolve(x.value)
          : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  function __sui_state(component) {
    this.handlers = component.watch || {};
    this.Set = function (key, value) {
      return __async(this, null, function* () {
        const handler = this.handlers[key];
        if (handler && typeof handler === 'function') {
          yield handler(value);
        }
      });
    };
  }
  function __sui_props(elm2) {
    this.Get = function (key) {
      return elm2 && elm2.getAttribute(key);
    };
  }
  function __sui_component(elm2, component) {
    this.root = elm2;
    this.store = new __sui_store(elm2);
    this.props = new __sui_props(elm2);
    this.state = component ? new __sui_state(component) : {};
  }
  function $$(selector) {
    elm = null;
    if (typeof selector === 'string') {
      elm = document.querySelector(selector);
    }
    if (selector instanceof HTMLElement) {
      elm = selector;
    }
    if (elm) {
      cn = elm.getAttribute('s:cn');
      if (cn != '' && typeof window[cn] === 'function') {
        const component = new window[cn](elm);
        return new __sui_component(elm, component);
      }
    }
    return null;
  }
  function __sui_event_handler(event, dataKeys, jsonKeys, elm2, handler) {
    const data = {};
    dataKeys.forEach(function (key) {
      const value = elm2.getAttribute('data:' + key);
      data[key] = value;
    });
    jsonKeys.forEach(function (key) {
      const value = elm2.getAttribute('json:' + key);
      data[key] = null;
      if (value && value != '') {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          const message = e.message || e || 'An error occurred';
          console.error(`[SUI] Event Handler Error: ${message}`, elm2);
        }
      }
    });
    handler && handler(event, data, elm2);
  }
  function __sui_store(elm2) {
    elm2 = elm2 || document.body;
    this.Get = function (key) {
      return elm2.getAttribute('data:' + key);
    };
    this.Set = function (key, value) {
      elm2.setAttribute('data:' + key, value);
    };
    this.GetJSON = function (key) {
      const value = elm2.getAttribute('json:' + key);
      if (value && value != '') {
        try {
          const res = JSON.parse(value);
          return res;
        } catch (e) {
          const message = e.message || e || 'An error occurred';
          console.error(`[SUI] Event Handler Error: ${message}`, elm2);
          return null;
        }
      }
      return null;
    };
    this.SetJSON = function (key, value) {
      elm2.setAttribute('json:' + key, JSON.stringify(value));
    };
  }
</script>
```

语言翻译，多语言，在 js 脚本中可以使用`__m`进行翻译。

```html
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
```

加载事件处理，处理`s:ready`事件。

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
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic2lkIjoiMWYzZTMxNjQtYjM1ZS00MWU4LTkwZGUtNjZkOWM1ZjgxOTMxIiwiZGF0YSI6e30sImF1ZCI6IllhbyBQcm9jZXNzIHV0aWxzLmp3dC5NYWtlIiwiZXhwIjoxNzEwOTU3OTUwLCJqdGkiOiIxIiwiaWF0IjoxNzEwOTI5MTUwLCJpc3MiOiJ4aWFuZzoxIiwibmJmIjoxNzEwOTI5MTUwLCJzdWIiOiJVc2VyIFRva2VuIn0.P3pTPWn9jF__3vjo9-u7m66j9H_1IcC2zLNMCi4V8BE',
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
        url: 'http://localhost:5099/demo/index',
      },
      $direction: 'ltr',
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

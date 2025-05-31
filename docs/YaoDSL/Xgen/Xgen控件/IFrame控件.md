# IFrame控件

## 文档概述

IFrame控件是Yao DSL中Xgen框架的一个组件，主要用于在表单中嵌入iframe内容。主要功能包括：

xgen通过url与参数把参数传递给iframe，并监听iframe的内容变化。

iframe控件通过解析url参数获取内容，在iframe中进行数据渲染或是修改。最后通过消息机制通知父窗口。

一个控件就是一个iframe控件。

- 需要注意的是url长度是有限制的，大容量的数据不适合使用。
- 每一个控件就是一个iframe控件，会增加页面的加载时间与消耗过多的资源。

## 组件配置

1. **基本配置**：

   - 通过`type: "Frame"`声明iframe类型
   - 可设置高度(height)、URL地址(url)等属性

2. **参数传递**：

   - 支持通过`params`向iframe传递参数
   - 支持模板变量如`{{ name }}`

3. **交互功能**：

   - 支持与父窗口通信(postMessage)
   - 可监听内容变化并通知父组件
   - 支持动态调整iframe尺寸

4. **AI辅助**：

   - 内置AI提示功能(ai.placeholder)

5. **样式定制**：
   - 支持明暗主题切换
   - 提供丰富的CSS变量配置

## 使用示例

````json

```json
{
  "fields": {
    "form": {
      "Frame Component": {
        "bind": "frame_component",
        "edit": {
          "type": "Frame",
          "props": {
            "ai": { "placeholder": "你可以这样问我：帮我生成一个文字" },
            "url": "/iframes/edit/edit.html", // @ /public/iframes/edit
            "height": "200px",
            "params": { "foo": "bar", "name": "{{ name }}" }
          }
        }
      }
    }
  }
}
````

public/iframes/edit/edit.html

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Edit</title>
    <link rel="stylesheet" type="text/css" href="edit.css" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="component" class="hidden">
      <label id="label" for="input"></label>
      <input type="text" id="input" onchange="onComponentChange" />
    </div>
    <script src="edit.js"></script>
  </body>
</html>
```

public/iframes/edit/edit.css

```css
:root {
  --r: 51;
  --g: 113;
  --b: 252;
  --h: 221;
  --s: 97.1%;
  --l: 59.4%;
  --color_main: #3371fc;
  --color_text: #111;
  --color_text_grey: #999;
  --color_text_contrast: black;
  --color_title: #363636;
  --color_title_grey: #a9abac;
  --color_warning: #faad14;
  --color_success: #00c853;
  --color_danger: #e62965;
  --color_placeholder: #727272;
  --color_page_title: #363636;
  --color_bg: #f0f0f0;
  --color_bg_nav: #f9f9f9;
  --color_bg_menu: #ffffff;
  --color_border: #e6e6e6;
  --color_border_light: rgba(0, 0, 0, 0.06);
  --color_border_soft: rgba(0, 0, 0, 0.03);
  --shadow: 0 0 30px rgba(0, 0, 0, 0.081);
  --radius: 6px;
  --fontsize: 14px;
  --base_height: 38px;
  --max_width: 1200px;
  --setting_width: 720px;
}

[data-theme='dark'] {
  --r: 69;
  --g: 128;
  --b: 255;
  --h: 221;
  --s: 100%;
  --l: 63.5%;
  --color_main: #4580ff;
  --color_text: #a2a5b9;
  --color_text_grey: #aaa;
  --color_text_contrast: white;
  --color_title: #aaaab3;
  --color_placeholder: #727272;
  --color_page_title: #999;
  --color_bg: #3b3b41;
  --color_bg_nav: #232326;
  --color_bg_menu: #2f2f34;
  --color_border: #404046;
  --color_border_light: rgba(255, 255, 255, 0.06);
  --color_border_soft: rgba(255, 255, 255, 0.03);
  --shadow: 0 0 30px rgba(255, 255, 255, 0.06);
}

body {
  font-family: 'Open Sans', sans-serif;
  font-size: var(--fontsize);
  line-height: 1.5;
  color: var(--color_text);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  border-radius: var(--radius);
  width: 100vw;
  overflow-x: hidden;
  background-color: var(--color_bg_menu);
}

#component {
  border-radius: var(--radius);
  padding: 0;
  margin: 0;
  width: 100vw;
}

input {
  font-family: 'Open Sans', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: var(--color_success);
  background-color: var(--color_bg_nav);
  border: 2px solid var(--color_border_soft);
  border-radius: var(--radius);
  padding: 12px 12px;
  width: calc(100% - 28px);
  height: 100%;
}

.view-mode input {
  background-color: var(--color_bg_nav);
  color: var(--color_success);
  border: 2px solid var(--color_bg_nav);
  border-radius: var(--radius);
  padding: 12px 12px;
  font-weight: 600;
  width: calc(100% - 28px);
  height: 100%;
  cursor: pointer;
  height: 230px;
  text-align: center;
}

.view-mode label {
  display: none;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color_success);
  margin-bottom: 6px;
  display: block;
}

/* input focus */
input:focus {
  outline: none;
  border: 2px solid var(--color_success);
}

.hidden {
  display: none;
}
```

public/iframes/edit/edit.js

```js
/**
 * When the component value changes
 * Should Send the change message to the xgen
 * @param {*} target
 */
function onComponentChange(target) {
  const value = target.value;
  const bind = target.dataset.bind;
  const namespace = target.dataset.namespace;

  console.log(
    `Component value changed: ${value} bind: ${bind} namespace: ${namespace}`
  );

  // Send the change message to the xgen
  window.parent.postMessage(
    { type: 'change', value: value, bind: bind, namespace: namespace },
    '*'
  );

  // Send the resize message to the xgen
  window.parent.postMessage(
    {
      type: 'resize',
      value: { height: '300px', width: '80%' },
      bind: bind,
      namespace: namespace
    },
    '*'
  );
}

/**
 * Get the initial data from the query string
 * When the value changes xgen will reload the iframe
 * This function will be called multiple times
 * @returns
 */
function initData() {
  // Parse the query string
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  // Xgen definition of the component
  const labelValue = urlParams.get('__label'); // __token , __label, __value, __namespace, __bind
  const bindValue = urlParams.get('__bind');
  const namespaceValue = urlParams.get('__namespace');
  const tokenValue = urlParams.get('__token');
  const typeValue = urlParams.get('__type');
  const disabledValue = urlParams.get('__disabled');
  const themeValue = urlParams.get('__theme');
  const localeValue = urlParams.get('__locale');

  label.innerHTML = `${labelValue} namespace: ${namespaceValue} bind: ${bindValue}`;
  const initValue = urlParams.get('__value');
  input.value = initValue;
  input.dataset.bind = bindValue;
  input.dataset.namespace = namespaceValue;
  input.dataset.type = typeValue;

  // Custom definition of the component ( DSL props.params )
  const foo = urlParams.get('foo');
  const name = urlParams.get('name');

  console.log(`Label: ${labelValue}`);
  console.log(`Bind: ${bindValue}`);
  console.log(`Namespace: ${namespaceValue}`);
  console.log(`Token: ${tokenValue}`);
  console.log(`Init value: ${initValue}`);
  console.log(`Foo: ${foo}`);
  console.log(`Name: ${name}`);
  console.log(`Type: ${typeValue}`);
  console.log(`Disabled: ${disabledValue}`);
  console.log(`Theme: ${themeValue}`);
  console.log(`Locale: ${localeValue}`);

  return {
    label: labelValue,
    bind: bindValue,
    namespace: namespaceValue,
    token: tokenValue,
    value: initValue,
    foo: foo,
    name: name,
    type: typeValue,
    disabled: disabledValue,
    theme: themeValue,
    locale: localeValue
  };
}

// 1. Listen the document ready event
// 2. Parse the query string get the initial data
// 3. Set the initial value
// 4. Set the change event listener
document.addEventListener('DOMContentLoaded', function () {
  const component = document.getElementById('component');
  component.classList.remove('hidden'); //   Remove the hidden class pure JS

  // Bind the event listener to the component
  const label = document.getElementById('label');
  const input = document.getElementById('input');
  input.addEventListener('change', function (e) {
    onComponentChange(e.target);
  });

  // Get the initial data from the query string
  // Set the initial value
  const init = initData();

  // Set the theme
  document.body.dataset.theme = init.theme;

  // Set the initial value
  input.value = init.value;

  // Set the initial disabled state
  if (init.disabled === 'true') {
    input.disabled = true;
  }

  // Set the initial label
  label.innerHTML = `
    <div>${init.label} namespace: ${init.namespace} bind: ${init.bind} foo: ${init.foo} name: ${init.name}</div> 
    <div> type: ${init.type} theme: ${init.theme} locale: ${init.locale} </div>
  `;

  // Set view mode
  // Can set the view mode differently based on the type
  if (init.type == 'view') {
    component.classList.add('view-mode');
    // Send the resize message to the xgen
    window.parent.postMessage(
      {
        type: 'resize',
        value: { height: '260px' },
        bind: init.bind,
        namespace: init.namespace
      },
      '*'
    );
  }

  // Could send the resize message to the xgen when the component is ready
  const height = component.offsetHeight;
  console.log(`Component ready height: ${height}px value: ${input.value}`);
});
```

xgen通过消息监听来自iframe的消息，然后更新组件的状态。

packages\cui\components\edit\Frame\index.tsx

```ts
import { Input } from 'antd'

import { Item } from '@/components'
import { getLocale } from '@umijs/max'
import { local, session } from '@yaoapp/storex'

import type { InputProps } from 'antd'
import type { App, Component } from '@/types'
import { Else, If, Then } from 'react-if'
import { useEffect, useRef, useState } from 'react'

interface IFrameIProps {
	url?: string
	params?: Record<string, string>
	height?: string
	width?: string
	data?: Record<string, any>

	__value: any // initial value
	value: any
	disabled?: boolean

	label?: string
	bind?: string
	namespace?: string
	type?: string
	onChange?: (v: any) => void
}

interface IProps extends Component.PropsEditComponent, IFrameIProps {
	ai?: { placeholder?: string }
}

const Frame = window.$app.memo((props: IFrameIProps) => {
	const { bind, label, namespace, type, disabled } = props
	const [value, setValue] = useState(props.value || props.__value)
	const ref = useRef<HTMLIFrameElement>(null)
	const getToken = (): string => {
		const is_session_token = local.token_storage === 'sessionStorage'
		const token = is_session_token ? session.token : local.token
		return token || ''
	}

	const getTheme = (): App.Theme => {
		const theme = (local.xgen_theme || 'light') as App.Theme
		return theme
	}

	const parseUrl = (url: string, params?: Record<string, string>, data?: Record<string, any>) => {
		if (url == '') return ''

		const token = getToken()
		const new_url = url.replace(/{{\s*([^}]+)\s*}}/gi, (match, p1) => {
			p1 = p1.trim()
			return data?.[p1] || ''
		})
		const new_params = new URLSearchParams()
		for (const key in params) {
			const value = params[key]
			new_params.append(
				key,
				value.replace(/\[\[\s*([^}]+)\s*\]\]/gi, (match, p1) => {
					p1 = p1.trim()
					return data?.[p1] || ''
				})
			)
		}
		new_params.append('__token', token)
		new_params.append('__locale', getLocale())
		new_params.append('__theme', getTheme())
		new_params.append('__value', value || '')
		new_params.append('__bind', bind || '')
		new_params.append('__label', label || '')
		new_params.append('__namespace', namespace || '')
		new_params.append('__type', type || '')
		new_params.append('__disabled', disabled ? 'true' : 'false')
		return `${new_url}?${new_params.toString()}`
	}

	// Generate url
	let url = ''
	try {
		url = parseUrl(props.url || '', props.params, props.data || {})
	} catch (error) {
		console.error('parseUrl error', error)
	}

	// Add event listener to receive message from iframe
	useEffect(() => {
		// Receive message from iframe
		const message = (e: MessageEvent) => {
			const data = e.data || {}
			const { type, value, bind, namespace } = data
			if (type === 'change' && bind === bind && namespace === namespace) {
				setValue(value)
				props.onChange?.(value)
				return
			}

			if (type === 'resize' && bind === bind && namespace === namespace) {
				const { height, width } = value
				if (!ref.current) {
					return
				}

				if (height) ref.current.style.height = height
				if (width) ref.current.style.width = width
			}
		}

		window.addEventListener('message', message)
		return () => window.removeEventListener('message', message)
	}, [])

	return (
		<If condition={url != ''}>
			<Then>
				<iframe
					ref={ref}
					className='w_100'
					src={url}
					style={{
						background: 'none',
						height: props.height || '100%',
						border: 'none',
						width: props.width || '100%'
					}}
				></iframe>
			</Then>
			<Else>
				<div className='w_100 border_box flex justify_center align_center'>No content</div>
			</Else>
		</If>
	)
})

const Index = (props: IProps) => {
	const { __bind, __namespace, __name, __type, itemProps, ...rest_props } = props
	return (
		<Item {...itemProps} {...{ __bind, __name }} noStyle>
			<Frame {...rest_props} namespace={__namespace} bind={__bind} label={__name} type={__type}></Frame>
		</Item>
	)
}

export default window.$app.memo(Index)

```

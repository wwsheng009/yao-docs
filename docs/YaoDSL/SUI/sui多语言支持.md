# SUI多语言支持

在开发国际化应用时，会有多语言的需求，根据页面的locale动态的翻译成不同国家的语言。

## 多语言页面声明

有两种方式可以实现多语言支持：

- 在html节点中使用属性`s:trans`进行修饰。
- 在变量中使用`::`进行修饰。

针对于静态文本信息，在外层加上一个节点属性`s:trans`，单行或是多行的文本。

针对变量，使用`::`进行修饰,相比于静态文本，变量的翻译会更加灵活，也可以使用表达式进行拼接。

如果是使用了`:::`进行修饰，也会自动的把变量的文本信息进行翻译。

```html
<div>{{ "::hello yao" }}</div>

<div>{{ '::hello world' + '::why you cry' }}</div>

<h1 s:trans>All-in-one App Engine</h1>

<span s:trans>
  is a free, open-source application engine that enables developers to create
  web apps, REST APIs, business applications, and more, with AI as a development
  partner.
</span>
```

## 多语言脚本翻译

除了在页面模板中直接翻译多语言，也可以在前端脚本`.ts`与后端脚本`.backend.ts`中使用内置函数**m来进行多语言处理，**m函数运行期间查找翻译文本。

```js
function hello(name) {
  console.log(__m('hello') + name);
  console.log(__m('hello') + name);

  // 还可以使用回调函数进行额外的处理，传入message与locales信息,locales为当前页面的语言配置信息
  console.log(__m('hello', (message, locales) => {}) + name);
}
```

## 使用工具生成翻译

SUI提供了一个工具，可以根据页面的文本信息，自动生成翻译文件。

在模板配置文件template.json中添加需要生成的语言列表。

`suis/sui_id/template_id/template.json`

```json
{
  "locales": [
    { "label": "English", "value": "en-us", "default": true }, //default为true时，不会生成翻译文件
    { "label": "简体中文", "value": "zh-cn" },
    { "label": "繁體中文", "value": "zh-hk" }
  ],
  "translator": "scripts.translator.Default" //使用AI处理器进行多语言翻译器
}
```

或是在模板目录下创建需要翻译页面的子目录。比如：

- `suis/sui_id/template_id/__locales/en-us`
- `suis/sui_id/template_id/__locales/zh-CN`
- `suis/sui_id/template_id/__locales/ja-jp`
- `suis/sui_id/template_id/__locales/zh-hk`

如果配置了translator，会自动的调用ai处理器进行处理。

在connectors目录下创建一个ai的连接器配置,key配置在`.env`文件中。
`connectors/deepseek-chat.conn.yao`

```json
{
  "label": "deepseek chat",
  "type": "openai",
  "options": {
    "model": "deepseek-chat",
    "key": "$ENV.DEEPSEEK_KEY",
    "proxy": "https://api.deepseek.com"
  }
}
```

在aigc目录下创建一个调用ai的配置：`/aigcs/translate.ai.yml`

```yaml
# Translate
name: Translate
connector: deepseek-chat
prompts:
  - role: system
    content: |
      - Translate the given the "messages" field value.
      - The target language is "language" field.
      - Keep the original key, replace the value with the translated message.
      - Answer the translated object only.
      - Do not change the structure of the object.
      - Do not explain your answer, and do not use punctuation.
      - Do not add your own punctuation marks.

optional:
  autopilot: true
```

脚本示例：

```js
import { Locale } from '@yao/sui';
import { Process, time } from '@yaoapps/client';

export function Default(
  locale: string,//语言,比如zh-cn
  data: Locale,//Locale配置，包含需要翻译的文本信息，最重要的是messages属性，包含需要翻译的文本信息
  route: string,//页面路由
  tmpl: string,//页面模板路径
  retry: number = 1
): Locale { //返回翻译后的messages属性与keys属性，最后保存到__locales/localeID/pageID.yml文件中
  const payload = {
    messages: data.messages || {},
    language: locale
  };

  if (Object.keys(payload.messages).length === 0) {
    console.log(`No translation ${route}`);
    return data;
  }

  if (retry > 3) {
    console.log(`Failed to translate ${route} with ${locale} locale`);
    return data;
  }

  console.log(
    `Translating ${route} with ${locale} locale ${
      retry > 1 ? `(${retry})` : ''
    }`
  );
   //   使用了ai处理器进行翻译
  const res = Process('aigcs.translate', JSON.stringify(payload));
  try {
    const translated = JSON.parse(res);
    if (translated.messages) {
      return {
        keys: data.keys,
        messages: translated.messages
      };
    }

    time.Sleep(200);
    return Default(locale, data, route, tmpl, retry + 1);
  } catch (e) {
    time.Sleep(200);
    return Default(locale, data, route, tmpl, retry + 1);
  }
}

```

## 翻译命令

使用命令`yao sui trans`来进行翻译，此命令会扫描在页面模板中所有的需要翻译的文本信息，然后调用ai处理器进行翻译。

命令会自动的创建对应的翻译文件。

- 页面中使用了属性`s:trans`进行修饰的文本信息
- 变量中使用了`::`进行修饰的文本信息

执行命令时可使用参数`-D`来进行调试，编译的脚本不会自动压缩，而且会自动的全局变量打印到控制台。

```sh
yao sui trans sui_id template_id -D

# 翻译本地所有语言的所有页面
yao sui trans blog website -D

# 翻译本地指定语言的所有页面
yao sui trans blog website -l 'zh-cn,ja-jp' -D

# 最后执行编译命令
yao sui build blog website -D
```

## 全局配置

另外如果多个页面存在相同的语言配置，可以使用全局翻译配置。

全局配置，在`template/__locales/langugeID/__global.yml`中配置，需要手动创建此文件。

如果页面中引用了组件component,页面配置会把组件的配置合并到页面配置中。

页面配置，在页面的`template/__locales/langugeID/pageID.yml`中配置,如果有子目录，在子目录中配置。

## 语言配置文件格式

yml文件的配置格式如下,其中的key是在页面中使用的文本值，value是对应的翻译值，可以配置单行或是多行的文本，建议使用上面提供的trans命令结合ai处理器进行生成。

```yaml
messages:
  All-in-one App Engine: All-in-one App Engine
  Getting Started: 入门指南
  ? |-
    is a free, open-source application engine that allows developers to
            create web apps, REST APIs, enterprise apps and more, with AI as a
            seamless collaborator.
  : 是一个免费的开源应用引擎，允许开发人员创建Web应用程序、REST API、企业应用程序等，AI作为一个无缝的合作者。
```

## 编译模板

```sh
yao sui build sui_id template_id
```

## 切换语言

在前端页面中可以通过cookie来配置语言，再刷新页面就会显示新的翻译文本，如果没有配置语言，直接输出页面文本。

```js
document.cookie = 'locale=zh-CN';
```

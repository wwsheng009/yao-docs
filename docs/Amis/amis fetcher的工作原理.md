# amis fetcher 的工作原理

input-tree 控件的 deleteApi 请求没有携带 data 属性。

deleteApi 使用的 delete 方法的请求，而 delete 的请求是不会有 data 属性的。

解决方法是修改成 post 方法或是在 url 中携带参数。

原理分析：

当在 amis 配置页面中使用 http 请求时，会使用全局配置的 fetcher 进行数据的请求与接收。

实际上配置的 fetcher 函数会在 amis 的框架内被封装处理。

```js
// amis 3.3
// \amis\packages\amis-core\src\utils\api.ts

export function wrapFetcher(
  fn: (config: fetcherConfig) => Promise<fetcherResult>,//这里的fn是客户配置的fetcher函数
  tracker?: (eventTrack: EventTrack, data: any) => void
) {
  // 避免重复处理
  if ((fn as any)._wrappedFetcher) {
    return fn as any;
  }

  const wrappedFetcher = async function (
    api: Api,
    data: object,//业务数据
    options?: object
  ) {
    //处理后的api参数
    api = buildApi(api, data, options) as ApiObject;

    if (api.requestAdaptor) {
      debug('api', 'before requestAdaptor', api);
      api = (await api.requestAdaptor(api, data)) || api;
      debug('api', 'after requestAdaptor', api);
    }

    if (
      api.data &&
      (api.data instanceof FormData ||
        hasFile(api.data) ||
        api.dataType === 'form-data')
    ) {
      api.data =
        api.data instanceof FormData
          ? api.data
          : object2formData(api.data, api.qsOptions);
    } else if (
      api.data &&
      typeof api.data !== 'string' &&
      api.dataType === 'form'
    ) {
      api.data = qsstringify(api.data, api.qsOptions) as any;
      api.headers = api.headers || (api.headers = {});
      api.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (
      api.data &&
      typeof api.data !== 'string' &&
      api.dataType === 'json'
    ) {
      api.data = JSON.stringify(api.data) as any;
      api.headers = api.headers || (api.headers = {});
      api.headers['Content-Type'] = 'application/json';
    }

    // 如果发送适配器中设置了 mockResponse
    // 则直接跳过请求发送
    if (api.mockResponse) {
      return wrapAdaptor(Promise.resolve(api.mockResponse) as any, api, data);
    }

    if (!isValidApi(api.url)) {
      throw new Error(`invalid api url:${api.url}`);
    }

    debug('api', 'request api', api);

    tracker?.(
      {eventType: 'api', eventData: omit(api, ['config', 'data', 'body'])},
      api.data
    );

    if (api.method?.toLocaleLowerCase() === 'jsonp') {
      return wrapAdaptor(jsonpFetcher(api), api, data);
    }

    if (api.method?.toLocaleLowerCase() === 'js') {
      return wrapAdaptor(jsFetcher(fn, api), api, data);
    }

    if (typeof api.cache === 'number' && api.cache > 0) {
      const apiCache = getApiCache(api);
      return wrapAdaptor(
        apiCache
          ? (apiCache as ApiCacheConfig).cachedPromise
          : setApiCache(api, fn(api)),
        api,
        data
      );
    }
    // IE 下 get 请求会被缓存，所以自动加个时间戳
    if (isIE && api && api.method?.toLocaleLowerCase() === 'get') {
      const timeStamp = `_t=${Date.now()}`;
      if (api.url.indexOf('?') === -1) {
        api.url = api.url + `?${timeStamp}`;
      } else {
        api.url = api.url + `&${timeStamp}`;
      }
    }
    //在这里调用了原始的fetcher配置函数，而fetcher的参数api需要经过上面的处理。
    return wrapAdaptor(fn(api), api, data);
  };

  (wrappedFetcher as any)._wrappedFetcher = true;

  return wrappedFetcher;
}

```

非常重要的处理函数，封装了 api 请求的参数。

```js

export function buildApi(
  api: Api,//原始的请求参数
  data?: object,//业务数据
  options: {
    autoAppend?: boolean;
    ignoreData?: boolean;
    [propName: string]: any;
  } = {}
): ApiObject {
  api = normalizeApi(api, options.method);
  const {autoAppend, ignoreData, ...rest} = options;

//请求参数的config属性处理
  api.config = {
    ...rest
  };
  api.method = (api.method || (options as any).method || 'get').toLowerCase();

  //headers是否使用公式引用了data
  if (api.headers) {
    api.headers = dataMapping(api.headers, data, undefined, false);
  }

  if (api.requestAdaptor && typeof api.requestAdaptor === 'string') {
    api.requestAdaptor = str2AsyncFunction(
      api.requestAdaptor,
      'api',
      'context'
    ) as any;
  }

  if (api.adaptor && typeof api.adaptor === 'string') {
    api.adaptor = str2AsyncFunction(
      api.adaptor,
      'payload',
      'response',
      'api',
      'context'
    ) as any;
  }

  if (!data) {
    return api;
  } else if (
    data instanceof FormData ||
    data instanceof Blob ||
    data instanceof ArrayBuffer
  ) {
    //api参数中的data属性赋值
    //只有传入数据是表单数据，数组，二进制文件才会传给api的data属性。
    api.data = data;
    return api;
  }

  const raw = (api.url = api.url || '');
  let ast: any = undefined;
  try {
    ast = memoryParse(api.url);
  } catch (e) {
    console.warn(`api 配置语法出错：${e}`);
    return api;
  }
  const url = ast.body
    .map((item: any, index: number) => {
      return item.type === 'raw' ? item.value : `__expression__${index}__`;
    })
    .join('');

  const idx = url.indexOf('?');
  let replaceExpression = (
    fragment: string,
    defaultFilter = 'url_encode',
    defVal: any = undefined
  ) => {
    return fragment.replace(
      /__expression__(\d+)__/g,
      (_: any, index: string) => {
        return (
          evaluate(ast.body[index], data, {
            defaultFilter: defaultFilter
          }) ?? defVal
        );
      }
    );
  };

  // 是否过滤空字符串 query
  const queryStringify = (query: any) =>
    qsstringify(
      query,
      (api as ApiObject)?.filterEmptyQuery
        ? {
            filter: (key: string, value: any) => {
              return value === '' ? undefined : value;
            }
          }
        : undefined
    );
  /** 追加data到请求的Query中 */
  const attachDataToQuery = (
    apiObject: ApiObject,
    ctx: Record<string, any>,
    merge: boolean
  ) => {
    const idx = apiObject.url.indexOf('?');
    if (~idx) {
      const params = (apiObject.query = {
        ...qsparse(apiObject.url.substring(idx + 1)),
        ...apiObject.query,
        ...ctx
      });
      apiObject.url =
        apiObject.url.substring(0, idx) + '?' + queryStringify(params);
    } else {
      apiObject.query = {...apiObject.query, ...ctx};
      const query = queryStringify(merge ? apiObject.query : ctx);
      if (query) {
        apiObject.url = `${apiObject.url}?${query}`;
      }
    }

    return apiObject;
  };

  if (~idx) {
    const hashIdx = url.indexOf('#');
    const params = qsparse(
      url.substring(idx + 1, ~hashIdx && hashIdx > idx ? hashIdx : undefined)
    );

    // 将里面的表达式运算完
    JSONTraverse(params, (value: any, key: string | number, host: any) => {
      if (typeof value === 'string' && /^__expression__(\d+)__$/.test(value)) {
        host[key] = evaluate(ast.body[RegExp.$1].body, data) ?? '';
      } else if (typeof value === 'string') {
        // 参数值里面的片段不能 url_encode 了，所以是不处理
        host[key] = replaceExpression(host[key], 'raw', '');
      }
    });

    const left = replaceExpression(url.substring(0, idx), 'raw', '');

    // 追加
    Object.assign(params, api.query);
    api.url =
      left +
      (~left.indexOf('?') ? '&' : '?') +
      queryStringify(
        (api.query = dataMapping(params, data, undefined, api.convertKeyToPath))
      ) +
      (~hashIdx && hashIdx > idx
        ? replaceExpression(url.substring(hashIdx))
        : '');
  } else {
    api.url = replaceExpression(url, 'raw', '');
  }

  if (ignoreData) {
    return api;
  }

  if (api.data) {
    api.body = api.data = dataMapping(
      api.data,
      data,
      undefined,
      api.convertKeyToPath
    );
  } else if (
    api.method === 'post' ||
    api.method === 'put' ||
    api.method === 'patch'
  ) {
    //api body赋值,除了以上三种方法以外的方法data不会赋值给api.data
    api.body = api.data = data;
  }

  // 给 query 做数据映射
  if (api.query) {
    api.query = dataMapping(api.query, data, undefined, api.convertKeyToPath);
  }

  // get 类请求，把 data 附带到 url 上。
  if (api.method === 'get' || api.method === 'jsonp' || api.method === 'js') {
    if (
      !api.data &&
      ((!~raw.indexOf('$') && autoAppend) || api.forceAppendDataToQuery)
    ) {
      api.data = data;
      api.query = {
        ...api.query,
        ...data
      };
    } else if (
      api.attachDataToQuery === false &&
      api.data &&
      ((!~raw.indexOf('$') && autoAppend) || api.forceAppendDataToQuery)
    ) {
      api = attachDataToQuery(api, data, false);
    }

    if (api.data && api.attachDataToQuery !== false) {
      api = attachDataToQuery(api, api.data, true);
      delete api.data;
    }
  }
  // 非 get 类请求也可以携带参数到 url，只要 query 有值
  else if (api.method) {
    const idx = api.url.indexOf('?');
    if (~idx) {
      let params = (api.query = {
        ...qsparse(api.url.substring(idx + 1)),
        ...api.query
      });
      api.url = api.url.substring(0, idx) + '?' + queryStringify(params);
    } else {
      const query = queryStringify(api.query);
      if (query) {
        api.url = `${api.url}?${query}`;
      }
    }
  }

  if (api.graphql) {
    if (api.method === 'get') {
      api.query = api.data = {...api.query, query: api.graphql};
    } else if (
      api.method === 'post' ||
      api.method === 'put' ||
      api.method === 'patch'
    ) {
      api.body = api.data = {
        query: api.graphql,
        operationName: api.operationName,
        variables: cloneObject(api.data)
      };
    }
  } else if (api.jsonql) {
    api.method = 'post';
    api.jsonql = dataMapping(
      api.jsonql,
      /** 需要上层数据域的内容 */
      extendObject(data, {...api.query, ...data}, false),
      undefined,
      false,
      true
    );
    /** 同时设置了JSONQL和data时走兼容场景 */
    api.body = api.data =
      api.data && api.jsonql
        ? {
            data: api.data,
            jsonql: api.jsonql
          }
        : api.jsonql;

    /** JSONQL所有method需要追加data中的变量到query中 */
    if (api.forceAppendDataToQuery) {
      api = attachDataToQuery(api, data, true);
    }
  }

  return api;
}
```

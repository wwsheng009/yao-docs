# Xgen 批量上传功能

xgen 本身有批量上传功能，但是上传控件少了一个参数`api`。

在 apis 目录定义一个新的`/api/storage/upload`:

```json
{
  "name": "存储接口",
  "version": "1.0.0",
  "description": "存储接口API",
  "group": "storage",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/upload",
      "method": "POST",
      "process": "fs.system.Upload",
      "in": ["$file.file"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/download",
      "method": "GET",
      "guard": "-",
      "process": "fs.system.Download",
      "in": ["$query.name"],
      "out": {
        "status": 200,
        "body": "{{content}}",
        "headers": { "Content-Type": "{{type}}" }
      }
    }
  ]
}
```

当在 api 中的传入参数中使用了`$file`引用符，yao 框架会把上传的文件保存成临时文件。并返回一个文件数据结构为 UploadFile 的对象。

```go
type UploadFile struct {
    Name     string               `json:"name"`
    TempFile string               `json:"tempFile"`
    Size     int64                `json:"size"`
    Header   textproto.MIMEHeader `json:"mimeType"`
}
```

自定义文件上传功能

```js
//scripts.file.upload
function upload(file) {
  // "map[mimeType:map[Content-Disposition:[form-data; name=\"file\"; filename=\"blob\"] Content-Type:[image/png]] name:blob size:108505 tempFile:C:\\Users\\USER\\AppData\\Local\\Temp\\upload2241272960\\file-2567307823]"

  // 这里不能直接使用处理器fs.system.Upload，因为经过js桥接后，数据结构已经变化。
  // https://github.com/wwsheng009/gou/commit/7fafef2100057343024e6fbe7728fd7d58cb28c9

  // 读取临时文件
  const f = Process('fs.system.ReadFile', file.tempFile);

  const ts = Process('utils.now.Timestampms');
  // 自定义文件路径
  const fn = `/data/${ts}`;
  // 写入文件
  Process('fs.system.WriteFile', fn, f, '0644');
  // 返回文件下载地址
  return `/yao-api/download?name=${fn}`;
}
```

xgen 源代码尝试修复如下：
https://github.com/wwsheng009/xgen/commit/8bac8871c9986efc13d0e8e7762e5b74bbf4fb85

gou 代码修复 fs.system.Upload 类型报错：
https://github.com/wwsheng009/gou/commit/7fafef2100057343024e6fbe7728fd7d58cb28c9

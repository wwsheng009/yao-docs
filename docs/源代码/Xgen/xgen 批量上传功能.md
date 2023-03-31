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
    }
}

```

源代码尝试修复如下：
https://github.com/wwsheng009/xgen/commit/8bac8871c9986efc13d0e8e7762e5b74bbf4fb85

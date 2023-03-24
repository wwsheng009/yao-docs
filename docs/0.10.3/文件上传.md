# 文件上传

控件绑定的字段对应的模型的字段类型需要是`json`

文件上传的控件类型是`Upload`,文件类型`filetype`支持三种:`video`,`image`,`file`

```json
{
  "下载地址": {
    "view": {
      "type": "A",
      "compute": "Download",
      "props": {}
    },
    "edit": {
      "type": "Upload",
      "compute": "Upload",
      "props": {
        "filetype": "file",
        "$api": {
          "process": "fs.system.Upload"
        }
      }
    },
    "bind": "url"
  }
}
```
